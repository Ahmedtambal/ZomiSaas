"""
Supabase Database Service
"""
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabase database operations"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY  # service_role key for backend
        )
    
    # ==================== Organizations ====================
    
    async def create_organization(self, name: str) -> Dict[str, Any]:
        """Create a new organization"""
        try:
            response = self.client.table("organizations").insert({
                "name": name
            }).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating organization: {e}")
            raise
    
    async def get_organization(self, org_id: UUID) -> Optional[Dict[str, Any]]:
        """Get organization by ID"""
        try:
            response = self.client.table("organizations").select("*").eq("id", str(org_id)).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting organization: {e}")
            return None
    
    # ==================== Users ====================
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        try:
            response = self.client.table("users").insert(user_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            response = self.client.table("users").select("*").eq("email", email.lower()).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            response = self.client.table("users").select("*").eq("id", str(user_id)).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    async def update_user_login_time(self, user_id: UUID) -> bool:
        """Update user's last login timestamp"""
        try:
            self.client.table("users").update({
                "last_login_at": "now()"
            }).eq("id", str(user_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating login time: {e}")
            return False
    
    # ==================== Invite Codes ====================
    
    async def get_invite_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Get invite code by code string"""
        try:
            response = self.client.table("invite_codes").select("*").eq("code", code.upper()).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting invite code: {e}")
            return None
    
    async def mark_invite_code_used(self, code_id: UUID, user_id: UUID) -> bool:
        """Mark invite code as used"""
        try:
            self.client.table("invite_codes").update({
                "is_used": True,
                "used_by": str(user_id),
                "used_at": "now()"
            }).eq("id", str(code_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error marking invite code as used: {e}")
            return False
    
    # ==================== Refresh Tokens ====================
    
    async def save_refresh_token(self, user_id: UUID, token: str, expires_at: str) -> bool:
        """Save refresh token to database"""
        try:
            self.client.table("refresh_tokens").insert({
                "user_id": str(user_id),
                "token": token,
                "expires_at": expires_at
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error saving refresh token: {e}")
            return False
    
    async def get_refresh_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get refresh token from database"""
        try:
            response = self.client.table("refresh_tokens").select("*").eq("token", token).is_("revoked_at", "null").execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting refresh token: {e}")
            return None
    
    async def revoke_refresh_token(self, token: str) -> bool:
        """Revoke refresh token"""
        try:
            self.client.table("refresh_tokens").update({
                "revoked_at": "now()"
            }).eq("token", token).execute()
            return True
        except Exception as e:
            logger.error(f"Error revoking refresh token: {e}")
            return False
    
    # ==================== Audit Logs ====================
    
    async def create_audit_log(self, log_data: Dict[str, Any]) -> bool:
        """Create audit log entry"""
        try:
            self.client.table("audit_logs").insert(log_data).execute()
            return True
        except Exception as e:
            logger.error(f"Error creating audit log: {e}")
            return False


# Singleton instance
db_service = SupabaseService()
