"""
Authentication Service - Supabase Auth Integration (Stateless Per-Request)
"""
from typing import Optional, Dict, Any
from supabase import create_client, Client
from app.config import settings


class AuthService:
    """Supabase Authentication utilities with per-request client creation"""
    
    def __init__(self):
        """Initialize with config, but don't create persistent client"""
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
    
    def _get_client(self) -> Client:
        """Create a fresh Supabase client for each request"""
        return create_client(self.supabase_url, self.supabase_key)
    
    async def signup_with_email(self, email: str, password: str, user_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sign up a new user using Supabase Auth
        Returns: Supabase auth response with user and session
        """
        try:
            client = self._get_client()
            response = client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": user_metadata  # Store additional user data
                }
            })
            return response
        except Exception as e:
            raise Exception(f"Signup failed: {str(e)}")
    
    async def signin_with_email(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in a user using Supabase Auth
        Returns: Supabase auth response with user and session
        """
        try:
            client = self._get_client()
            response = client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return response
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")
    
    async def signout(self, access_token: str) -> bool:
        """Sign out a user with specific token"""
        try:
            client = self._get_client()
            # Set the session with the access token before signing out
            client.auth.set_session(access_token, access_token)  # Use access token for both
            client.auth.sign_out()
            return True
        except Exception as e:
            return False
    
    async def get_user_from_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user details from access token"""
        try:
            client = self._get_client()
            response = client.auth.get_user(access_token)
            return response.user if response else None
        except Exception as e:
            return None
    
    async def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            client = self._get_client()
            response = client.auth.refresh_session(refresh_token)
            return response
        except Exception as e:
            raise Exception(f"Token refresh failed: {str(e)}")
    
    async def reset_password_for_email(self, email: str) -> bool:
        """Send password reset email"""
        try:
            client = self._get_client()
            client.auth.reset_password_email(email, {
                "redirect_to": f"{settings.FRONTEND_URL}/reset-password"
            })
            return True
        except Exception as e:
            # Don't expose error details for security
            return True
    
    async def update_user_password(self, access_token: str, new_password: str) -> bool:
        """Update user password with recovery token"""
        try:
            client = self._get_client()
            # Use the recovery token to set a session and update password
            client.auth.set_session(access_token, access_token)
            client.auth.update_user({"password": new_password})
            return True
        except Exception as e:
            raise Exception(f"Password update failed: {str(e)}")
