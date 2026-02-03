"""
User Profiles Routes - Manage user profile information
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
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
    Get current user's profile with email from auth.users
    """
    try:
        user_id = current_user["id"]
        
        # Get user profile from user_profiles table
        profile = await db_service.get_user_profile_by_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Get email from auth.users using Supabase Admin API
        try:
            auth_user = db_service.client.auth.admin.get_user_by_id(user_id)
            email = auth_user.user.email if auth_user and auth_user.user else None
        except Exception as e:
            logger.error(f"Failed to fetch email from auth.users: {str(e)}")
            email = None
        
        # Combine profile with email
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
        
        # Get email from auth.users
        try:
            auth_user = db_service.client.auth.admin.get_user_by_id(user_id)
            email = auth_user.user.email if auth_user and auth_user.user else None
        except Exception as e:
            logger.error(f"Failed to fetch email from auth.users: {str(e)}")
            email = None
        
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
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Change user password
    """
    try:
        user_id = current_user["id"]
        
        # Get user email for verification
        auth_user = db_service.client.auth.admin.get_user_by_id(user_id)
        
        if not auth_user or not auth_user.user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        email = auth_user.user.email
        
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
        
        # Update password using Admin API
        try:
            db_service.client.auth.admin.update_user_by_id(
                user_id,
                {"password": password_data.new_password}
            )
        except Exception as e:
            logger.error(f"Failed to update password: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
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
