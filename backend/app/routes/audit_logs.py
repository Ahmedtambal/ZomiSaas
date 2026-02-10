"""
Audit Logs Routes - View system activity logs
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from pydantic import BaseModel

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.routes.auth import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()
logger = logging.getLogger(__name__)
audit_service = AuditService()


class AuditLogCreate(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_audit_log(
    log_data: AuditLogCreate,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new audit log entry
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        await audit_service.log_action(
            user_id=user_id,
            organization_id=organization_id,
            action=log_data.action,
            resource=log_data.resource_type,
            resource_id=log_data.resource_id,
            details=log_data.details or {}
        )
        
        return {
            "message": "Audit log created successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create audit log"
        )


@router.get("", status_code=status.HTTP_200_OK)
async def get_audit_logs(
    search: Optional[str] = Query(None, description="Search in action, resource, or user"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource: Optional[str] = Query(None, description="Filter by resource/table"),
    from_date: Optional[str] = Query(None, description="Start date filter"),
    to_date: Optional[str] = Query(None, description="End date filter"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    limit: int = Query(100, description="Number of records to return"),
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get audit logs with filtering, search, and sorting
    Decrypts details field for frontend display
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Build query - fetch audit logs only (user_profiles join doesn't work as FK points to auth.users)
        query = db_service.client.table("audit_logs").select("*").eq("organization_id", organization_id)
        
        # Apply filters
        if action:
            query = query.eq("action", action)
        if resource:
            query = query.eq("resource", resource)
        if from_date:
            query = query.gte("created_at", from_date)
        if to_date:
            query = query.lte("created_at", to_date)
        
        # Apply sorting
        query = query.order(sort_by, desc=(sort_order.lower() == "desc"))
        
        # Apply limit
        query = query.limit(limit)
        
        response = query.execute()
        logs = response.data
        
        # Build a lookup of user display info without relying on Supabase Admin Auth APIs.
        user_ids = list(set([log.get("user_id") for log in logs if log.get("user_id")]))
        user_lookup: Dict[str, Dict[str, Any]] = {}

        if user_ids:
            # Prefer RPC that safely joins auth.users (SECURITY DEFINER) if available.
            try:
                rpc_response = db_service.client.rpc(
                    "get_user_emails_for_organization",
                    {"org_id": organization_id},
                ).execute()
                for row in (rpc_response.data or []):
                    if row.get("id"):
                        user_lookup[row["id"]] = row
            except Exception:
                # RPC may not exist in some environments; fall back to user_profiles only.
                pass

            # Ensure we at least have full_name from user_profiles for any missing users.
            missing_ids = [uid for uid in user_ids if uid not in user_lookup]
            if missing_ids:
                profiles_response = db_service.client.table("user_profiles").select(
                    "id, full_name"
                ).in_("id", missing_ids).execute()
                for profile in (profiles_response.data or []):
                    if profile.get("id"):
                        user_lookup.setdefault(profile["id"], {}).update(profile)
        
        # Decrypt details field and process logs
        encryption = get_encryption_service()
        processed_logs = []
        
        for log in logs:
            # Decrypt details if present
            if log.get("details"):
                try:
                    decrypted_details = encryption.decrypt_json(log["details"])
                    log["details"] = decrypted_details
                except Exception as e:
                    logger.warning(f"Failed to decrypt audit log details: {str(e)}")
                    log["details"] = None
            
            # Get user info from lookup
            user_id = log.get("user_id")
            if user_id and user_id in user_lookup:
                user_info = user_lookup[user_id]
                full_name = user_info.get("full_name")
                email = user_info.get("email")
                log["user_name"] = full_name or email or f"User {user_id[:8]}"
                log["user_email"] = email or ""
            else:
                log["user_name"] = f"User {user_id[:8]}" if user_id else "Unknown User"
                log["user_email"] = ""
            
            # Extract record_id from details if present
            if log.get("details"):
                details = log["details"]
                log["record_id"] = details.get("record_id") or (
                    details.get("new_data", {}).get("id") if isinstance(details.get("new_data"), dict) else None
                ) or (
                    details.get("old_data", {}).get("id") if isinstance(details.get("old_data"), dict) else None
                )
            
            # Apply search filter if provided (after decryption)
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in log.get("action", "").lower(),
                    search_lower in log.get("resource", "").lower(),
                    search_lower in log.get("user_name", "").lower(),
                    search_lower in log.get("user_email", "").lower(),
                    search_lower in str(log.get("record_id", "")).lower()
                ]):
                    continue
            
            processed_logs.append(log)
        
        return processed_logs
        
    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch audit logs"
        )


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_audit_stats(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get audit log statistics for the organization
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Total logs count
        total_response = db_service.client.table("audit_logs").select(
            "id", count="exact"
        ).eq("organization_id", organization_id).execute()
        
        # Recent activity (last 24 hours)
        from datetime import timedelta
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_response = db_service.client.table("audit_logs").select(
            "id", count="exact"
        ).eq("organization_id", organization_id).gte("created_at", yesterday).execute()
        
        # Actions breakdown
        actions_response = db_service.client.table("audit_logs").select(
            "action"
        ).eq("organization_id", organization_id).execute()
        
        actions_count = {}
        for log in actions_response.data:
            action = log["action"]
            actions_count[action] = actions_count.get(action, 0) + 1
        
        return {
            "total_logs": total_response.count,
            "recent_activity": recent_response.count,
            "actions_breakdown": actions_count
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch audit stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch audit statistics"
        )
