"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Header, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

from app.models.user import UserCreate, UserLogin, TokenRefresh
from app.viewmodels.auth_viewmodel import auth_viewmodel
from app.config import settings
from app.middleware import (
    check_session_activity, 
    update_session_activity, 
    clear_session_activity,
    check_account_locked,
    record_failed_login,
    record_successful_login,
    sanitize_email
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Security logger
security_logger = logging.getLogger('security')


# =====================================================
# JWT Token Validation Dependency
# =====================================================

async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token
    Also checks session activity and updates activity timestamp
    
    Usage:
        @router.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            return {"user_id": current_user["id"]}
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify Supabase JWT token and get user
    try:
        # Import here to avoid circular dependency
        from app.services.database_service import db_service
        
        # Verify token with Supabase
        response = db_service.client.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        user_id = response.user.id
        
        # Check session activity (15 min timeout)
        if not check_session_activity(user_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired due to inactivity",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update activity timestamp
        update_session_activity(user_id)
        
        # Get user profile from database to get organization_id and role
        profile = await db_service.get_user_profile_by_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found",
            )
        
        # Return user data
        user_data = {
            "id": user_id,
            "email": response.user.email,
            "role": profile.get("role"),
            "organization_id": profile.get("organization_id"),
        }
        
        # Store user in request state for middleware
        if request:
            request.state.user = user_data
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/signup/admin", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")  # Limit admin signups to prevent abuse
async def signup_admin(request: Request, user_data: UserCreate) -> Dict[str, Any]:
    """
    Admin signup endpoint - creates new organization and admin user
    
    Required fields:
    - full_name
    - email
    - password (8+ chars, uppercase, lowercase, digit, special char)
    - job_title
    - organization_name
    - role: "admin"
    
    Rate limit: 3 attempts per hour
    """
    # Sanitize email
    user_data.email = sanitize_email(user_data.email)
    
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
    
    # Log signup attempt
    security_logger.info({
        'event': 'admin_signup_attempt',
        'email': user_data.email,
        'organization': user_data.organization_name,
        'ip': request.client.host if request.client else 'unknown'
    })
    
    # Process signup
    success, token_response, error = await auth_viewmodel.signup_admin(user_data)
    
    if not success:
        security_logger.warning({
            'event': 'admin_signup_failed',
            'email': user_data.email,
            'error': error,
            'ip': request.client.host if request.client else 'unknown'
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Signup failed"
        )
    
    # Check if email confirmation is required
    if error == "EMAIL_CONFIRMATION_REQUIRED":
        security_logger.info({
            'event': 'admin_signup_email_confirmation_required',
            'email': user_data.email
        })
        return {
            "message": "Account created successfully. Please check your email to verify your account.",
            "email_confirmation_required": True,
            "email": user_data.email
        }
    
    security_logger.info({
        'event': 'admin_signup_success',
        'email': user_data.email,
        'user_id': token_response.user.id
    })
    
    return {
        "message": "Admin account created successfully",
        "data": token_response.model_dump()
    }


@router.post("/signup/user", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")  # Limit user signups to prevent abuse
async def signup_user(request: Request, user_data: UserCreate) -> Dict[str, Any]:
    """
    User signup endpoint - validates invite code and creates user
    
    Required fields:
    - full_name
    - email
    - password (8+ chars, uppercase, lowercase, digit, special char)
    - job_title
    - invite_code (8-character code, valid for 2 hours)
    - role: "user"
    
    Rate limit: 5 attempts per hour
    """
    # Sanitize email
    user_data.email = sanitize_email(user_data.email)
    
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
    
    # Log signup attempt
    security_logger.info({
        'event': 'user_signup_attempt',
        'email': user_data.email,
        'ip': request.client.host if request.client else 'unknown'
    })
    
    # Process signup
    success, token_response, error = await auth_viewmodel.signup_user(user_data)
    
    if not success:
        security_logger.warning({
            'event': 'user_signup_failed',
            'email': user_data.email,
            'error': error,
            'ip': request.client.host if request.client else 'unknown'
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Signup failed"
        )
    
    # Check if email confirmation is required
    if error == "EMAIL_CONFIRMATION_REQUIRED":
        security_logger.info({
            'event': 'user_signup_success_email_confirmation_required',
            'email': user_data.email
        })
        return {
            "message": "Account created successfully. Please check your email to verify your account.",
            "email_confirmation_required": True,
            "email": user_data.email
        }
    
    # Log successful signup with user ID
    if token_response and token_response.user:
        security_logger.info({
            'event': 'user_signup_success',
            'email': user_data.email,
            'user_id': token_response.user.id
        })
    
    return {
        "message": "User account created successfully",
        "data": token_response.model_dump() if token_response else {}
    }


@router.post("/login")
@limiter.limit("5/minute")  # Maximum 5 login attempts per minute
async def login(request: Request, credentials: UserLogin) -> Dict[str, Any]:
    """
    Login endpoint - validates credentials and returns JWT tokens
    
    Required fields:
    - email
    - password
    
    Returns:
    - access_token (valid for 30 minutes)
    - refresh_token (valid for 7 days)
    - user details
    
    Rate limit: 5 attempts per minute
    Security: Account locked after 5 failed attempts for 15 minutes
    """
    # Sanitize email
    email = sanitize_email(credentials.email)
    
    # Check if account is locked
    is_locked, lock_message = check_account_locked(email)
    if is_locked:
        security_logger.warning({
            'event': 'login_blocked_locked_account',
            'email': email,
            'ip': request.client.host if request.client else 'unknown'
        })
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=lock_message
        )
    
    # Log login attempt
    security_logger.info({
        'event': 'login_attempt',
        'email': email,
        'ip': request.client.host if request.client else 'unknown',
        'user_agent': request.headers.get('user-agent', 'unknown')
    })
    
    # Attempt login
    success, token_response, error = await auth_viewmodel.login(
        email,
        credentials.password
    )
    
    if not success:
        # Record failed attempt
        record_failed_login(email)
        
        security_logger.warning({
            'event': 'login_failed',
            'email': email,
            'reason': error or 'invalid_credentials',
            'ip': request.client.host if request.client else 'unknown'
        })
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Invalid credentials"
        )
    
    # Clear failed attempts on successful login
    record_successful_login(email)
    
    # Initialize activity tracking for this user
    update_session_activity(token_response.user.id)
    
    security_logger.info({
        'event': 'login_success',
        'email': email,
        'user_id': token_response.user.id,
        'ip': request.client.host if request.client else 'unknown'
    })
    
    return {
        "message": "Login successful",
        "data": token_response.model_dump()
    }


@router.post("/refresh")
@limiter.limit("10/minute")  # Maximum 10 refresh attempts per minute
async def refresh_token(request: Request, token_data: TokenRefresh) -> Dict[str, Any]:
    """
    Refresh token endpoint - generates new access token
    
    Required fields:
    - refresh_token
    
    Returns:
    - access_token (new)
    - token_type
    - expires_in
    
    Rate limit: 10 attempts per minute
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
    Logout endpoint - signs out user via Supabase Auth and clears activity tracking
    
    Required fields:
    - refresh_token (used to identify session)
    
    Note: Supabase Auth manages session invalidation
    """
    from app.services.auth_service import AuthService
    from app.services.database_service import db_service
    
    # Get user ID from refresh token to clear activity tracking
    user_id = None
    try:
        # Use Supabase to get user info from refresh token
        response = db_service.client.auth.refresh_session(token_data.refresh_token)
        if response and response.session:
            user_id = response.session.user.id
            access_token = response.session.access_token
            
            # Clear activity tracking
            if user_id:
                clear_session_activity(user_id)
                security_logger.info({
                    'event': 'logout',
                    'user_id': user_id
                })
            
            # Sign out using Supabase
            auth_service = AuthService()
            await auth_service.signout(access_token)
    except Exception as e:
        # Continue with logout even if session already expired
        security_logger.warning({
            'event': 'logout_failed',
            'error': str(e)
        })
    
    return {
        "message": "Logout successful"
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: Dict[str, str]
) -> Dict[str, str]:
    """
    Request password reset email
    
    Rate limit: 3 attempts per hour
    """
    email = sanitize_email(body.get("email", ""))
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    security_logger.info({
        'event': 'password_reset_requested',
        'email': email,
        'ip': request.client.host if request.client else 'unknown'
    })
    
    try:
        # Request password reset from Supabase
        auth_service = AuthService()
        await auth_service.reset_password_for_email(email)
        
        # Always return success to prevent email enumeration
        return {
            "message": "If an account exists with this email, a password reset link will be sent"
        }
    except Exception as e:
        security_logger.error({
            'event': 'password_reset_failed',
            'email': email,
            'error': str(e)
        })
        # Still return success to prevent email enumeration
        return {
            "message": "If an account exists with this email, a password reset link will be sent"
        }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: Request,
    body: Dict[str, str]
) -> Dict[str, str]:
    """
    Reset password with token from email link
    """
    token = body.get("token", "")
    new_password = body.get("password", "")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and password are required"
        )
    
    try:
        # Update password using Supabase
        auth_service = AuthService()
        await auth_service.update_user_password(token, new_password)
        
        security_logger.info({
            'event': 'password_reset_completed',
            'ip': request.client.host if request.client else 'unknown'
        })
        
        return {
            "message": "Password reset successful"
        }
    except Exception as e:
        security_logger.error({
            'event': 'password_reset_error',
            'error': str(e)
        })
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password. The link may have expired."
        )
