"""
Form Templates Routes - Template management and form duplication
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# FORM TEMPLATE ENDPOINTS
# ============================================================================

@router.get("/templates")
async def list_templates(
    tags: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all form templates
    
    Query params:
    - tags: Comma-separated list of tags to filter by
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Query forms marked as templates
        query = db_service.client.table("forms").select(
            "*"
        ).eq("organization_id", org_id).eq("is_template", True)
        
        # Filter by tags if provided
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            query = query.contains("tags", tag_list)
        
        response = query.order("created_at", desc=True).execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Failed to list templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list templates: {str(e)}"
        )


@router.post("/{form_id}/mark-as-template")
async def mark_as_template(
    form_id: str,
    template_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mark an existing form as a template
    
    Body:
    - tags: Array of tags (optional)
    """
    try:
        org_id = current_user.get("organization_id")
        
        update_data = {
            "is_template": True,
            "tags": template_data.get("tags", [])
        }
        
        response = db_service.client.table("forms").update(
            update_data
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark as template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark as template: {str(e)}"
        )


@router.post("/{form_id}/duplicate")
async def duplicate_form(
    form_id: str,
    duplicate_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Duplicate an existing form
    
    Body:
    - name: New form name (optional, defaults to "Copy of [original]")
    - linked_company_id: Link to specific company (optional)
    - is_template: Whether duplicate should be a template (optional)
    """
    try:
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Fetch original form
        original_response = db_service.client.table("forms").select(
            "*"
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not original_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        original_form = original_response.data[0]
        
        # Prepare duplicated form data
        new_name = duplicate_data.get("name")
        if not new_name:
            original_name = original_form.get("form_data", {}).get("name", "Untitled Form")
            new_name = f"Copy of {original_name}"
        
        # Create new form with copied data
        form_data_copy = original_form.get("form_data", {}).copy()
        form_data_copy["name"] = new_name
        
        duplicate_form = {
            "organization_id": org_id,
            "created_by_user_id": user_id,
            "template_type": original_form.get("template_type", "custom"),
            "linked_company_id": duplicate_data.get("linked_company_id", original_form.get("linked_company_id")),
            "form_data": form_data_copy,
            "processing_status": "Active",
            "parent_form_id": form_id,  # Track the source
            "is_template": duplicate_data.get("is_template", False),
            "tags": original_form.get("tags", [])
        }
        
        # Insert duplicated form
        response = db_service.client.table("forms").insert(duplicate_form).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to duplicate form"
            )
        
        # The trigger will automatically increment duplicate_count
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to duplicate form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to duplicate form: {str(e)}"
        )


@router.get("/{form_id}/duplicates")
async def list_form_duplicates(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    List all forms duplicated from this form
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Get the original form's duplicate count
        original_response = db_service.client.table("forms").select(
            "duplicate_count"
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not original_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        # Get all duplicates
        duplicates_response = db_service.client.table("forms").select(
            "*"
        ).eq("parent_form_id", form_id).eq("organization_id", org_id).order(
            "created_at", desc=True
        ).execute()
        
        return {
            "original_form_id": form_id,
            "duplicate_count": original_response.data[0].get("duplicate_count", 0),
            "duplicates": duplicates_response.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list duplicates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list duplicates: {str(e)}"
        )


@router.post("/{form_id}/create-from-template")
async def create_from_template(
    form_id: str,
    instance_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new form instance from a template
    Similar to duplicate but specifically for templates
    
    Body:
    - name: Instance name (required)
    - linked_company_id: Link to specific company (required for most cases)
    """
    try:
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Fetch template
        template_response = db_service.client.table("forms").select(
            "*"
        ).eq("id", form_id).eq("organization_id", org_id).eq("is_template", True).execute()
        
        if not template_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        template = template_response.data[0]
        
        # Validate required fields
        if not instance_data.get("name"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instance name is required"
            )
        
        # Create new form instance
        form_data_copy = template.get("form_data", {}).copy()
        form_data_copy["name"] = instance_data["name"]
        
        new_form = {
            "organization_id": org_id,
            "created_by_user_id": user_id,
            "template_type": template.get("template_type", "custom"),
            "linked_company_id": instance_data.get("linked_company_id"),
            "form_data": form_data_copy,
            "processing_status": "Active",
            "parent_form_id": form_id,
            "is_template": False,  # Instances are not templates
            "tags": []  # Start with no tags
        }
        
        response = db_service.client.table("forms").insert(new_form).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create form instance"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create from template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create from template: {str(e)}"
        )


@router.get("/{form_id}/versions")
async def list_form_versions(
    form_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all versions of a form
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Verify form belongs to user's organization
        form_response = db_service.client.table("forms").select(
            "id"
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not form_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        # Get all versions
        versions_response = db_service.client.table("form_versions").select(
            "*"
        ).eq("form_id", form_id).order("version_number", desc=True).execute()
        
        return versions_response.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list versions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list versions: {str(e)}"
        )


@router.get("/{form_id}/versions/{version_number}")
async def get_form_version(
    form_id: str,
    version_number: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a specific version of a form
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Verify form belongs to user's organization
        form_response = db_service.client.table("forms").select(
            "id"
        ).eq("id", form_id).eq("organization_id", org_id).execute()
        
        if not form_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        # Get specific version
        version_response = db_service.client.table("form_versions").select(
            "*"
        ).eq("form_id", form_id).eq("version_number", version_number).execute()
        
        if not version_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Version not found"
            )
        
        return version_response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get version: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get version: {str(e)}"
        )
