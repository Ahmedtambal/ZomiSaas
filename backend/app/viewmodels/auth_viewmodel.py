"""
Authentication ViewModel - Business Logic Layer with Supabase Auth
"""
from typing import Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime
import logging

from app.models.user import UserCreate, UserResponse, TokenResponse
from app.services.auth_service import AuthService
from app.services.database_service import db_service

logger = logging.getLogger(__name__)


def safe_int(value: Any, default: int = 3600) -> int:
    """Safely convert a value to int, handling strings, None, and already-int values"""
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_datetime(value: Any) -> datetime:
    """Safely convert a value to datetime, handling strings and datetime objects"""
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise ValueError("Invalid datetime value")


class AuthViewModel:
    """Authentication business logic using Supabase Auth"""
    
    def __init__(self):
        self.auth_service = AuthService()
    
    async def signup_admin(self, user_data: UserCreate) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Admin signup flow using Supabase Auth
        Creates organization and signs up user via Supabase
        """
        try:
            if not user_data.organization_name:
                return False, None, "Organization name is required for admin signup"
            
            # Create organization first
            org = await db_service.create_organization(user_data.organization_name)
            if not org:
                return False, None, "Failed to create organization"
            
            # Sign up with Supabase Auth (includes email verification)
            auth_response = await self.auth_service.signup_with_email(
                email=user_data.email,
                password=user_data.password,
                user_metadata={
                    "full_name": user_data.full_name,
                    "job_title": user_data.job_title or "",
                    "role": "admin",
                    "organization_id": str(org["id"])
                }
            )
            
            if not auth_response.user:
                return False, None, "Signup failed"
            
            # User profile will be created automatically by database trigger
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": auth_response.user.id,
                "organization_id": str(org["id"]),
                "action": "signup",
                "resource": "user",
                "details": {"type": "admin", "email": user_data.email}
            })
            
            # Check if session exists (it won't if email confirmation is required)
            if not auth_response.session:
                # Email confirmation required - return success but no tokens
                return True, None, "EMAIL_CONFIRMATION_REQUIRED"
            
            expires_in_raw = getattr(auth_response.session, "expires_in", None)
            logger.info(
                "Admin signup session expires_in raw=%r type=%s",
                expires_in_raw,
                type(expires_in_raw).__name__
            )

            # Get user profile
            profile = await db_service.get_user_profile_by_id(auth_response.user.id)
            
            # Create token response
            token_response = TokenResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=safe_int(auth_response.session.expires_in),
                user=UserResponse(
                    id=UUID(auth_response.user.id),
                    organization_id=UUID(org["id"]),
                    full_name=user_data.full_name,
                    email=auth_response.user.email,
                    job_title=user_data.job_title,
                    role="admin",
                    is_active=True,
                    is_email_verified=auth_response.user.email_confirmed_at is not None,
                    created_at=safe_datetime(auth_response.user.created_at),
                    last_login_at=None
                )
            )
            
            return True, token_response, None
            
        except Exception as e:
            logger.exception("Admin signup error")
            return False, None, str(e)
    
    async def signup_user(self, user_data: UserCreate) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        User signup flow using Supabase Auth with invite code validation
        """
        try:
            if not user_data.invite_code:
                return False, None, "Invite code is required for user signup"
            
            # Get and validate invite code
            invite_code = await db_service.get_invite_code(user_data.invite_code)
            if not invite_code:
                return False, None, "Invalid invite code"
            
            if invite_code["is_used"]:
                return False, None, "Invite code has already been used"
            
            # Check expiration
            expires_at = datetime.fromisoformat(invite_code["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                return False, None, "Invite code has expired"
            
            # Sign up with Supabase Auth
            auth_response = await self.auth_service.signup_with_email(
                email=user_data.email,
                password=user_data.password,
                user_metadata={
                    "full_name": user_data.full_name,
                    "job_title": user_data.job_title or "",
                    "role": invite_code["role"],
                    "organization_id": str(invite_code["organization_id"])
                }
            )
            
            if not auth_response.user:
                return False, None, "Signup failed"
            
            # Mark invite code as used
            await db_service.mark_invite_code_used(invite_code["id"], auth_response.user.id)
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": auth_response.user.id,
                "organization_id": str(invite_code["organization_id"]),
                "action": "signup",
                "resource": "user",
                "details": {"type": "user", "email": user_data.email, "invite_code": user_data.invite_code}
            })
            
            # Check if session exists (it won't if email confirmation is required)
            if not auth_response.session:
                # Email confirmation required - return success but no tokens
                return True, None, "EMAIL_CONFIRMATION_REQUIRED"
            
            expires_in_raw = getattr(auth_response.session, "expires_in", None)
            logger.info(
                "User signup session expires_in raw=%r type=%s",
                expires_in_raw,
                type(expires_in_raw).__name__
            )

            # Create token response
            token_response = TokenResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=safe_int(auth_response.session.expires_in),
                user=UserResponse(
                    id=UUID(auth_response.user.id),
                    organization_id=UUID(invite_code["organization_id"]),
                    full_name=user_data.full_name,
                    email=auth_response.user.email,
                    job_title=user_data.job_title,
                    role=invite_code["role"],
                    is_active=True,
                    is_email_verified=auth_response.user.email_confirmed_at is not None,
                    created_at=safe_datetime(auth_response.user.created_at),
                    last_login_at=None
                )
            )
            
            return True, token_response, None
            
        except Exception as e:
            logger.exception("User signup error")
            return False, None, str(e)
    
    async def login(self, email: str, password: str) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Login flow using Supabase Auth
        """
        try:
            # Sign in with Supabase Auth
            auth_response = await self.auth_service.signin_with_email(email, password)
            
            if not auth_response.user or not auth_response.session:
                return False, None, "Invalid email or password"
            
            # Get user profile
            profile = await db_service.get_user_profile_by_id(auth_response.user.id)
            if not profile:
                return False, None, "User profile not found"
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": auth_response.user.id,
                "organization_id": profile["organization_id"],
                "action": "login",
                "resource": "user",
                "details": {"email": email}
            })
            
            # Create token response
            token_response = TokenResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=safe_int(auth_response.session.expires_in),
                user=UserResponse(
                    id=UUID(auth_response.user.id),
                    organization_id=UUID(profile["organization_id"]),
                    full_name=profile["full_name"],
                    email=auth_response.user.email,
                    job_title=profile.get("job_title"),
                    role=profile["role"],
                    is_active=True,
                    is_email_verified=auth_response.user.email_confirmed_at is not None,
                    created_at=safe_datetime(profile["created_at"]),
                    last_login_at=datetime.utcnow()
                )
            )
            
            return True, token_response, None
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False, None, "Invalid email or password"
    
    async def refresh_token(self, refresh_token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Refresh token flow using Supabase Auth
        """
        try:
            # Refresh session with Supabase
            auth_response = await self.auth_service.refresh_session(refresh_token)
            
            if not auth_response.session:
                return False, None, "Invalid or expired refresh token"
            
            return True, {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": auth_response.session.expires_in or 3600
            }, None
            
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            return False, None, "Token refresh failed"


# Singleton instance
auth_viewmodel = AuthViewModel()
