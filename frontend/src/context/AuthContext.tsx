import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/authService';
import { registerLogoutCallback, clearActivityTimers, scheduleTokenExpiry } from '../services/apiClient';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  registerAdmin: (fullName: string, email: string, password: string, jobTitle: string, organizationName: string) => Promise<void>;
  registerUser: (fullName: string, email: string, password: string, jobTitle: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check if user is authenticated on mount
    const storedUser = localStorage.getItem('zomi_user');
    const accessToken = authService.getAccessToken();
    
    if (storedUser && accessToken) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Register inactivity logout callback
      registerLogoutCallback(() => {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
      
      // Start activity tracking (mouse/keyboard)
      const trackActivity = () => {
        // Activity is tracked by apiClient automatically
        // This just ensures DOM events keep the session alive
      };
      
      window.addEventListener('mousemove', trackActivity);
      window.addEventListener('keydown', trackActivity);
      window.addEventListener('click', trackActivity);
      window.addEventListener('scroll', trackActivity);
      
      return () => {
        window.removeEventListener('mousemove', trackActivity);
        window.removeEventListener('keydown', trackActivity);
        window.removeEventListener('click', trackActivity);
        window.removeEventListener('scroll', trackActivity);
      };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.full_name,
        role: response.data.user.role || 'user',
        createdAt: response.data.user.created_at,
      };

      localStorage.setItem('zomi_user', JSON.stringify(user));
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Register logout callback for inactivity
      registerLogoutCallback(() => {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerAdmin = async (
    fullName: string,
    email: string,
    password: string,
    jobTitle: string,
    organizationName: string
  ) => {
    try {
      const response = await authService.signupAdmin({
        full_name: fullName,
        email,
        password,
        job_title: jobTitle,
        organization_name: organizationName,
      });

      // Check if email confirmation is required
      if (response.email_confirmation_required) {
        // Don't set auth state, just return to show confirmation page
        return;
      }

      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.full_name,
        role: response.data.user.role || 'owner',
        createdAt: response.data.user.created_at,
      };

      localStorage.setItem('zomi_user', JSON.stringify(user));
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Admin registration error:', error);
      throw error;
    }
  };

  const registerUser = async (
    fullName: string,
    email: string,
    password: string,
    jobTitle: string,
    inviteCode: string
  ) => {
    try {
      const response = await authService.signupUser({
        full_name: fullName,
        email,
        password,
        job_title: jobTitle,
        invite_code: inviteCode,
      });

      // Check if email confirmation is required
      if (response.email_confirmation_required) {
        // Don't set auth state, just return to show confirmation page
        return;
      }

      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.full_name,
        role: response.data.user.role || 'user',
        createdAt: response.data.user.created_at,
      };

      localStorage.setItem('zomi_user', JSON.stringify(user));
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('User registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear activity timers
      clearActivityTimers();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, registerAdmin, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
