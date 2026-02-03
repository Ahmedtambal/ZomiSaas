"""
User Profiles Routes - Manage user profile information
"""
from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


class UserProfileUpdate(BaseModel):
    full_name: str
    job_title: str | None = None


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current user's profile with email from JWT token
    """
    try:
        user_id = current_user["id"]
        email = current_user.get("email")  # Email from JWT token
        
        # Get user profile from user_profiles table
        profile = await db_service.get_user_profile_by_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Combine profile with email from JWT
        profile_with_email = {
            **profile,
            "email": email
        }
        
        return profile_with_email
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )


@router.put("/me", status_code=status.HTTP_200_OK)
async def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update current user's profile
    """
    try:
        user_id = current_user["id"]
        
        # Prepare update data (only include non-None fields)
        update_data = {
            "full_name": profile_update.full_name,
        }
        
        if profile_update.job_title is not None:
            update_data["job_title"] = profile_update.job_title
        
        # Update user profile
        success = await db_service.update_user_profile(user_id, update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile"
            )
        
        # Get updated profile
        updated_profile = await db_service.get_user_profile_by_id(user_id)
        
        # Get email from JWT token
        email = current_user.get("email")
        
        return {
            **updated_profile,
            "email": email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Change user password using the current session token
    """
    try:
        user_id = current_user["id"]
        email = current_user.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in user session"
            )
        
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        # Extract token
        access_token = authorization.replace("Bearer ", "")
        
        # Verify current password by attempting sign-in
        try:
            sign_in_response = db_service.client.auth.sign_in_with_password({
                "email": email,
                "password": password_data.current_password
            })
            
            if not sign_in_response or not sign_in_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Current password is incorrect"
                )
        except Exception as e:
            logger.error(f"Password verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        if len(password_data.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters"
            )
        
        # Create a new client with the user's access token
        from supabase import create_client
        from app.config import settings
        
        user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        user_client.auth.set_session(access_token, sign_in_response.session.refresh_token)
        
        # Update password using the authenticated user's session
        try:
            update_response = user_client.auth.update_user({
                "password": password_data.new_password
            })
            
            if not update_response or not update_response.user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update password"
                )
        except Exception as e:
            logger.error(f"Failed to update password: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update password: {str(e)}"
            )
        
        return {
            "message": "Password updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to change password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
