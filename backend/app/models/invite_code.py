"""
Invite Code Model
Represents invitation codes for user registration
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class InviteCode(BaseModel):
    """Invite Code Model"""
    id: Optional[str] = None
    code: str  # 6-digit code
    role: UserRole
    is_used: bool = False
    created_by: Optional[str] = None
    used_by: Optional[str] = None
    created_at: Optional[datetime] = None
    used_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class InviteCodeCreate(BaseModel):
    """Schema for creating an invite code"""
    role: UserRole = UserRole.MEMBER


class InviteCodeValidate(BaseModel):
    """Schema for validating an invite code"""
    code: str
