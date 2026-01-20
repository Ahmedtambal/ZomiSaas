"""
Pydantic Models for Organizations
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class OrganizationBase(BaseModel):
    """Base organization model"""
    name: str = Field(..., min_length=2, max_length=200)


class OrganizationCreate(OrganizationBase):
    """Organization creation model"""
    pass


class OrganizationResponse(OrganizationBase):
    """Organization response model"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
