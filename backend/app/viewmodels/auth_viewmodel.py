"""
Authentication ViewModel - Business Logic Layer
"""
from typing import Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
import logging

from app.models.user import UserCreate, UserResponse, TokenResponse
from app.models.organization import OrganizationResponse
from app.services.auth_service import AuthService
from app.services.database_service import db_service
from app.config import settings

logger = logging.getLogger(__name__)


class AuthViewModel:
    """Authentication business logic"""
    
    def __init__(self):
        self.auth_service = AuthService()
    
    async def signup_admin(self, user_data: UserCreate) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Admin signup flow - creates new organization and admin user
        Returns: (success, token_response, error_message)
        """
        try:
            # Validate admin signup data
            if not user_data.organization_name:
                return False, None, "Organization name is required for admin signup"
            
            # Check if user already exists
            existing_user = await db_service.get_user_by_email(user_data.email)
            if existing_user:
                return False, None, "User with this email already exists"
            
            # Create organization
            org = await db_service.create_organization(user_data.organization_name)
            if not org:
                return False, None, "Failed to create organization"
            
            # Hash password
            password_hash = self.auth_service.hash_password(user_data.password)
            
            # Create admin user
            user_dict = {
                "organization_id": str(org["id"]),
                "full_name": user_data.full_name,
                "email": user_data.email.lower(),
                "job_title": user_data.job_title,
                "password_hash": password_hash,
                "role": "admin",
                "is_active": True,
                "is_email_verified": False
            }
            
            user = await db_service.create_user(user_dict)
            if not user:
                return False, None, "Failed to create user"
            
            # Generate tokens
            token_response = await self._generate_tokens(user)
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": str(user["id"]),
                "organization_id": str(org["id"]),
                "action": "signup",
                "resource": "user",
                "details": {"type": "admin", "email": user_data.email}
            })
            
            return True, token_response, None
            
        except Exception as e:
            logger.error(f"Admin signup error: {e}")
            return False, None, str(e)
    
    async def signup_user(self, user_data: UserCreate) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        User signup flow - validates invite code and creates user
        Returns: (success, token_response, error_message)
        """
        try:
            # Validate user signup data
            if not user_data.invite_code:
                return False, None, "Invite code is required for user signup"
            
            # Check if user already exists
            existing_user = await db_service.get_user_by_email(user_data.email)
            if existing_user:
                return False, None, "User with this email already exists"
            
            # Get and validate invite code
            invite_code = await db_service.get_invite_code(user_data.invite_code)
            if not invite_code:
                return False, None, "Invalid invite code"
            
            # Check if code is already used
            if invite_code["is_used"]:
                return False, None, "Invite code has already been used"
            
            # Check if code is expired
            expires_at = datetime.fromisoformat(invite_code["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at:
                return False, None, "Invite code has expired"
            
            # Hash password
            password_hash = self.auth_service.hash_password(user_data.password)
            
            # Create user
            user_dict = {
                "organization_id": str(invite_code["organization_id"]),
                "full_name": user_data.full_name,
                "email": user_data.email.lower(),
                "job_title": user_data.job_title,
                "password_hash": password_hash,
                "role": invite_code["role"],
                "is_active": True,
                "is_email_verified": False
            }
            
            user = await db_service.create_user(user_dict)
            if not user:
                return False, None, "Failed to create user"
            
            # Mark invite code as used
            await db_service.mark_invite_code_used(invite_code["id"], user["id"])
            
            # Generate tokens
            token_response = await self._generate_tokens(user)
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": str(user["id"]),
                "organization_id": str(invite_code["organization_id"]),
                "action": "signup",
                "resource": "user",
                "details": {"type": "user", "email": user_data.email, "invite_code": user_data.invite_code}
            })
            
            return True, token_response, None
            
        except Exception as e:
            logger.error(f"User signup error: {e}")
            return False, None, str(e)
    
    async def login(self, email: str, password: str) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Login flow - validates credentials and generates tokens
        Returns: (success, token_response, error_message)
        """
        try:
            # Get user by email
            user = await db_service.get_user_by_email(email)
            if not user:
                return False, None, "Invalid email or password"
            
            # Verify password
            if not self.auth_service.verify_password(password, user["password_hash"]):
                return False, None, "Invalid email or password"
            
            # Check if user is active
            if not user["is_active"]:
                return False, None, "Account is deactivated"
            
            # Update last login time
            await db_service.update_user_login_time(user["id"])
            
            # Generate tokens
            token_response = await self._generate_tokens(user)
            
            # Log audit event
            await db_service.create_audit_log({
                "user_id": str(user["id"]),
                "organization_id": str(user["organization_id"]),
                "action": "login",
                "resource": "user",
                "details": {"email": email}
            })
            
            return True, token_response, None
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False, None, str(e)
    
    async def refresh_token(self, refresh_token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Refresh token flow - validates refresh token and generates new access token
        Returns: (success, token_dict, error_message)
        """
        try:
            # Decode refresh token
            payload = self.auth_service.decode_token(refresh_token)
            if not payload:
                return False, None, "Invalid refresh token"
            
            # Validate token type
            if not self.auth_service.validate_token_type(payload, "refresh"):
                return False, None, "Invalid token type"
            
            # Check if token exists in database and is not revoked
            token_record = await db_service.get_refresh_token(refresh_token)
            if not token_record:
                return False, None, "Refresh token not found or revoked"
            
            # Check if token is expired
            expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at:
                return False, None, "Refresh token has expired"
            
            # Get user
            user_id = payload.get("user_id")
            user = await db_service.get_user_by_id(UUID(user_id))
            if not user or not user["is_active"]:
                return False, None, "User not found or inactive"
            
            # Generate new access token
            access_token = self.auth_service.create_access_token({
                "user_id": str(user["id"]),
                "email": user["email"],
                "role": user["role"],
                "organization_id": str(user["organization_id"])
            })
            
            return True, {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }, None
            
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            return False, None, str(e)
    
    async def _generate_tokens(self, user: Dict[str, Any]) -> TokenResponse:
        """Generate access and refresh tokens for user"""
        # Create token data
        token_data = {
            "user_id": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
            "organization_id": str(user["organization_id"])
        }
        
        # Generate tokens
        access_token = self.auth_service.create_access_token(token_data)
        refresh_token = self.auth_service.create_refresh_token(token_data)
        
        # Save refresh token to database
        expires_at = (datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).isoformat()
        await db_service.save_refresh_token(user["id"], refresh_token, expires_at)
        
        # Create user response
        user_response = UserResponse(
            id=UUID(user["id"]),
            organization_id=UUID(user["organization_id"]),
            full_name=user["full_name"],
            email=user["email"],
            job_title=user["job_title"],
            role=user["role"],
            is_active=user["is_active"],
            is_email_verified=user["is_email_verified"],
            created_at=datetime.fromisoformat(user["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(user["updated_at"].replace("Z", "+00:00"))
        )
        
        # Create token response
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )


# Singleton instance
auth_viewmodel = AuthViewModel()
