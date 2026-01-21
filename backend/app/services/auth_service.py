"""
Authentication Service - Supabase Auth Integration
"""
from typing import Optional, Dict, Any
from app.services.database_service import db_service


class AuthService:
    """Supabase Authentication utilities"""
    
    @staticmethod
    async def signup_with_email(email: str, password: str, user_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sign up a new user using Supabase Auth
        Returns: Supabase auth response with user and session
        """
        try:
            response = db_service.client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": user_metadata  # Store additional user data
                }
            })
            return response
        except Exception as e:
            raise Exception(f"Signup failed: {str(e)}")
    
    @staticmethod
    async def signin_with_email(email: str, password: str) -> Dict[str, Any]:
        """
        Sign in a user using Supabase Auth
        Returns: Supabase auth response with user and session
        """
        try:
            response = db_service.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return response
        except Exception as e:
            raise Exception(f"Login failed: {str(e)}")
    
    @staticmethod
    async def signout(access_token: str) -> bool:
        """Sign out a user"""
        try:
            db_service.client.auth.sign_out()
            return True
        except Exception as e:
            return False
    
    @staticmethod
    async def get_user_from_token(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user details from access token"""
        try:
            response = db_service.client.auth.get_user(access_token)
            return response.user if response else None
        except Exception as e:
            return None
    
    @staticmethod
    async def refresh_session(refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            response = db_service.client.auth.refresh_session(refresh_token)
            return response
        except Exception as e:
            raise Exception(f"Token refresh failed: {str(e)}")
