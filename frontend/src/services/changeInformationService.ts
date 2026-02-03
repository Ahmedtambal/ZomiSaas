import apiClient from './apiClient';

export interface ChangeInformation {
  id: string;
  organization_id: string;
  company_id: string;
  company_name?: string; // Fetched from companies table
  first_name: string;
  surname: string;
  date_of_birth: string;
  date_of_effect: string;
  change_type: string;
  other_reason?: string;
  source_form_id: string;
  submission_token?: string;
  submitted_via: string;
  ip_address?: string;
  user_agent?: string;
  created_by_user_id?: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChangeInformationDto {
  company_id: string;
  first_name: string;
  surname: string;
  date_of_birth: string;
  date_of_effect: string;
  change_type: string;
  other_reason?: string;
  source_form_id: string;
}

export interface UpdateChangeInformationDto {
  first_name?: string;
  surname?: string;
  date_of_birth?: string;
  date_of_effect?: string;
  change_type?: string;
  other_reason?: string;
  processing_status?: string;
}

class ChangeInformationService {
  async getAll(): Promise<ChangeInformation[]> {
    const response = await apiClient.get('/api/change-information');
    return response.data;
  }

  async getById(id: string): Promise<ChangeInformation> {
    const response = await apiClient.get(`/api/change-information/${id}`);
    return response.data;
  }

  async create(data: CreateChangeInformationDto): Promise<ChangeInformation> {
    const response = await apiClient.post('/api/change-information', data);
    return response.data;
  }

  async update(id: string, data: UpdateChangeInformationDto): Promise<ChangeInformation> {
    const response = await apiClient.put(`/api/change-information/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/change-information/${id}`);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await apiClient.post('/api/change-information/bulk-delete', { ids });
  }
}

export const changeInformationService = new ChangeInformationService();
