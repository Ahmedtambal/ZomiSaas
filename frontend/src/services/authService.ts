/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import apiClient, { API_URL, scheduleTokenExpiry } from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface AdminSignupRequest {
  full_name: string;
  email: string;
  password: string;
  job_title: string;
  organization_name: string;
  role: 'admin';
}

interface UserSignupRequest {
  full_name: string;
  email: string;
  password: string;
  job_title: string;
  invite_code: string;
  role: 'user';
}

interface AuthResponse {
  message: string;
  email_confirmation_required?: boolean;
  email?: string;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: {
      id: string;
      organization_id: string;
      full_name: string;
      email: string;
      job_title: string;
      role: string;
      is_active: boolean;
      is_email_verified: boolean;
      created_at: string;
      updated_at: string;
    };
  };
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface RefreshTokenResponse {
  message: string;
  data: {
    access_token: string;
    refresh_token?: string; // Backend may provide new refresh token
    token_type: string;
    expires_in: number;
  };
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  /**
   * Admin signup - creates organization and admin user
   */
  async signupAdmin(data: Omit<AdminSignupRequest, 'role'>): Promise<AuthResponse> {
    const response = await apiClient.post('/api/auth/signup/admin', { ...data, role: 'admin' });
    
    const result: AuthResponse = response.data;
    
    // Only set tokens if they exist (not required for email confirmation)
    if (result.data) {
      this.setTokens(result.data.access_token, result.data.refresh_token);
      scheduleTokenExpiry(result.data.expires_in);
    }
    
    return result;
  }

  /**
   * User signup - requires valid invite code
   */
  async signupUser(data: Omit<UserSignupRequest, 'role'>): Promise<AuthResponse> {
    const response = await apiClient.post('/api/auth/signup/user', { ...data, role: 'user' });
    
    const result: AuthResponse = response.data;
    
    // Only set tokens if they exist (not required for email confirmation)
    if (result.data) {
      this.setTokens(result.data.access_token, result.data.refresh_token);
      scheduleTokenExpiry(result.data.expires_in);
    }
    
    return result;
  }

  /**
   * Login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/api/auth/login', credentials);
    
    const result: AuthResponse = response.data;
    this.setTokens(result.data.access_token, result.data.refresh_token);
    scheduleTokenExpiry(result.data.expires_in);
    return result;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/api/auth/refresh', { 
      refresh_token: this.refreshToken 
    });
    
    const result: RefreshTokenResponse = response.data;
    this.setAccessToken(result.data.access_token);
    
    // Update refresh token if backend provides a new one
    if (result.data.refresh_token) {
      this.refreshToken = result.data.refresh_token;
      localStorage.setItem('refresh_token', result.data.refresh_token);
    }
    
    scheduleTokenExpiry(result.data.expires_in);
    return result.data.access_token;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await apiClient.post('/api/auth/logout', { 
          refresh_token: this.refreshToken 
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    this.clearTokens();
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<void> {
    const response = await apiClient.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  }

  /**
   * Update password with reset token
   */
  async updatePassword(newPassword: string, token: string): Promise<void> {
    const response = await apiClient.post(`${API_URL}/auth/reset-password`, { 
      password: newPassword,
      token 
    });
    return response.data;
  }

  /**
   * Set tokens
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Set access token only
   */
  private setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
    localStorage.setItem('access_token', accessToken);
  }

  /**
   * Clear tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('zomi_user');
  }
}

export const authService = new AuthService();
export type { AdminSignupRequest, UserSignupRequest, LoginRequest, AuthResponse };
