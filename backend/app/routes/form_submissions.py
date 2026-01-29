"""
Form Submissions Routes - CRUD operations for form submissions
"""
from fastapi import APIRouter, HTTPException, status, Depends, Response
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime
import logging
import csv
import io

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# FORM SUBMISSION ENDPOINTS
# ============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new form submission
    
    Required fields:
    - form_id: UUID of the form
    - submission_data: JSONB object with form answers
    - status: pending, reviewing, approved, rejected, completed
    """
    try:
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        
        # Create submission record
        response = db_service.client.table("form_submissions").insert({
            "form_id": submission_data.get("form_id"),
            "form_version": submission_data.get("form_version", 1),
            "submission_data": submission_data.get("submission_data"),
            "status": submission_data.get("status", "pending"),
            "submitted_by_user_id": user_id,
            "submitted_via": submission_data.get("submitted_via", "manual"),
            "organization_id": org_id,
            "company_id": submission_data.get("company_id"),
            "employee_id": submission_data.get("employee_id"),
            "token_id": submission_data.get("token_id"),
            "ip_address": submission_data.get("ip_address"),
            "user_agent": submission_data.get("user_agent"),
            "notes": submission_data.get("notes")
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create submission"
            )
        
        return response.data[0]
        
    except Exception as e:
        logger.error(f"Submission creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission creation failed: {str(e)}"
        )


@router.get("")
async def list_submissions(
    form_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    company_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    List form submissions with filters
    
    Query params:
    - form_id: Filter by form
    - status_filter: Filter by status (pending, reviewing, approved, rejected, completed)
    - company_id: Filter by company
    - employee_id: Filter by employee
    - limit: Number of results (default 50)
    - offset: Pagination offset
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Build query
        query = db_service.client.table("form_submissions").select(
            "*",
            count="exact"
        ).eq("organization_id", org_id)
        
        if form_id:
            query = query.eq("form_id", form_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        if company_id:
            query = query.eq("company_id", company_id)
        
        if employee_id:
            query = query.eq("employee_id", employee_id)
        
        # Apply pagination and ordering
        query = query.order("submitted_at", desc=True).range(offset, offset + limit - 1)
        
        response = query.execute()
        
        # Decrypt submission_data for each submission
        encryption = get_encryption_service()
        decrypted_submissions = []
        for submission in response.data:
            if submission.get("submission_data"):
                try:
                    submission["submission_data"] = encryption.decrypt_json(submission["submission_data"])
                    logger.debug(f"Decrypted submission_data for submission {submission['id']}")
                except Exception as e:
                    logger.warning(f"Failed to decrypt submission_data for {submission['id']}: {str(e)}")
                    submission["submission_data"] = {"error": "Failed to decrypt"}
            decrypted_submissions.append(submission)
        
        return {
            "data": decrypted_submissions,
            "count": response.count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to list submissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list submissions: {str(e)}"
        )


@router.get("/{submission_id}")
async def get_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a specific submission by ID
    """
    try:# Decrypt submission_data
        submission = response.data[0]
        if submission.get("submission_data"):
            encryption = get_encryption_service()
            try:
                submission["submission_data"] = encryption.decrypt_json(submission["submission_data"])
                logger.debug(f"Decrypted submission_data for submission {submission_id}")
            except Exception as e:
                logger.warning(f"Failed to decrypt submission_data for {submission_id}: {str(e)}")
                submission["submission_data"] = {"error": "Failed to decrypt"}
        
        return submission
        org_id = current_user.get("organization_id")
        
        response = db_service.client.table("form_submissions").select("*").eq(
            "id", submission_id
        ).eq("organization_id", org_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get submission: {str(e)}"
        )


@router.put("/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update submission status and add review notes
    
    Body:
    - status: pending, reviewing, approved, rejected, completed
    - notes: Optional review notes
    """
    try:
        user_id = current_user.get("id")
        org_id = current_user.get("organization_id")
        new_status = status_data.get("status")
        
        # Validate status
        valid_statuses = ["pending", "reviewing", "approved", "rejected", "completed"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Update submission
        update_data = {
            "status": new_status,
            "reviewed_at": datetime.utcnow().isoformat(),
            "reviewed_by_user_id": user_id
        }
        
        if status_data.get("notes"):
            update_data["notes"] = status_data["notes"]
        
        response = db_service.client.table("form_submissions").update(
            update_data
        ).eq("id", submission_id).eq("organization_id", org_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update submission status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update submission status: {str(e)}"
        )


@router.delete("/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Delete a submission
    """
    try:
        org_id = current_user.get("organization_id")
        
        response = db_service.client.table("form_submissions").delete().eq(
            "id", submission_id
        ).eq("organization_id", org_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        return {"message": "Submission deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete submission: {str(e)}"
        )


@router.get("/export/csv")
async def export_submissions_csv(
    form_id: str,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> Response:
    """
    Export form submissions as CSV
    
    Query params:
    - form_id: Required - form to export
    - status_filter: Optional - filter by status
    """
    try:
        org_id = current_user.get("organization_id")
        
        # Fetch submissions
        query = db_service.client.table("form_submissions").select(
            "*"
        ).eq("organization_id", org_id).eq("form_id", form_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("submitted_at", desc=True).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No submissions found"
            )
        
        # Get form structure to extract field names
        form_response = db_service.client.table("forms").select(
            "form_data"
        ).eq("id", form_id).execute()
        
        if not form_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Form not found"
            )
        
        form_fields = form_response.data[0].get("form_data", {}).get("fields", [])
        field_names = [field.get("name") for field in form_fields]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = ["Submission ID", "Status", "Submitted At", "Employee ID", "Company ID"] + field_names
        writer.writerow(header)
        
        # Write data rows
        for submission in response.data:
            submission_data = submission.get("submission_data", {})
            row = [
                submission.get("id"),
                submission.get("status"),
                submission.get("submitted_at"),
                submission.get("employee_id", ""),
                submission.get("company_id", "")
            ]
            
            # Add field values
            for field_name in field_names:
                row.append(submission_data.get(field_name, ""))
            
            writer.writerow(row)
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Return as downloadable file
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=form_submissions_{form_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export CSV: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export CSV: {str(e)}"
        )
