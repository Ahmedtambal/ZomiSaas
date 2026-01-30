"""
Form Management Routes - Authenticated endpoints for form CRUD and token management
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import secrets
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# FORM CRUD ENDPOINTS
# ============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_form(
    form_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new form
    
    Required fields:
    - name: Form name
    - description: Form description
    - form_data: Object with fields array
    - template_type: 'custom', 'sw_new_employee', or 'io_upload'
    - linked_company_id: UUID of company (optional)
    
    Optional fields:
    - is_template: Mark as template (default false)
    - tags: Array of tags for categorization
    - parent_form_id: Reference to original if duplicated
    """
    try:
        # Get user info from JWT
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Extract form_data structure
        form_definition = form_data.get("form_data", {})
        
        # Prepare insert data
        insert_data = {
            "organization_id": org_id,
            "created_by_user_id": user_id,
            "template_type": form_data.get("template_type", "custom"),
            "form_data": {
                "name": form_data.get("name"),
                "description": form_data.get("description", ""),
                "fields": form_definition.get("fields", []),
                "isActive": True
            },
            "processing_status": "Active",
            "is_template": form_data.get("is_template", False),
            "tags": form_data.get("tags", [])
        }
        
        # Add optional fields only if provided
        if form_data.get("linked_company_id"):
            insert_data["linked_company_id"] = form_data["linked_company_id"]
        if form_data.get("parent_form_id"):
            insert_data["parent_form_id"] = form_data["parent_form_id"]
        
        logger.info(f"Creating form with template_type: {insert_data['template_type']}")
        
        # Create form in database
        response = db_service.client.table("forms").insert(insert_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create form"
            )
        
        # Return form object directly for frontend compatibility
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Form creation failed: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Form creation failed: {str(e)}"
        )


@router.get("")
async def list_forms(
    organization_id: Optional[str] = None,
    template_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all forms for an organization
    
    Query params:
    - organization_id: Filter by organization
    - template_type: Filter by template type
    """
    try:
        # Use user's organization if not specified
        org_id = organization_id or current_user.get("organization_id")
        
        query = db_service.client.table("forms").select("*")
        
        if org_id:
            query = query.eq("organization_id", org_id)
        
        if template_type:
            query = query.eq("template_type", template_type)
        
        response = query.order("created_at", desc=True).execute()
        
        # Return array directly for frontend compatibility
        return response.data if response.data else []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve forms: {str(e)}"
        )


@router.get("/{form_id}")
async def get_form(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific form by ID"""
    try:
        response = db_service.client.table("forms").select("*").eq("id", form_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        # Return form object directly
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve form: {str(e)}"
        )


@router.put("/{form_id}/refresh-template")
async def refresh_form_template(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Refresh a form with the latest SW Employee template
    """
    try:
        # Get the form to check it exists
        form_response = db_service.client.table("forms").select("*").eq("id", form_id).execute()
        
        if not form_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        form = form_response.data[0]
        
        # Only refresh if it's an SW employee form
        if form.get("template_type") != "sw_new_employee":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only refresh SW Employee forms"
            )
        
        # Latest SW Employee template with all 21 fields
        updated_template = {
            "name": "SW New Employee Form",
            "description": "Complete employee onboarding form with all required information including personal details, address, and employment data",
            "isActive": True,
            "fields": [
                {"name": "title", "label": "Title", "type": "select", "required": True, "options": ["Mr", "Mrs", "Miss", "Ms", "Dr"]},
                {"name": "forename", "label": "Forename", "type": "text", "required": True},
                {"name": "surname", "label": "Surname", "type": "text", "required": True},
                {"name": "nationalInsuranceNumber", "label": "NI Number", "type": "text", "required": True},
                {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": True},
                {"name": "gender", "label": "Sex", "type": "select", "required": True, "options": ["Male", "Female", "Other", "Prefer not to say"]},
                {"name": "maritalStatus", "label": "Marital Status", "type": "select", "required": True, "options": ["Single", "Married", "Divorced", "Widowed", "Civil Partnership"]},
                {"name": "addressLine1", "label": "Address 1", "type": "text", "required": True},
                {"name": "addressLine2", "label": "Address 2", "type": "text", "required": False},
                {"name": "addressLine3", "label": "Address 3", "type": "text", "required": False},
                {"name": "addressLine4", "label": "Address 4", "type": "text", "required": False},
                {"name": "postcode", "label": "Postcode", "type": "text", "required": True},
                {"name": "ukResident", "label": "UK Resident", "type": "select", "required": True, "options": ["Yes", "No"]},
                {"name": "nationality", "label": "Nationality", "type": "text", "required": True},
                {"name": "salary", "label": "Salary", "type": "number", "required": True},
                {"name": "employmentStartDate", "label": "Employment Start Date", "type": "date", "required": True},
                {"name": "selectedRetirementAge", "label": "Selected Retirement Age", "type": "number", "required": True},
                {"name": "sectionNumber", "label": "Section Number", "type": "text", "required": False},
                {"name": "pensionInvestmentApproach", "label": "Pension Investment Approach", "type": "select", "required": True, "options": ["Conservative", "Moderate", "Aggressive"]},
            ]
        }
        
        # Update the form
        response = db_service.client.table("forms").update({
            "form_data": updated_template,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", form_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update form"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh template: {str(e)}"
        )


@router.put("/{form_id}")
async def update_form(
    form_id: str,
    form_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update a form (creator only)
    
    RLS policy enforces creator-only edit
    Note: Version snapshot is automatically created by database trigger
    
    Optional fields:
    - is_template: Mark as template
    - tags: Array of tags
    """
    try:
        update_data = {
            "form_data": {
                "name": form_data.get("name"),
                "description": form_data.get("description"),
                "fields": form_data.get("fields"),
                "isActive": form_data.get("isActive")
            },
            "updated_at": datetime.utcnow().isoformat(),
            "linked_company_id": form_data.get("linked_company_id")
        }
        
        # Add optional new fields if provided
        if "is_template" in form_data:
            update_data["is_template"] = form_data["is_template"]
        
        if "tags" in form_data:
            update_data["tags"] = form_data["tags"]
        
        response = db_service.client.table("forms").update(update_data).eq("id", form_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found or you don't have permission to edit"
            )
        
        # Return updated form directly
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update form: {str(e)}"
        )


@router.delete("/{form_id}")
async def delete_form(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete a form (creator only)
    
    RLS policy enforces creator-only delete
    """
    try:
        response = db_service.client.table("forms").delete().eq("id", form_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found or you don't have permission to delete"
            )
        
        return {
            "message": "Form deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete form: {str(e)}"
        )


# ============================================================================
# TOKEN MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/{form_id}/tokens", status_code=status.HTTP_201_CREATED)
async def generate_token(
    form_id: str,
    token_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate a secure token for form access
    
    Required fields:
    - company_id: UUID of company
    
    Optional fields:
    - expiry_days: Number of days until expiry (default: 30)
    - max_submissions: Maximum submissions allowed (default: null/unlimited)
    """
    try:
        # Get user info from JWT
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Generate secure 32-character token
        secure_token = secrets.token_urlsafe(32)
        
        # Calculate expiry date - 30 minutes from now
        expiry_minutes = 30
        expires_at = (datetime.utcnow() + timedelta(minutes=expiry_minutes)).isoformat()
        
        # Create token record
        response = db_service.client.table("form_tokens").insert({
            "form_id": form_id,
            "company_id": token_data["company_id"],
            "organization_id": org_id,
            "token": secure_token,
            "expires_at": expires_at,
            "max_submissions": token_data.get("max_submissions"),
            "created_by_user_id": user_id,
            "is_active": True,
            "submission_count": 0,
            "access_count": 0
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate token"
            )
        
        token_record = response.data[0]
        
        # Update form's linked_company_id only if not already set
        try:
            form_check = db_service.client.table("forms").select("linked_company_id").eq("id", form_id).execute()
            if form_check.data and not form_check.data[0].get("linked_company_id"):
                db_service.client.table("forms").update({
                    "linked_company_id": token_data["company_id"]
                }).eq("id", form_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update linked_company_id: {str(e)}")
            # Don't fail token generation if update fails
        
        # Return token info
        logger.info(f"Generated form token with 30-minute expiry: {secure_token[:8]}... for form {form_id}")
        return {
            "id": token_record["id"],
            "token": secure_token,
            "formId": form_id,
            "companyId": token_data["company_id"],
            "expiresAt": expires_at,
            "maxSubmissions": token_data.get("max_submissions"),
            "isActive": True,
            "submissionCount": 0,
            "createdAt": token_record["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token generation failed: {str(e)}"
        )


@router.get("/{form_id}/tokens")
async def list_tokens(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """List all tokens for a specific form"""
    try:
        response = db_service.client.table("form_tokens").select(
            "*, companies(name)"
        ).eq("form_id", form_id).order("created_at", desc=True).execute()
        
        # Return array directly for frontend compatibility
        return response.data if response.data else []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tokens: {str(e)}"
        )


@router.put("/tokens/{token_id}")
async def update_token(
    token_id: str,
    token_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update token settings (deactivate, extend expiry, etc.)
    """
    try:
        update_data = {}
        
        if "is_active" in token_data:
            update_data["is_active"] = token_data["is_active"]
        
        if "expires_at" in token_data:
            update_data["expires_at"] = token_data["expires_at"]
        
        if "max_submissions" in token_data:
            update_data["max_submissions"] = token_data["max_submissions"]
        
        response = db_service.client.table("form_tokens").update(
            update_data
        ).eq("id", token_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found"
            )
        
        # Return updated token directly
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update token: {str(e)}"
        )


@router.get("/{form_id}/submissions")
async def get_form_submissions(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get all submissions for a specific form
    """
    try:
        # Get all employees submitted via this form's tokens
        response = db_service.client.table("employees").select(
            "*, form_tokens!inner(form_id)"
        ).eq("form_tokens.form_id", form_id).execute()
        
        # Return array directly for frontend compatibility
        return response.data if response.data else []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve submissions: {str(e)}"
        )
