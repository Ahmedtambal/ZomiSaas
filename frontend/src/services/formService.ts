import axios from 'axios';
import { FormDefinition, FormSubmission, FormToken } from '../types/forms';

const API_URL = import.meta.env.VITE_API_URL || 'https://zomisaasbackend.onrender.com';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// Authenticated Form Management
// =====================================================

export interface CreateFormData {
  name: string;
  description?: string;
  form_data: any;
  template_type?: 'custom' | 'sw_new_employee' | 'io_upload';
  linked_company_id?: string;
}

export interface UpdateFormData {
  name?: string;
  description?: string;
  form_data?: any;
  is_active?: boolean;
}

export interface GenerateTokenData {
  company_id: string;
  expiry_days?: number;
  max_submissions?: number;
  metadata?: Record<string, any>;
}

export interface UpdateTokenData {
  is_active?: boolean;
  expiry_days?: number;
  max_submissions?: number;
}

/**
 * Create a new form
 */
export const createForm = async (formData: CreateFormData): Promise<FormDefinition> => {
  const response = await api.post('/api/forms', formData);
  return response.data;
};

/**
 * Get all forms for the organization with optional filters
 */
export const getForms = async (filters?: {
  organizationId?: string;
  templateType?: string;
  isActive?: boolean;
}): Promise<FormDefinition[]> => {
  const params = new URLSearchParams();
  if (filters?.organizationId) params.append('organization_id', filters.organizationId);
  if (filters?.templateType) params.append('template_type', filters.templateType);
  if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
  
  const response = await api.get(`/api/forms?${params.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Get a specific form by ID
 */
export const getForm = async (formId: string): Promise<FormDefinition> => {
  const response = await api.get(`/api/forms/${formId}`);
  return response.data;
};

/**
 * Update a form (creator only)
 */
export const updateForm = async (formId: string, formData: UpdateFormData): Promise<FormDefinition> => {
  const response = await api.put(`/api/forms/${formId}`, formData);
  return response.data;
};

/**
 * Refresh form with latest SW Employee template
 */
export const refreshFormTemplate = async (formId: string): Promise<FormDefinition> => {
  const response = await api.put(`/api/forms/${formId}/refresh-template`);
  return response.data;
};

/**
 * Delete a form (creator only)
 */
export const deleteForm = async (formId: string): Promise<void> => {
  await api.delete(`/api/forms/${formId}`);
};

/**
 * Generate a new token for a form
 */
export const generateToken = async (formId: string, tokenData: GenerateTokenData): Promise<FormToken> => {
  const response = await api.post(`/api/forms/${formId}/tokens`, tokenData);
  return response.data;
};

/**
 * Get all tokens for a form
 */
export const getTokens = async (formId: string, filters?: {
  isActive?: boolean;
  companyId?: string;
}): Promise<FormToken[]> => {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
  if (filters?.companyId) params.append('company_id', filters.companyId);
  
  const response = await api.get(`/api/forms/${formId}/tokens?${params.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Update a token (deactivate, extend expiry, etc.)
 */
export const updateToken = async (tokenId: string, updates: UpdateTokenData): Promise<FormToken> => {
  const response = await api.put(`/api/forms/tokens/${tokenId}`, updates);
  return response.data;
};

/**
 * Get form submissions
 */
export const getSubmissions = async (formId: string, filters?: {
  companyId?: string;
  tokenId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FormSubmission[]> => {
  const params = new URLSearchParams();
  if (filters?.companyId) params.append('company_id', filters.companyId);
  if (filters?.tokenId) params.append('token_id', filters.tokenId);
  if (filters?.startDate) params.append('start_date', filters.startDate);
  if (filters?.endDate) params.append('end_date', filters.endDate);
  
  const response = await api.get(`/api/forms/${formId}/submissions?${params.toString()}`);
  return Array.isArray(response.data) ? response.data : [];
};

// =====================================================
// Public Form Access (No Authentication)
// =====================================================

/**
 * Get form by token (public access)
 */
export const getFormByToken = async (token: string): Promise<{
  form: FormDefinition;
  company: any;
  token_info: {
    max_submissions: number | null;
    submission_count: number;
    expires_at: string | null;
  };
}> => {
  const response = await axios.get(`${API_URL}/api/public/forms/${token}`);
  return response.data;
};

/**
 * Submit form data using token (public access)
 */
export const submitFormByToken = async (token: string, formData: any): Promise<{
  success: boolean;
  submission_id: string;
  employee_id: string;
  message: string;
}> => {
  const response = await axios.post(`${API_URL}/api/public/forms/${token}/submit`, formData);
  return response.data;
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Copy token URL to clipboard
 */
export const copyTokenUrl = (url: string): Promise<void> => {
  return navigator.clipboard.writeText(url);
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

/**
 * Check if token has reached submission limit
 */
export const hasReachedSubmissionLimit = (token: FormToken): boolean => {
  if (!token.maxSubmissions) return false;
  return token.submissionCount >= token.maxSubmissions;
};

/**
 * Format submission count display
 */
export const formatSubmissionCount = (token: FormToken): string => {
  if (!token.maxSubmissions) {
    return `${token.submissionCount} submissions`;
  }
  return `${token.submissionCount} / ${token.maxSubmissions}`;
};

/**
 * Calculate days until expiry
 */
export const daysUntilExpiry = (expiresAt: string | null): number | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
