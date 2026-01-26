"""
Companies API Routes
Handles company (Master Rulebook) operations
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.services.database_service import db_service

router = APIRouter()

@router.get("/")
async def get_companies(
    organization_id: Optional[str] = None
):
    """
    Get all companies (Master Rulebook entries) for the organization
    TODO: Add authentication and get organization_id from current user
    """
    try:
        org_id = organization_id
        
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID is required"
            )
        
        # Query companies table with RLS
        response = db_service.client.table("companies").select("*").eq("organization_id", org_id).execute()
        
        return response.data
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch companies: {str(e)}"
        )

@router.get("/{company_id}")
async def get_company(
    company_id: str
):
    """
    Get a specific company by ID
    TODO: Add authentication check
    """
    try:
        # Query with RLS
        response = db_service.client.table("companies").select("*").eq("id", company_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch company: {str(e)}"
        )
