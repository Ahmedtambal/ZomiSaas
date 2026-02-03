import apiClient from './apiClient';

export interface UserProfile {
  id: string;
  organization_id: string;
  full_name: string;
  job_title: string | null;
  role: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  full_name: string;
  job_title?: string | null;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

class UserProfileService {
  async getMyProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/api/user-profiles/me');
    return response.data;
  }

  async updateMyProfile(data: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.put('/api/user-profiles/me', data);
    return response.data;
  }

  async changePassword(data: PasswordChange): Promise<{ message: string }> {
    const response = await apiClient.post('/api/user-profiles/change-password', data);
    return response.data;
  }
}

export const userProfileService = new UserProfileService();
