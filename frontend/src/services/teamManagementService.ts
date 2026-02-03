import apiClient from './apiClient';

export interface InviteCode {
  id: string;
  code: string;
  organization_id: string;
  role: string;
  created_by: string | null;
  is_used: boolean;
  used_at: string | null;
  used_by: string | null;
  expires_at: string;
  created_at: string;
}

export interface Member {
  id: string;
  organization_id: string;
  full_name: string;
  job_title: string | null;
  role: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeCreate {
  role: string;
  expires_in_days?: number;
}

export interface MemberRoleUpdate {
  new_role: string;
}

class TeamManagementService {
  // Invite Codes
  async createInviteCode(data: InviteCodeCreate): Promise<InviteCode> {
    const response = await apiClient.post('/api/team/invite-codes', data);
    return response.data;
  }

  async getInviteCodes(): Promise<InviteCode[]> {
    const response = await apiClient.get('/api/team/invite-codes');
    return response.data;
  }

  // Members
  async getMembers(): Promise<Member[]> {
    const response = await apiClient.get('/api/team/members');
    return response.data;
  }

  async updateMemberRole(memberId: string, data: MemberRoleUpdate): Promise<Member> {
    const response = await apiClient.put(`/api/team/members/${memberId}/role`, data);
    return response.data;
  }

  async deleteMember(memberId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/team/members/${memberId}`);
    return response.data;
  }
}

export const teamManagementService = new TeamManagementService();
