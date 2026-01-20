"""
Pydantic Models for Invite Codes
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class InviteCodeBase(BaseModel):
    """Base invite code model"""
    role: str = Field(..., pattern="^(admin|user)$")


class InviteCodeCreate(InviteCodeBase):
    """Invite code creation model"""
    organization_id: UUID


class InviteCodeResponse(InviteCodeBase):
    """Invite code response model"""
    id: UUID
    code: str
    organization_id: UUID
    is_used: bool
    expires_at: datetime
    created_at: datetime
    used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InviteCodeValidate(BaseModel):
    """Invite code validation request"""
    code: str = Field(..., min_length=8, max_length=8)
