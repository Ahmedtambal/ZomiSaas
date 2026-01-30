"""
Audit Logs Routes - View system activity logs
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


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
        
        # Fetch user profiles separately for all user_ids
        user_ids = list(set([log.get("user_id") for log in logs if log.get("user_id")]))
        user_profiles = {}
        
        if user_ids:
            # Fetch user profiles (has full_name)
            profiles_response = db_service.client.table("user_profiles").select(
                "id, full_name"
            ).in_("id", user_ids).execute()
            
            for profile in profiles_response.data:
                user_profiles[profile["id"]] = profile
            
            # Fetch emails from auth.users
            try:
                # Use admin API to fetch user emails from auth.users
                for user_id in user_ids:
                    try:
                        auth_response = db_service.client.auth.admin.get_user_by_id(user_id)
                        if auth_response and auth_response.user:
                            if user_id in user_profiles:
                                user_profiles[user_id]["email"] = auth_response.user.email
                    except:
                        # If admin API fails, just skip email for this user
                        pass
            except:
                # If we can't fetch emails, continue without them
                pass
        
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
            
            # Get user info from profiles map
            user_id = log.get("user_id")
            if user_id and user_id in user_profiles:
                user_info = user_profiles[user_id]
                log["user_name"] = user_info.get("full_name", "Unknown User")
                log["user_email"] = user_info.get("email", "")
            else:
                log["user_name"] = "Unknown User"
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
