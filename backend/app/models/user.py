"""
User Model - Authentication & Profile
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re


class UserBase(BaseModel):
    """Base user model"""
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    job_title: Optional[str] = Field(None, max_length=200)


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(admin|user)$")
    organization_id: Optional[UUID] = None  # For user signup
    invite_code: Optional[str] = None  # For user signup
    organization_name: Optional[str] = None  # For admin signup
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response model (no sensitive data)"""
    id: UUID
    organization_id: UUID
    role: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenRefresh(BaseModel):
    """Token refresh request"""
    refresh_token: str
