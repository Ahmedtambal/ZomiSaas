"""
Public Form Routes - No authentication required, token-based access
"""
from fastapi import APIRouter, HTTPException, status, Request
from typing import Dict, Any
from datetime import datetime
import logging
import httpx
import os

from app.services.database_service import db_service

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


@router.get("/forms/{token}")
async def get_form_by_token(token: str, request: Request) -> Dict[str, Any]:
    """
    Get form definition by token (public access)
    
    This endpoint:
    1. Validates the token
    2. Checks expiry and active status
    3. Increments access count
    4. Returns form definition with company info
    """
    try:
        # Get token record
        token_response = db_service.client.table("form_tokens").select(
            "*, forms(*), companies(name, id)"
        ).eq("token", token).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or expired link"
            )
        
        token_record = token_response.data[0]
        
        # Check if token is active
        if not token_record["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This link has been deactivated"
            )
        
        # Check expiry
        if token_record["expires_at"]:
            expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This link has expired"
                )
        
        # Check max submissions
        if token_record["max_submissions"]:
            if token_record["submission_count"] >= token_record["max_submissions"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This link has reached its maximum number of submissions"
                )
        
        # Increment access count
        db_service.client.table("form_tokens").update({
            "access_count": token_record["access_count"] + 1,
            "last_accessed_at": datetime.utcnow().isoformat()
        }).eq("id", token_record["id"]).execute()
        
        # Return form with company info directly (no wrapper)
        return {
            "form": token_record["forms"],
            "company": token_record["companies"],
            "token_info": {
                "expires_at": token_record["expires_at"],
                "max_submissions": token_record["max_submissions"],
                "submission_count": token_record["submission_count"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve form by token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load form"
        )


@router.post("/forms/{token}/submit")
async def submit_form(token: str, submission_data: Dict[str, Any], request: Request) -> Dict[str, Any]:
    """
    Submit form data (public access)
    
    This endpoint:
    1. Validates token
    2. Enriches data with company rules from Master Rulebook
    3. Creates employee record
    4. Increments submission count
    5. Logs audit trail
    """
    try:
        # Get token and validate
        token_response = db_service.client.table("form_tokens").select(
            "*, companies(*), forms(*)"
        ).eq("token", token).execute()
        
        if not token_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid token"
            )
        
        token_record = token_response.data[0]
        
        # Validate token status
        if not token_record["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This link has been deactivated"
            )
        
        if token_record["expires_at"]:
            expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This link has expired"
                )
        
        if token_record["max_submissions"]:
            if token_record["submission_count"] >= token_record["max_submissions"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Maximum submissions reached"
                )
        
        # Get company for auto-fill
        company = token_record["companies"]
        
        # Get the user who created the form (for created_by tracking)
        form_creator_id = token_record["forms"].get("created_by_user_id")
        
        # Get client IP and user agent
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        
        # Map form fields to employees table columns
        employee_data = {
            "organization_id": token_record["organization_id"],
            "company_id": company["id"],
            "source_form_id": token_record["form_id"],
            
            # Personal Information
            "title": submission_data.get("title"),
            "first_name": submission_data.get("forename"),
            "surname": submission_data.get("surname"),
            "ni_number": submission_data.get("nationalInsuranceNumber"),
            "email_address": submission_data.get("emailAddress"),  # NEW: Email Address
            "mobile_number": submission_data.get("contactNumber"),  # NEW: Contact Number
            "date_of_birth": submission_data.get("dateOfBirth"),
            "gender": submission_data.get("gender"),
            "marital_status": submission_data.get("maritalStatus"),
            
            # Address
            "address_line_1": submission_data.get("addressLine1"),
            "address_line_2": submission_data.get("addressLine2"),
            "address_line_3": submission_data.get("addressLine3"),
            "address_line_4": submission_data.get("addressLine4"),
            "postcode": submission_data.get("postcode"),
            "uk_resident": submission_data.get("ukResident") == "Yes" if submission_data.get("ukResident") else None,
            "nationality": submission_data.get("nationality"),
            
            # Employment
            "job_title": submission_data.get("jobTitle"),  # NEW: Job Title
            "pensionable_salary": submission_data.get("salary"),
            "employment_start_date": submission_data.get("employmentStartDate"),
            "selected_retirement_age": submission_data.get("selectedRetirementAge"),
            "pension_investment_approach": submission_data.get("pensionInvestmentApproach"),
            
            # Section information (optional)
            "split_template_group_name": submission_data.get("sectionNumber"),
            
            # Auto-filled from company
            "client_category": company.get("category_name"),
            
            # Tracking
            "submission_token": token,
            "submitted_via": "form_link",
            "ip_address": client_ip,
            "user_agent": user_agent,
            "service_status": "Active",
            "io_upload_status": False,
            "created_by_user_id": form_creator_id  # Inherit from form creator
        }
        
        # Create employee record
        employee_response = db_service.client.table("employees").insert(
            employee_data
        ).execute()
        
        if not employee_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create employee record"
            )
        
        employee = employee_response.data[0]
        
        # Get recipient email (the user who created the form)
        # Email is stored in Supabase auth.users, accessible via admin API
        recipient_email = None
        if form_creator_id:
            try:
                # Use RPC to get user email from auth.users via a database function
                # Alternative: query directly if we had admin access
                user_response = db_service.client.rpc(
                    'get_user_email_by_id',
                    {'user_id': form_creator_id}
                ).execute()
                if user_response.data:
                    recipient_email = user_response.data
            except Exception as e:
                logger.warning(f"Failed to fetch creator email: {str(e)}")
        
        # Call Edge Function to send email notification (non-blocking)
        if recipient_email:
            await notify_edge_function(employee, company["name"], recipient_email)
        else:
            logger.warning(f"No recipient email found for form creator {form_creator_id}")
        
        # Create NEW form record for this submission (instead of updating the template)
        new_form_response = db_service.client.table("forms").insert({
            "organization_id": token_record["organization_id"],
            "created_by_user_id": form_creator_id,
            "matched_company_id": company["id"],
            "linked_company_id": company["id"],
            "template_type": "new_employee_upload",
            "form_data": {
                "fields": token_record["forms"]["form_data"]["fields"],  # Keep field definitions
                "submission_data": submission_data,  # The actual submitted values
                "submitted_at": datetime.utcnow().isoformat(),
                "employee_name": f"{submission_data.get('forename', '')} {submission_data.get('surname', '')}".strip()
            },
            "processing_status": "Completed",
            "submitted_via": "form_link",
            "ip_address": client_ip,
            "user_agent": user_agent
        }).execute()
        
        new_form_id = new_form_response.data[0]["id"] if new_form_response.data else None
        
        # Increment token submission count
        db_service.client.table("form_tokens").update({
            "submission_count": token_record["submission_count"] + 1,
            "last_accessed_at": datetime.utcnow().isoformat()
        }).eq("id", token_record["id"]).execute()
        
        # Create audit log
        await db_service.create_audit_log({
            "user_id": None,  # Public submission, no user
            "organization_id": token_record["organization_id"],
            "action": "form_submission",
            "resource": "employee",
            "details": {
                "employee_id": str(employee["id"]),
                "form_id": new_form_id,  # Use the new form record ID
                "template_form_id": token_record["form_id"],  # Reference to template
                "company_id": company["id"],
                "token": token,
                "submission_method": "public_form"
            },
            "ip_address": client_ip,
            "user_agent": user_agent
        })
        
        # Return directly without message wrapper
        return {
            "employee_id": employee["id"],
            "submission_id": employee["id"],
            "company_name": company["name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Form submission failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission failed: {str(e)}"
        )
