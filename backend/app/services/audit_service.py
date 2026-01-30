"""
Audit Logging Service
Tracks all database operations for compliance and security
"""
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service

logger = logging.getLogger(__name__)


class AuditService:
    """Service for creating comprehensive audit logs"""
    
    @staticmethod
    async def log_action(
        action: str,
        table_name: str,
        record_id: Optional[str],
        user_id: str,
        organization_id: str,
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Create audit log entry
        
        Args:
            action: Action type (CREATE, UPDATE, DELETE, EXPORT, VIEW, BULK_DELETE)
            table_name: Database table affected
            record_id: ID of the affected record (None for bulk operations)
            user_id: User who performed the action
            organization_id: Organization context
            old_data: Previous state (for UPDATE/DELETE)
            new_data: New state (for CREATE/UPDATE)
            ip_address: Client IP address
            metadata: Additional context (e.g., filter params, bulk IDs)
        """
        try:
            # Combine old_data, new_data, and metadata into details field
            details = {}
            if old_data:
                details['old_data'] = old_data
            if new_data:
                details['new_data'] = new_data
            if metadata:
                details['metadata'] = metadata
            if record_id:
                details['record_id'] = record_id
            
            # Encrypt the details field for security
            encryption = get_encryption_service()
            encrypted_details = None
            if details:
                encrypted_details = encryption.encrypt_json(details)
            
            log_entry = {
                "action": action,
                "resource": table_name,
                "user_id": user_id,
                "organization_id": organization_id,
                "details": encrypted_details,
                "ip_address": ip_address,
                "created_at": datetime.utcnow().isoformat()
            }
            
            db_service.client.table("audit_logs").insert(log_entry).execute()
            
            # Also log to application logs for monitoring
            logger.info(
                f"AUDIT: {action} on {table_name} by user {user_id[:8]}... "
                f"(org: {organization_id[:8]}..., record: {record_id[:8] if record_id else 'N/A'}...)"
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            # Don't fail the main operation if audit logging fails
            return False
    
    @staticmethod
    async def log_employee_create(employee_id: str, employee_data: Dict[str, Any], user_id: str, organization_id: str, ip_address: Optional[str] = None):
        """Log employee creation"""
        # Remove sensitive PII from audit log
        sanitized_data = {k: v for k, v in employee_data.items() if k not in ['ni_number', 'date_of_birth', 'pensionable_salary']}
        sanitized_data['_pii_fields_encrypted'] = True
        
        await AuditService.log_action(
            action="CREATE",
            table_name="employees",
            record_id=employee_id,
            user_id=user_id,
            organization_id=organization_id,
            new_data=sanitized_data,
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_employee_update(employee_id: str, old_data: Dict[str, Any], new_data: Dict[str, Any], user_id: str, organization_id: str, ip_address: Optional[str] = None):
        """Log employee update"""
        # Remove sensitive PII from audit log
        sanitized_old = {k: v for k, v in old_data.items() if k not in ['ni_number', 'date_of_birth', 'pensionable_salary']}
        sanitized_new = {k: v for k, v in new_data.items() if k not in ['ni_number', 'date_of_birth', 'pensionable_salary']}
        
        await AuditService.log_action(
            action="UPDATE",
            table_name="employees",
            record_id=employee_id,
            user_id=user_id,
            organization_id=organization_id,
            old_data=sanitized_old,
            new_data=sanitized_new,
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_employee_delete(employee_id: str, employee_data: Dict[str, Any], user_id: str, organization_id: str, ip_address: Optional[str] = None):
        """Log employee deletion"""
        # Remove sensitive PII from audit log
        sanitized_data = {k: v for k, v in employee_data.items() if k not in ['ni_number', 'date_of_birth', 'pensionable_salary']}
        
        await AuditService.log_action(
            action="DELETE",
            table_name="employees",
            record_id=employee_id,
            user_id=user_id,
            organization_id=organization_id,
            old_data=sanitized_data,
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_bulk_delete(table_name: str, record_ids: list, user_id: str, organization_id: str, ip_address: Optional[str] = None):
        """Log bulk deletion"""
        await AuditService.log_action(
            action="BULK_DELETE",
            table_name=table_name,
            record_id=None,
            user_id=user_id,
            organization_id=organization_id,
            ip_address=ip_address,
            metadata={"deleted_ids": record_ids, "count": len(record_ids)}
        )
    
    @staticmethod
    async def log_export(table_name: str, user_id: str, organization_id: str, filters: Dict[str, Any], record_count: int, ip_address: Optional[str] = None):
        """Log data export"""
        await AuditService.log_action(
            action="EXPORT",
            table_name=table_name,
            record_id=None,
            user_id=user_id,
            organization_id=organization_id,
            ip_address=ip_address,
            metadata={"filters": filters, "record_count": record_count}
        )
    
    @staticmethod
    async def log_company_action(action: str, company_id: str, company_data: Dict[str, Any], user_id: str, organization_id: str, old_data: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None):
        """Log company create/update/delete"""
        await AuditService.log_action(
            action=action,
            table_name="companies",
            record_id=company_id,
            user_id=user_id,
            organization_id=organization_id,
            old_data=old_data,
            new_data=company_data if action != "DELETE" else None,
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_form_action(action: str, form_id: str, form_data: Dict[str, Any], user_id: str, organization_id: str, old_data: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None):
        """Log form create/update/delete"""
        await AuditService.log_action(
            action=action,
            table_name="forms",
            record_id=form_id,
            user_id=user_id,
            organization_id=organization_id,
            old_data=old_data,
            new_data=form_data if action != "DELETE" else None,
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_settings_change(setting_name: str, old_value: Any, new_value: Any, user_id: str, organization_id: str, ip_address: Optional[str] = None):
        """Log settings/configuration changes"""
        await AuditService.log_action(
            action="UPDATE",
            table_name="app_config",
            record_id=setting_name,
            user_id=user_id,
            organization_id=organization_id,
            old_data={"value": old_value},
            new_data={"value": new_value},
            ip_address=ip_address
        )


# Singleton instance
audit_service = AuditService()
