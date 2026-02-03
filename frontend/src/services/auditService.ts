import apiClient from './apiClient';

export interface AuditLogActivity {
  action: string;
  resource_type: string;
  resource_id: string | null;
  details?: Record<string, any>;
}

class AuditService {
  async logActivity(activity: AuditLogActivity): Promise<void> {
    try {
      await apiClient.post('/api/audit-logs', activity);
    } catch (error) {
      console.error('Failed to log audit activity:', error);
      // Don't throw - audit logging failures shouldn't break the app
    }
  }
}

export const auditService = new AuditService();
