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
    
    # ==================== User Profiles ====================
    
    async def create_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user profile (linked to auth.users)"""
        try:
            profile_data['id'] = user_id  # Link to auth.users.id
            response = self.client.table("user_profiles").insert(profile_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            raise
    
    async def get_user_profile_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by auth user ID"""
        try:
            response = self.client.table("user_profiles").select("*").eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    async def get_user_profile_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user profile by email (through auth.users)"""
        try:
            # First get the user from auth.users
            response = self.client.auth.admin.list_users()
            auth_user = None
            for user in response:
                if user.email == email.lower():
                    auth_user = user
                    break
            
            if not auth_user:
                return None
            
            # Then get their profile
            return await self.get_user_profile_by_id(auth_user.id)
        except Exception as e:
            logger.error(f"Error getting user profile by email: {e}")
            return None
    
    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile"""
        try:
            self.client.table("user_profiles").update(profile_data).eq("id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
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
    
    async def mark_invite_code_used(self, code_id: UUID, user_id: str) -> bool:
        """Mark invite code as used"""
        try:
            self.client.table("invite_codes").update({
                "is_used": True,
                "used_by": user_id,  # Now references auth.users.id
                "used_at": "now()"
            }).eq("id", str(code_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error marking invite code as used: {e}")
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
