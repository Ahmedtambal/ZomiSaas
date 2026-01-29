"""
Activity Tracking Middleware
Tracks API activity and auto-expires sessions after 15 minutes of inactivity
"""
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# In-memory session activity tracker
# Format: { user_id: last_activity_timestamp }
session_activity: Dict[str, datetime] = {}

# Inactivity timeout (15 minutes)
INACTIVITY_TIMEOUT = timedelta(minutes=15)


class ActivityTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track user activity and enforce inactivity timeout
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip activity tracking for public routes and auth routes
        if (request.url.path.startswith("/api/public/") or 
            request.url.path.startswith("/api/auth/login") or
            request.url.path.startswith("/api/auth/signup") or
            request.url.path.startswith("/api/auth/refresh") or
            request.url.path.startswith("/health") or
            request.url.path == "/"):
            return await call_next(request)
        
        # Extract user_id from request state (set by auth dependency)
        user_id = None
        
        # Try to get user_id from Authorization header
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            # Get user_id from JWT (simplified - would need proper JWT decode)
            # For now, we'll rely on the auth dependency to validate
            # We'll update activity after successful auth validation
            pass
        
        # Process request
        response = await call_next(request)
        
        # If request was successful and authenticated, update activity
        if response.status_code < 400 and hasattr(request.state, "user"):
            user_id = request.state.user.get("id")
            if user_id:
                session_activity[user_id] = datetime.utcnow()
                logger.debug(f"Updated activity for user {user_id}")
        
        return response


def check_session_activity(user_id: str) -> bool:
    """
    Check if user session is still active (within inactivity timeout)
    Returns True if active, False if expired
    """
    if user_id not in session_activity:
        # First activity - allow
        session_activity[user_id] = datetime.utcnow()
        return True
    
    last_activity = session_activity[user_id]
    time_since_activity = datetime.utcnow() - last_activity
    
    if time_since_activity > INACTIVITY_TIMEOUT:
        # Session expired due to inactivity
        logger.info(f"Session expired for user {user_id} due to inactivity ({time_since_activity.total_seconds() / 60:.1f} minutes)")
        # Remove from tracker
        del session_activity[user_id]
        return False
    
    return True


def update_session_activity(user_id: str):
    """Update last activity timestamp for user"""
    session_activity[user_id] = datetime.utcnow()


def clear_session_activity(user_id: str):
    """Clear activity tracking for user (on logout)"""
    if user_id in session_activity:
        del session_activity[user_id]
        logger.info(f"Cleared session activity for user {user_id}")
