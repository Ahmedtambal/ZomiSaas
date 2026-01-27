"""
Employee Routes - CRUD operations for employee management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from datetime import datetime
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", status_code=status.HTTP_200_OK)
async def get_employees(current_user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Get all employees for the user's organization
    """
    try:
        organization_id = current_user["organization_id"]
        
        response = db_service.client.table("employees").select("*").eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Failed to fetch employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employees"
        )


@router.get("/{employee_id}", status_code=status.HTTP_200_OK)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get a single employee by ID
    """
    try:
        organization_id = current_user["organization_id"]
        
        response = db_service.client.table("employees").select("*").eq(
            "id", employee_id
        ).eq("organization_id", organization_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employee"
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_employee(employee_data: Dict[str, Any], current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Create a new employee
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        # Ensure organization_id is set
        employee_data["organization_id"] = organization_id
        employee_data["created_by_user_id"] = user_id
        
        # Set defaults if not provided
        if "service_status" not in employee_data:
            employee_data["service_status"] = "Active"
        if "io_upload_status" not in employee_data:
            employee_data["io_upload_status"] = False
        if "submitted_via" not in employee_data:
            employee_data["submitted_via"] = "manual"
        
        response = db_service.client.table("employees").insert(employee_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create employee"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )


@router.put("/{employee_id}", status_code=status.HTTP_200_OK)
async def update_employee(
    employee_id: str,
    employee_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update an employee
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Verify employee exists and belongs to user's organization
        existing = db_service.client.table("employees").select("id").eq(
            "id", employee_id
        ).eq("organization_id", organization_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Remove fields that shouldn't be updated
        employee_data.pop("id", None)
        employee_data.pop("organization_id", None)
        employee_data.pop("created_at", None)
        employee_data.pop("created_by_user_id", None)
        
        # Update employee
        response = db_service.client.table("employees").update(
            employee_data
        ).eq("id", employee_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update employee"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee: {str(e)}"
        )


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete an employee
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Verify employee exists and belongs to user's organization
        existing = db_service.client.table("employees").select("id").eq(
            "id", employee_id
        ).eq("organization_id", organization_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        db_service.client.table("employees").delete().eq("id", employee_id).execute()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employee"
        )


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_employees(
    data: Dict[str, List[str]],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Bulk delete employees
    """
    try:
        organization_id = current_user["organization_id"]
        employee_ids = data.get("ids", [])
        
        if not employee_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No employee IDs provided"
            )
        
        # Delete employees (CASCADE will handle related records)
        db_service.client.table("employees").delete().in_(
            "id", employee_ids
        ).eq("organization_id", organization_id).execute()
        
        return {"deleted_count": len(employee_ids)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to bulk delete employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employees"
        )


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_employees(
    q: str,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Search employees by name, email, or NI number
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Search using ILIKE for case-insensitive partial matching
        response = db_service.client.table("employees").select("*").eq(
            "organization_id", organization_id
        ).or_(
            f"first_name.ilike.%{q}%,surname.ilike.%{q}%,email_address.ilike.%{q}%,ni_number.ilike.%{q}%"
        ).execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Failed to search employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search employees"
        )
