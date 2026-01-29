"""
Employee Routes - CRUD operations for employee management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import httpx
import os
import io
import csv

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.services.audit_service import audit_service
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
    Includes company name from companies table
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Join with companies table to get company name
        response = db_service.client.table("employees").select(
            "*, companies(name)"
        ).eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        # Decrypt PII fields for all employees
        encryption = get_encryption_service()
        decrypted_employees = []
        for employee in response.data:
            decrypted = encryption.decrypt_employee_pii(employee)
            # Extract company name from nested object
            if employee.get("companies"):
                decrypted["company_name"] = employee["companies"].get("name")
            decrypted_employees.append(decrypted)
        
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
    Includes company name from companies table
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Join with companies table to get company name
        response = db_service.client.table("employees").select(
            "*, companies(name)"
        ).eq(
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
        
        # Extract company name from nested object
        if response.data[0].get("companies"):
            employee["company_name"] = response.data[0]["companies"].get("name")
        
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
        
        # Audit log - employee created
        await audit_service.log_employee_create(
            employee_id=employee["id"],
            employee_data=employee_data,
            user_id=user_id,
            organization_id=organization_id
        )
        
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
                # Fetch existing employee data for audit log
        existing_employee = db_service.client.table("employees").select("*").eq(
            "id", employee_id
        ).execute()
        old_employee_data = existing_employee.data[0] if existing_employee.data else {}
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
        
        employee = response.data[0]
        
        # Audit log - employee updated
        await audit_service.log_employee_update(
            employee_id=employee_id,
            old_data=old_employee_data,
            new_data=employee,
            user_id=current_user["id"],
            organization_id=organization_id
        )
        
        # Decrypt PII for response
        updated_employee = encryption.decrypt_employee_pii(employee)
        
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
        
        # Fetch employee data before deletion for audit log
        existing = db_service.client.table("employees").select("*").eq(
            "id", employee_id
        ).eq("organization_id", organization_id).execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        employee_data = existing.data[0]
        
        # Delete the employee
        db_service.client.table("employees").delete().eq("id", employee_id).execute()
        
        # Audit log - employee deleted
        await audit_service.log_employee_delete(
            employee_id=employee_id,
            employee_data=employee_data,
            user_id=current_user["id"],
            organization_id=organization_id
        )
        
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
        
        # Audit log - bulk delete
        await audit_service.log_bulk_delete(
            table_name="employees",
            record_ids=employee_ids,
            user_id=current_user["id"],
            organization_id=organization_id
        )
        
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


@router.get("/export/io-template", status_code=status.HTTP_200_OK)
async def export_employees_io_template(
    format: str = "csv",
    company_id: Optional[str] = None,
    advice_type: Optional[str] = None,
    pension_provider: Optional[str] = None,
    service_status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Export employees in IO Bulk Upload Template format
    
    Supports filtering by:
    - company_id: Filter by specific company
    - advice_type: Filter by advice type (e.g., "Migrated Plans", "Pre-Existing Plan")
    - pension_provider: Filter by pension provider (partial match in pension_provider_info)
    - service_status: Filter by service status (e.g., "Active", "Inactive")
    - from_date/to_date: Filter by created_at date range
    
    Returns CSV file with IO Bulk Upload Template headers (30 columns)
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Build query with filters
        query = db_service.client.table("employees").select("*").eq(
            "organization_id", organization_id
        )
        
        # Apply filters
        if company_id:
            query = query.eq("company_id", company_id)
        if advice_type:
            query = query.eq("advice_type", advice_type)
        if pension_provider:
            query = query.ilike("pension_provider_info", f"%{pension_provider}%")
        if service_status:
            query = query.eq("service_status", service_status)
        if from_date:
            query = query.gte("created_at", from_date)
        if to_date:
            query = query.lte("created_at", to_date)
        
        response = query.order("created_at", desc=True).execute()
        
        logger.info(f"Fetched {len(response.data)} employees from database")
        
        # Decrypt PII fields
        encryption = get_encryption_service()
        employees = [encryption.decrypt_employee_pii(emp) for emp in response.data]
        
        # Log first employee to see structure (if any)
        if employees:
            logger.info(f"Sample employee keys: {list(employees[0].keys())}")
            logger.info(f"Sample employee data: surname={employees[0].get('surname')}, first_name={employees[0].get('first_name')}, scheme_ref={employees[0].get('scheme_ref')}")
        
        # Transform to IO Bulk Upload Template format
        io_template_rows = []
        for emp in employees:
            row = {
                'Surname*': emp.get('surname', ''),
                'FirstName*': emp.get('first_name', ''),
                'SchemeRef*': emp.get('scheme_ref', ''),
                'CategoryName': emp.get('client_category', ''),
                'Title': emp.get('title', ''),
                'AddressLine1': emp.get('address_line_1', ''),
                'AddressLine2': emp.get('address_line_2', ''),
                'AddressLine3': emp.get('address_line_3', ''),
                'AddressLine4': emp.get('address_line_4', ''),
                'CityTown': emp.get('city_town', ''),
                'County': emp.get('county', ''),
                'Country': emp.get('country', ''),
                'PostCode': emp.get('postcode', ''),
                'AdviceType*': emp.get('advice_type', ''),
                'DateJoinedScheme': emp.get('date_joined_scheme', ''),
                'DateofBirth*': emp.get('date_of_birth', ''),
                'EmailAddress': emp.get('email_address', ''),
                'Gender': emp.get('gender', ''),
                'HomeNumber': emp.get('home_number', ''),
                'MobileNumber': emp.get('mobile_number', ''),
                'NINumber': emp.get('ni_number', ''),
                'PensionableSalary': str(emp.get('pensionable_salary', '')) if emp.get('pensionable_salary') else '',
                'PensionableSalaryStartDate': emp.get('pensionable_salary_start_date', ''),
                'SalaryPostSacrifice': str(emp.get('salary_post_sacrifice', '')) if emp.get('salary_post_sacrifice') else '',
                'PolicyNumber': emp.get('policy_number', ''),
                'SellingAdviserId*': emp.get('selling_adviser_id', ''),
                'SplitTemplateGroupName': emp.get('split_template_group_name', ''),
                'SplitTemplateGroupSource': emp.get('split_template_group_source', ''),
                'ServiceStatus': emp.get('service_status', ''),
                'ClientCategory': emp.get('client_category', '')
            }
            io_template_rows.append(row)
        
        # Generate CSV - Always include headers
        output = io.StringIO()
        fieldnames = [
            'Surname*', 'FirstName*', 'SchemeRef*', 'CategoryName', 'Title',
            'AddressLine1', 'AddressLine2', 'AddressLine3', 'AddressLine4',
            'CityTown', 'County', 'Country', 'PostCode', 'AdviceType*',
            'DateJoinedScheme', 'DateofBirth*', 'EmailAddress', 'Gender',
            'HomeNumber', 'MobileNumber', 'NINumber', 'PensionableSalary',
            'PensionableSalaryStartDate', 'SalaryPostSacrifice', 'PolicyNumber',
            'SellingAdviserId*', 'SplitTemplateGroupName', 'SplitTemplateGroupSource',
            'ServiceStatus', 'ClientCategory'
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        # Write data rows if any
        if io_template_rows:
            writer.writerows(io_template_rows)
        
        logger.info(f"Exporting {len(io_template_rows)} employees to CSV")
        
        # Audit log - data export
        await audit_service.log_export(
            table_name="employees",
            user_id=current_user["id"],
            organization_id=organization_id,
            filters={
                "company_id": company_id,
                "advice_type": advice_type,
                "pension_provider": pension_provider,
                "service_status": service_status,
                "from_date": from_date,
                "to_date": to_date
            },
            record_count=len(io_template_rows)
        )
        
        # Create response
        output.seek(0)
        filename = f"employee_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
    except Exception as e:
        logger.error(f"Failed to export employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export employees: {str(e)}"
        )
