import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { EmailConfirmationPage } from './components/auth/EmailConfirmationPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { DatabaseSelector } from './components/members/DatabaseSelector';
import { MembersTable } from './components/members/MembersTable';
import { FormManagementPage } from './components/forms/FormManagementPage';
import { DynamicFormRenderer } from './components/forms/DynamicFormRenderer';
import { PublicFormView } from './components/forms/PublicFormView';
import { SettingsPage } from './components/settings/SettingsPage';
import { DatabaseType } from './types';

// Wrapper component for public form route
function PublicFormRoute() {
  const { token } = useParams<{ token: string }>();
  return <PublicFormView token={token || ''} />;
}

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
    return (
      <>
        {authView === 'login' ? (
          <LoginPage onShowRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage 
            onShowLogin={() => setAuthView('login')}
            onRegistrationSuccess={(email) => {
              setRegisteredEmail(email);
              setAuthView('email-confirmation');
            }}
          />
        )}
        
        {/* Email Confirmation Modal */}
        {authView === 'email-confirmation' && (
          <EmailConfirmationPage 
            email={registeredEmail}
            onBackToLogin={() => setAuthView('login')}
          />
        )}
      </>
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
        return (
          <MembersTable 
            databaseType={selectedDatabase}
            onBack={() => setSelectedDatabase(null)}
          />
        );
      case 'forms':
        return <FormManagementPage />;
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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route - no authentication required */}
          <Route path="/public/form/:token" element={<PublicFormRoute />} />
          
          {/* All other routes require authentication */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
