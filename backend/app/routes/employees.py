"""
Employee Routes - CRUD operations for employee management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from datetime import datetime
import logging
import httpx
import os

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Edge Function configuration from environment variables
EDGE_FUNCTION_URL = os.getenv("EDGE_FUNCTION_URL", "")
EDGE_FUNCTION_SECRET = os.getenv("EDGE_FUNCTION_SECRET", "")


async def notify_edge_function(employee: Dict[str, Any], company_name: str, recipient_email: str):
    """
    Call Edge Function to send email notification for new employee.
    
    Args:
        employee: The inserted employee record
        company_name: Name of the company
        recipient_email: Email address to send notification to
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                EDGE_FUNCTION_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {EDGE_FUNCTION_SECRET}"
                },
                json={
                    "record": {
                        "first_name": employee.get("first_name"),
                        "surname": employee.get("surname"),
                        "company_name": company_name,
                        "recipient_email": recipient_email,
                        "job_title": employee.get("job_title"),
                        "employment_start_date": employee.get("employment_start_date")
                    }
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Email notification sent successfully for employee {employee.get('id')}")
            else:
                error_data = response.json() if response.text else {}
                logger.warning(f"Edge Function returned status {response.status_code}: {error_data}")
    
    except httpx.TimeoutException:
        logger.warning(f"Timeout calling Edge Function for employee {employee.get('id')}")
    except Exception as e:
        logger.error(f"Failed to call Edge Function: {str(e)}")
        # Don't raise - we don't want email failures to break employee creation


@router.get("", status_code=status.HTTP_200_OK)
async def get_employees(current_user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Get all employees for the user's organization
    Decrypts sensitive PII fields before returning
    """
    try:
        organization_id = current_user["organization_id"]
        
        response = db_service.client.table("employees").select("*").eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        # Decrypt PII fields for all employees
        encryption = get_encryption_service()
        decrypted_employees = [
            encryption.decrypt_employee_pii(employee) 
            for employee in response.data
        ]
        
        return decrypted_employees
        
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
    Decrypts sensitive PII fields before returning
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
        
        # Decrypt PII fields before returning
        encryption = get_encryption_service()
        employee = encryption.decrypt_employee_pii(response.data[0])
        
        return employee
        
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
    Encrypts sensitive PII fields before storing
    
    The created_by_user_id is automatically set from the authenticated user's JWT token.
    This allows the database trigger to populate audit fields and track who created the record.
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        # Set creator and organization from authenticated user
        # This is CRITICAL for the database trigger to work properly
        employee_data["organization_id"] = organization_id
        employee_data["created_by_user_id"] = user_id
        
        # Set defaults if not provided
        if "service_status" not in employee_data:
            employee_data["service_status"] = "Active"
        if "io_upload_status" not in employee_data:
            employee_data["io_upload_status"] = False
        if "submitted_via" not in employee_data:
            employee_data["submitted_via"] = "manual"
        
        # **ENCRYPT PII FIELDS BEFORE DATABASE INSERT**
        encryption = get_encryption_service()
        employee_data = encryption.encrypt_employee_pii(employee_data)
        logger.info(f"Encrypted PII for new employee (org: {organization_id})")
        
        response = db_service.client.table("employees").insert(employee_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create employee"
            )
        
        employee = response.data[0]
        
        # Decrypt PII for response (user needs to see what they created)
        employee = encryption.decrypt_employee_pii(employee)
        
        # Fetch company name for email notification
        company_name = "Unknown Company"
        if employee.get("company_id"):
            try:
                company_response = db_service.client.table("companies").select("name").eq(
                    "id", employee["company_id"]
                ).execute()
                if company_response.data:
                    company_name = company_response.data[0]["name"]
            except Exception as e:
                logger.warning(f"Failed to fetch company name: {str(e)}")
        
        # Call Edge Function to send email notification (non-blocking)
        recipient_email = current_user.get("email")
        if recipient_email:
            await notify_edge_function(employee, company_name, recipient_email)
        else:
            logger.warning(f"No email found for user {user_id}")
        
        return employee
        
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
    Encrypts sensitive PII fields if they're being updated
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
        
        # **ENCRYPT PII FIELDS IF PRESENT IN UPDATE**
        encryption = get_encryption_service()
        employee_data = encryption.encrypt_employee_pii(employee_data)
        logger.info(f"Encrypted PII for employee update (id: {employee_id})")
        
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
        
        # Decrypt PII for response
        updated_employee = encryption.decrypt_employee_pii(response.data[0])
        
        return updated_employee
        
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
