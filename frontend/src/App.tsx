import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailConfirmationPage } from './components/auth/EmailConfirmationPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { DatabaseSelector } from './components/members/DatabaseSelector';
import { MembersTable } from './components/members/MembersTable';
import { FormGenerator } from './components/forms/FormGenerator';
import { DynamicFormRenderer } from './components/forms/DynamicFormRenderer';
import { SettingsPage } from './components/settings/SettingsPage';
import { DatabaseType, IO_UPLOAD_COLUMNS, NEW_EMPLOYEE_UPLOAD_COLUMNS } from './types';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'email-confirmation'>('login');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [dynamicFormId, setDynamicFormId] = useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8">
          <div className="w-12 h-12 border-4 border-zomi-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'email-confirmation') {
      return (
        <EmailConfirmationPage 
          email={registeredEmail}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    
    return authView === 'login' ? (
      <LoginPage onShowRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage 
        onShowLogin={() => setAuthView('login')}
        onRegistrationSuccess={(email) => {
          setRegisteredEmail(email);
          setAuthView('email-confirmation');
        }}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'members':
        if (selectedDatabase === null) {
          return <DatabaseSelector onSelectDatabase={setSelectedDatabase} />;
        }
        const columns = selectedDatabase === 'ioUpload' ? IO_UPLOAD_COLUMNS : NEW_EMPLOYEE_UPLOAD_COLUMNS;
        return (
          <MembersTable 
            columns={columns}
            databaseType={selectedDatabase}
            onBack={() => setSelectedDatabase(null)}
          />
        );
      case 'forms':
        return <FormGenerator />;
      case 'settings':
        return <SettingsPage />;
      case 'dynamicForm':
        return dynamicFormId ? <DynamicFormRenderer formId={dynamicFormId} /> : <ExecutiveDashboard />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <DashboardLayout 
      currentPage={currentPage} 
      onNavigate={(page, formId) => {
        setCurrentPage(page);
        if (page !== 'members') {
          setSelectedDatabase(null);
        }
        if (formId) {
          setDynamicFormId(formId);
        }
      }}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
