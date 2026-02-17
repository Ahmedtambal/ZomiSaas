"""
Member Models
Represents member data for both IO Upload and New Employee databases
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class IOUploadMember(BaseModel):
    """IO Upload Member Model (Main Database)"""
    id: Optional[str] = None
    
    # Scheme Reference
    scheme_ref: str
    
    # Personal Information
    title: Optional[str] = None
    forename: str
    surname: str
    ni_number: Optional[str] = None
    date_of_birth: date
    legal_gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Address
    address_1: Optional[str] = None
    address_2: Optional[str] = None
    address_3: Optional[str] = None
    address_4: Optional[str] = None
    postcode: Optional[str] = None
    uk_resident: Optional[bool] = None
    nationality: Optional[str] = None
    
    # Employment
    salary: Optional[Decimal] = None
    employment_start_date: Optional[date] = None
    other: Optional[str] = None
    section_number: Optional[str] = None
    
    # Pension Information
    pension_investment_approach: Optional[str] = None
    category_name: Optional[str] = None
    advice_type: str
    selling_adviser_id: str
    
    # Provider Information
    provider_route: Optional[str] = None
    pension_starting_date: Optional[date] = None
    
    # Status Tracking
    io_upload_status: bool = False
    pension_pack: bool = False
    provider_status: bool = False
    
    # Financial Status
    invoiced: bool = False
    contributions_uploaded: bool = False
    
    # Insurance Coverage
    gl_cover: bool = False
    gip_cover: bool = False
    gci_cover: bool = False
    bupa_cover: bool = False
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class NewEmployeeMember(BaseModel):
    """New Employee Member Model (Onboarding Database)"""
    id: Optional[str] = None
    
    # Personal Information
    title: Optional[str] = None
    forename: str
    surname: str
    ni_number: Optional[str] = None
    date_of_birth: date
    legal_gender: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Address
    address_1: Optional[str] = None
    address_2: Optional[str] = None
    address_3: Optional[str] = None
    address_4: Optional[str] = None
    postcode: Optional[str] = None
    uk_resident: Optional[bool] = None
    nationality: Optional[str] = None
    
    # Employment
    salary: Optional[Decimal] = None
    employment_start_date: Optional[date] = None
    other: Optional[str] = None
    section_number: Optional[str] = None
    
    # Pension
    pension_investment_approach: Optional[str] = None
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


class MemberCreate(BaseModel):
    """Base schema for creating members"""
    pass


class MemberUpdate(BaseModel):
    """Base schema for updating members"""
    pass
