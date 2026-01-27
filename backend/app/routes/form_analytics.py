"""
Form Analytics Routes - Link analytics and metrics
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# LINK ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/tokens/{token_id}/analytics")
async def get_token_analytics(
    token_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get analytics for a specific form token/link
    
    Returns:
    - clicks: Total number of clicks
    - completions: Total successful submissions
    - completion_rate: Percentage of clicks that resulted in submissions
    - last_clicked_at: Most recent click timestamp
    - last_completed_at: Most recent submission timestamp
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Fetch token with analytics
        token_response = db_service.client.table("form_tokens").select(
            "*"
        ).eq("id", token_id).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        token = token_response.data[0]
        
        # Verify token's form belongs to user's org
        form_response = db_service.client.table("forms").select(
            "organization_id"
        ).eq("id", token["form_id"]).execute()
        
        if not form_response.data or form_response.data[0]["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get submissions count for this token
        submissions_response = db_service.client.table("form_submissions").select(
            "id", count="exact"
        ).eq("token_id", token_id).execute()
        
        completions = submissions_response.count or 0
        
        # Get analytics data
        analytics = token.get("analytics", {})
        clicks = analytics.get("clicks", 0)
        completion_rate = (completions / clicks * 100) if clicks > 0 else 0
        
        return {
            "token_id": token_id,
            "token_name": token.get("name", "Unnamed Link"),
            "form_id": token["form_id"],
            "created_at": token["created_at"],
            "expires_at": token.get("expires_at"),
            "is_active": token.get("deactivated_at") is None,
            "clicks": clicks,
            "completions": completions,
            "completion_rate": round(completion_rate, 2),
            "last_clicked_at": analytics.get("last_clicked_at"),
            "last_completed_at": analytics.get("last_completed_at"),
            "analytics": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get token analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get token analytics: {str(e)}"
        )


@router.get("/forms/{form_id}/analytics")
async def get_form_analytics(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get aggregated analytics for all links of a form
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Verify form belongs to user's org
        form_response = db_service.client.table("forms").select(
            "*"
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not form_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        # Get all tokens for this form
        tokens_response = db_service.client.table("form_tokens").select(
            "*"
        ).eq("form_id", form_id).execute()
        
        # Get all submissions for this form
        submissions_response = db_service.client.table("form_submissions").select(
            "*", count="exact"
        ).eq("form_id", form_id).execute()
        
        # Aggregate metrics
        total_clicks = 0
        total_completions = submissions_response.count or 0
        active_links = 0
        expired_links = 0
        
        link_analytics = []
        
        for token in tokens_response.data:
            analytics = token.get("analytics", {})
            clicks = analytics.get("clicks", 0)
            total_clicks += clicks
            
            is_active = token.get("deactivated_at") is None
            is_expired = False
            
            if token.get("expires_at"):
                expires_at = datetime.fromisoformat(token["expires_at"].replace("Z", "+00:00"))
                is_expired = expires_at < datetime.utcnow()
            
            if is_active and not is_expired:
                active_links += 1
            elif is_expired:
                expired_links += 1
            
            # Get submissions for this specific token
            token_submissions = db_service.client.table("form_submissions").select(
                "id", count="exact"
            ).eq("token_id", token["id"]).execute()
            
            token_completions = token_submissions.count or 0
            token_completion_rate = (token_completions / clicks * 100) if clicks > 0 else 0
            
            link_analytics.append({
                "token_id": token["id"],
                "token_name": token.get("name", "Unnamed Link"),
                "clicks": clicks,
                "completions": token_completions,
                "completion_rate": round(token_completion_rate, 2),
                "is_active": is_active,
                "is_expired": is_expired,
                "created_at": token["created_at"],
                "expires_at": token.get("expires_at")
            })
        
        overall_completion_rate = (total_completions / total_clicks * 100) if total_clicks > 0 else 0
        
        # Get status breakdown
        status_breakdown = {}
        for submission in submissions_response.data:
            submission_status = submission.get("status", "unknown")
            status_breakdown[submission_status] = status_breakdown.get(submission_status, 0) + 1
        
        return {
            "form_id": form_id,
            "form_name": form_response.data[0].get("form_data", {}).get("name", "Untitled Form"),
            "total_links": len(tokens_response.data),
            "active_links": active_links,
            "expired_links": expired_links,
            "total_clicks": total_clicks,
            "total_completions": total_completions,
            "overall_completion_rate": round(overall_completion_rate, 2),
            "status_breakdown": status_breakdown,
            "links": link_analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get form analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get form analytics: {str(e)}"
        )


@router.post("/tokens/{token_id}/track-click")
async def track_token_click(
    token_id: str
) -> Dict[str, str]:
    """
    Track a click on a form token/link (public endpoint, no auth required)
    Called when someone accesses a public form link
    """
    try:
        # Fetch current analytics
        token_response = db_service.client.table("form_tokens").select(
            "analytics"
        ).eq("id", token_id).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        analytics = token_response.data[0].get("analytics", {})
        
        # Increment clicks
        analytics["clicks"] = analytics.get("clicks", 0) + 1
        analytics["last_clicked_at"] = datetime.utcnow().isoformat()
        
        # Update token
        db_service.client.table("form_tokens").update({
            "analytics": analytics
        }).eq("id", token_id).execute()
        
        return {"message": "Click tracked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to track click: {str(e)}")
        # Don't fail the request if tracking fails
        return {"message": "Click tracking failed but request continues"}


@router.put("/tokens/{token_id}")
async def update_token(
    token_id: str,
    token_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update token settings (name, expiry, settings)
    
    Body:
    - name: Friendly name for the link
    - expires_at: ISO timestamp or null
    - settings: JSONB object with link-specific settings
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Verify token's form belongs to user's org
        token_response = db_service.client.table("form_tokens").select(
            "form_id"
        ).eq("id", token_id).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        form_id = token_response.data[0]["form_id"]
        form_response = db_service.client.table("forms").select(
            "organization_id"
        ).eq("id", form_id).execute()
        
        if not form_response.data or form_response.data[0]["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Prepare update data
        update_data = {}
        
        if "name" in token_data:
            update_data["name"] = token_data["name"]
        
        if "expires_at" in token_data:
            update_data["expires_at"] = token_data["expires_at"]
        
        if "settings" in token_data:
            update_data["settings"] = token_data["settings"]
        
        # Update token
        response = db_service.client.table("form_tokens").update(
            update_data
        ).eq("id", token_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update token"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update token: {str(e)}"
        )


@router.put("/tokens/{token_id}/deactivate")
async def deactivate_token(
    token_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Deactivate a form token/link (soft delete)
    """
    try:
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Verify token's form belongs to user's org
        token_response = db_service.client.table("form_tokens").select(
            "form_id"
        ).eq("id", token_id).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        form_id = token_response.data[0]["form_id"]
        form_response = db_service.client.table("forms").select(
            "organization_id"
        ).eq("id", form_id).execute()
        
        if not form_response.data or form_response.data[0]["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Deactivate token
        response = db_service.client.table("form_tokens").update({
            "deactivated_at": datetime.utcnow().isoformat(),
            "deactivated_by_user_id": user_id
        }).eq("id", token_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to deactivate token"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deactivate token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate token: {str(e)}"
        )


@router.put("/tokens/{token_id}/reactivate")
async def reactivate_token(
    token_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Reactivate a deactivated form token/link
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Verify token's form belongs to user's org
        token_response = db_service.client.table("form_tokens").select(
            "form_id"
        ).eq("id", token_id).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        form_id = token_response.data[0]["form_id"]
        form_response = db_service.client.table("forms").select(
            "organization_id"
        ).eq("id", form_id).execute()
        
        if not form_response.data or form_response.data[0]["organization_id"] != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Reactivate token
        response = db_service.client.table("form_tokens").update({
            "deactivated_at": None,
            "deactivated_by_user_id": None
        }).eq("id", token_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reactivate token"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reactivate token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reactivate token: {str(e)}"
        )
