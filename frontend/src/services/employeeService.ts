import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://zomisaasbackend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Employee {
  id: string;
  organization_id: string;
  company_id: string;
  source_form_id?: string;
  created_at: string;
  updated_at: string;
  title?: string;
  first_name: string;
  surname: string;
  ni_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
  city_town?: string;
  county?: string;
  country?: string;
  postcode?: string;
  email_address?: string;
  home_number?: string;
  mobile_number?: string;
  uk_resident?: boolean;
  nationality?: string;
  pensionable_salary?: number;
  pensionable_salary_start_date?: string;
  salary_post_sacrifice?: number;
  employment_start_date?: string;
  date_joined_scheme?: string;
  selected_retirement_age?: number;
  pension_investment_approach?: string;
  policy_number?: string;
  split_template_group_name?: string;
  split_template_group_source?: string;
  service_status?: string;
  client_category?: string;
  pension_start_date?: string;
  io_upload_status: boolean;
  submission_token?: string;
  submitted_via?: string;
  ip_address?: string;
  user_agent?: string;
  job_title?: string;
  is_pension_active?: boolean;
  is_smart_pension?: boolean;
  send_pension_pack?: boolean;
  pension_provider_info?: string;
  scheme_ref?: string;
  advice_type?: string;
  selling_adviser_id?: string;
  has_group_life?: boolean;
  has_gci?: boolean;
  has_gip?: boolean;
  has_bupa?: boolean;
  operational_notes?: string;
  created_by_user_id?: string;
}

export const employeeService = {
  // Get all employees
  async getEmployees(): Promise<Employee[]> {
    const response = await api.get('/api/employees');
    return response.data;
  },

  // Get employee by ID
  async getEmployee(id: string): Promise<Employee> {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
  },

  // Create employee
  // Note: created_by_user_id is automatically set by the backend from the JWT token
  async createEmployee(employee: Partial<Employee>): Promise<Employee> {
    const response = await api.post('/api/employees', employee);
    return response.data;
  },

  // Update employee
  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const response = await api.put(`/api/employees/${id}`, employee);
    return response.data;
  },

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/api/employees/${id}`);
  },

  // Bulk delete employees
  async bulkDeleteEmployees(ids: string[]): Promise<void> {
    await api.post('/api/employees/bulk-delete', { ids });
  },

  // Export employees to CSV
  async exportEmployees(): Promise<Blob> {
    const response = await api.get('/api/employees/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Search employees
  async searchEmployees(query: string): Promise<Employee[]> {
    const response = await api.get(`/api/employees/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
