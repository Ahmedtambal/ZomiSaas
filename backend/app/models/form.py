"""
Form Models
Represents dynamic forms, submissions, and links
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class FormDefinition(BaseModel):
    """Form Definition Model"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]]  # JSON structure of form fields
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FormSubmission(BaseModel):
    """Form Submission Model"""
    id: Optional[str] = None
    form_id: str
    data: Dict[str, Any]  # Submitted form data
    ip_address: Optional[str] = None
    submitted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FormLink(BaseModel):
    """Form Link Model"""
    id: Optional[str] = None
    form_id: str
    url: str
    is_active: bool = True
    access_count: int = 0
    expires_at: datetime
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FormCreate(BaseModel):
    """Schema for creating a form"""
    name: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]]
    is_active: bool = True


class FormUpdate(BaseModel):
    """Schema for updating a form"""
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None
