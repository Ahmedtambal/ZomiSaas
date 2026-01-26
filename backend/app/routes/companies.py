"""
Companies API Routes
Handles company (Master Rulebook) operations
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_companies(
    organization_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all companies (Master Rulebook entries) for the organization
    """
    try:
        org_id = organization_id or current_user.get("organization_id")
        
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID is required"
            )
        
        # Query companies table with RLS
        response = db_service.client.table("companies").select("*").eq("organization_id", org_id).execute()
        
        # Return empty array if no data
        return response.data if response.data else []
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch companies: {str(e)}"
        )

@router.get("/{company_id}")
async def get_company(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific company by ID
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
