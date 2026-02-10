/**
 * Unified API Client with Authentication, Auto-Refresh, and Activity Tracking
 * 
 * Features:
 * - Automatic token attachment
 * - 401 interceptor with refresh-retry logic
 * - Token expiry checking
 * - Activity tracking (frontend and API)
 * - Auto-logout on inactivity or token expiry
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Use environment variable with a LOCAL fallback.
// NOTE: Avoid hard-coding a production URL here; it can accidentally point deployments to an old backend.
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Activity tracking configuration
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
let inactivityTimer: NodeJS.Timeout | null = null;
let logoutCallback: (() => void) | null = null;

// Token expiry tracking
let tokenExpiryTimer: NodeJS.Timeout | null = null;

/**
 * Update last activity timestamp
 */
const updateActivity = () => {
  // Reset inactivity timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    console.log('⏰ User inactive for 15 minutes - logging out');
    handleInactivityLogout();
  }, INACTIVITY_TIMEOUT);
};

/**
 * Handle inactivity logout
 */
const handleInactivityLogout = () => {
  if (logoutCallback) {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('zomi_user');
    
    // Call logout callback (AuthContext will handle routing)
    logoutCallback();
  }
};

/**
 * Register logout callback from AuthContext
 */
export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
  // Start activity tracking
  updateActivity();
};

/**
 * Track token expiry and auto-logout when expired
 */
export const scheduleTokenExpiry = (expiresIn: number) => {
  // Clear existing timer
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer);
  }
  
  // Set new timer (subtract 30 seconds buffer)
  const expiryMs = (expiresIn - 30) * 1000;
  
  tokenExpiryTimer = setTimeout(() => {
    console.log('🔒 Token expired - logging out');
    handleInactivityLogout();
  }, expiryMs);
};

/**
 * Clear all timers (on manual logout)
 */
export const clearActivityTimers = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer);
    tokenExpiryTimer = null;
  }
};

/**
 * Create axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Flag to prevent infinite refresh loops
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

/**
 * Request interceptor - attach token and track activity
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Track activity on API call
    updateActivity();
    
    // Attach access token
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle 401 with refresh/retry
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints
      if (originalRequest.url?.includes('/api/auth/')) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refresh_token');

        // If we have no refresh token, we cannot refresh – force logout to avoid noisy loops.
        if (!refreshToken) {
          isRefreshing = false;
          if (logoutCallback) {
            logoutCallback();
          }
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data.data;
        
        // Update tokens
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        // Schedule token expiry
        if (expires_in) {
          scheduleTokenExpiry(expires_in);
        }
        
        // Update original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        
        // Notify all queued requests
        onTokenRefreshed(access_token);
        
        isRefreshing = false;
        
        // Retry original request
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - logout user
        isRefreshing = false;
        console.error('Token refresh failed:', refreshError);
        
        // Clear tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('zomi_user');
        
        // Trigger logout
        if (logoutCallback) {
          logoutCallback();
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
