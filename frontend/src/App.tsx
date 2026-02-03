import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationContainer } from './components/common/NotificationContainer';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { DatabaseSelector } from './components/members/DatabaseSelector';
import { MembersTable } from './components/members/MembersTable';
import { ChangeInformationTable } from './components/members/ChangeInformationTable';
import { FormManagementPage } from './components/forms/FormManagementPage';
import { DynamicFormRenderer } from './components/forms/DynamicFormRenderer';
import { PublicFormView } from './components/forms/PublicFormView';
import { SettingsPage } from './components/settings/SettingsPage';
import AuditLogsPage from './components/audit/AuditLogsPage';
import { DatabaseType } from './types';

// Wrapper component for public form route
function PublicFormRoute() {
  const { token } = useParams<{ token: string }>();
  return <PublicFormView token={token || ''} />;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
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
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Members route with database selection
function MembersRoute() {
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(null);
  
  if (selectedDatabase === null) {
    return <DatabaseSelector onSelectDatabase={setSelectedDatabase} />;
  }

  if (selectedDatabase === 'changeInformation') {
    return (
      <ChangeInformationTable 
        databaseType={selectedDatabase}
        onBack={() => setSelectedDatabase(null)}
      />
    );
  }
  
  return (
    <MembersTable 
      databaseType={selectedDatabase}
      onBack={() => setSelectedDatabase(null)}
    />
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8">
          <div className="w-12 h-12 border-4 border-zomi-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/public/form/:token" element={<PublicFormRoute />} />
      
      {/* Auth routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout currentPage="dashboard">
              <ExecutiveDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/members" 
        element={
          <ProtectedRoute>
            <DashboardLayout currentPage="members">
              <MembersRoute />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/forms" 
        element={
          <ProtectedRoute>
            <DashboardLayout currentPage="forms">
              <FormManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit-logs" 
        element={
          <ProtectedRoute>
            <DashboardLayout currentPage="audit-logs">
              <AuditLogsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <DashboardLayout currentPage="settings">
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <NotificationContainer />
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
