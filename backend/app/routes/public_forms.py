"""
Public Form Routes - No authentication required, token-based access
"""
from fastapi import APIRouter, HTTPException, status, Request
from typing import Dict, Any
from datetime import datetime
import logging

from app.services.database_service import db_service

router = APIRouter()
logger = logging.getLogger(__name__)


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
        
        # Return form with company info
        return {
            "message": "Form retrieved successfully",
            "data": {
                "form": token_record["forms"],
                "company": token_record["companies"],
                "token_info": {
                    "expires_at": token_record["expires_at"],
                    "submissions_remaining": (
                        token_record["max_submissions"] - token_record["submission_count"]
                        if token_record["max_submissions"]
                        else None
                    )
                }
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
        
        # Get client IP and user agent
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        
        # Enrich employee data with company rules from Master Rulebook
        employee_data = {
            "organization_id": token_record["organization_id"],
            "company_id": company["id"],
            "source_form_id": token_record["form_id"],
            
            # Employee data from form
            "title": submission_data.get("title"),
            "first_name": submission_data.get("forename"),
            "surname": submission_data.get("surname"),
            "ni_number": submission_data.get("ni_number"),
            "date_of_birth": submission_data.get("date_of_birth"),
            "gender": submission_data.get("sex"),
            "marital_status": submission_data.get("marital_status"),
            
            # Address
            "address_line_1": submission_data.get("address_1"),
            "address_line_2": submission_data.get("address_2"),
            "address_line_3": submission_data.get("address_3"),
            "address_line_4": submission_data.get("address_4"),
            "postcode": submission_data.get("postcode"),
            "uk_resident": submission_data.get("uk_resident"),
            "nationality": submission_data.get("nationality"),
            
            # Employment
            "pensionable_salary": submission_data.get("salary"),
            "employment_start_date": submission_data.get("employment_start_date"),
            "selected_retirement_age": submission_data.get("selected_retirement_age"),
            "pension_investment_approach": submission_data.get("pension_investment_approach"),
            
            # Auto-filled from company (Master Rulebook)
            "client_category": company.get("category_name"),
            
            # Tracking
            "submission_token": token,
            "submitted_via": "form_link",
            "ip_address": client_ip,
            "user_agent": user_agent,
            "service_status": "Active",
            "io_upload_status": False
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
                "form_id": token_record["form_id"],
                "company_id": company["id"],
                "token": token,
                "submission_method": "public_form"
            },
            "ip_address": client_ip,
            "user_agent": user_agent
        })
        
        return {
            "message": "Form submitted successfully",
            "data": {
                "employee_id": employee["id"],
                "submission_id": employee["id"],
                "company_name": company["name"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Form submission failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission failed: {str(e)}"
        )
