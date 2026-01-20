"""
User Model
Represents user profiles and authentication data
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "Admin"
    MEMBER = "Member"


class User(BaseModel):
    """User Profile Model"""
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    date_of_birth: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """User creation schema"""
    email: EmailStr
    password: str
    full_name: str
    invite_code: str
    date_of_birth: Optional[datetime] = None


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class UserResponse(BaseModel):
    """User response schema (excludes sensitive data)"""
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    date_of_birth: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
