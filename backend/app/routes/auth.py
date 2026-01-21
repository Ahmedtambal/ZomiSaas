"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.models.user import UserCreate, UserLogin, TokenRefresh
from app.viewmodels.auth_viewmodel import auth_viewmodel

router = APIRouter()


@router.post("/signup/admin", status_code=status.HTTP_201_CREATED)
async def signup_admin(user_data: UserCreate) -> Dict[str, Any]:
    """
    Admin signup endpoint - creates new organization and admin user
    
    Required fields:
    - full_name
    - email
    - password (8+ chars, uppercase, lowercase, digit, special char)
    - job_title
    - organization_name
    - role: "admin"
    """
    # Validate role
    if user_data.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' for admin signup"
        )
    
    # Validate organization_name is provided
    if not user_data.organization_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organization_name is required for admin signup"
        )
    
    # Process signup
    success, token_response, error = await auth_viewmodel.signup_admin(user_data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Signup failed"
        )
    
    # Check if email confirmation is required
    if error == "EMAIL_CONFIRMATION_REQUIRED":
        return {
            "message": "Account created successfully. Please check your email to verify your account.",
            "email_confirmation_required": True,
            "email": user_data.email
        }
    
    return {
        "message": "Admin account created successfully",
        "data": token_response.model_dump()
    }


@router.post("/signup/user", status_code=status.HTTP_201_CREATED)
async def signup_user(user_data: UserCreate) -> Dict[str, Any]:
    """
    User signup endpoint - validates invite code and creates user
    
    Required fields:
    - full_name
    - email
    - password (8+ chars, uppercase, lowercase, digit, special char)
    - job_title
    - invite_code (8-character code, valid for 2 hours)
    - role: "user"
    """
    # Validate role
    if user_data.role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' for user signup"
        )
    
    # Validate invite_code is provided
    if not user_data.invite_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invite_code is required for user signup"
        )
    
    # Process signup
    success, token_response, error = await auth_viewmodel.signup_user(user_data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Signup failed"
        )
    
    # Check if email confirmation is required
    if error == "EMAIL_CONFIRMATION_REQUIRED":
        return {
            "message": "Account created successfully. Please check your email to verify your account.",
            "email_confirmation_required": True,
            "email": user_data.email
        }
    
    return {
        "message": "User account created successfully",
        "data": token_response.model_dump()
    }


@router.post("/login")
async def login(credentials: UserLogin) -> Dict[str, Any]:
    """
    Login endpoint - validates credentials and returns JWT tokens
    
    Required fields:
    - email
    - password
    
    Returns:
    - access_token (valid for 30 minutes)
    - refresh_token (valid for 7 days)
    - user details
    """
    success, token_response, error = await auth_viewmodel.login(
        credentials.email,
        credentials.password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Invalid credentials"
        )
    
    return {
        "message": "Login successful",
        "data": token_response.model_dump()
    }


@router.post("/refresh")
async def refresh_token(token_data: TokenRefresh) -> Dict[str, Any]:
    """
    Refresh token endpoint - generates new access token
    
    Required fields:
    - refresh_token
    
    Returns:
    - access_token (new)
    - token_type
    - expires_in
    """
    success, token_dict, error = await auth_viewmodel.refresh_token(token_data.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Token refresh failed"
        )
    
    return {
        "message": "Token refreshed successfully",
        "data": token_dict
    }


@router.post("/logout")
async def logout(token_data: TokenRefresh) -> Dict[str, Any]:
    """
    Logout endpoint - signs out user via Supabase Auth
    
    Required fields:
    - refresh_token (used to identify session)
    
    Note: Supabase Auth manages session invalidation
    """
    from app.services.auth_service import AuthService
    
    auth_service = AuthService()
    success = await auth_service.signout(token_data.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logout failed"
        )
    
    return {
        "message": "Logout successful"
    }
