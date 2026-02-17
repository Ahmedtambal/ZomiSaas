"""
Change Information Routes - CRUD operations for change of information requests
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import io
import csv

from app.services.database_service import db_service
from app.services.audit_service import audit_service
from app.services.encryption_service import get_encryption_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", status_code=status.HTTP_200_OK)
async def get_change_information(current_user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Get all change of information requests for the user's organization
    Includes company name from companies table
    Decrypts sensitive fields (new_name, new_address, new_salary, new_employee_contribution)
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Join with companies table to get company name
        response = db_service.client.table("change_information").select(
            "*, companies(name)"
        ).eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        # Get encryption service for decrypting sensitive fields
        encryption = get_encryption_service()
        
        # Extract company name from nested object and decrypt sensitive fields
        change_requests = []
        for item in response.data:
            if item.get("companies"):
                item["company_name"] = item["companies"].get("name")
                # Remove nested companies object to keep response clean
                del item["companies"]
            
            # Decrypt encrypted fields if they exist
            if item.get("new_name"):
                try:
                    item["new_name"] = encryption.decrypt(item["new_name"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt new_name: {str(e)}")
            
            if item.get("new_address"):
                try:
                    item["new_address"] = encryption.decrypt(item["new_address"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt new_address: {str(e)}")
            
            if item.get("new_salary"):
                try:
                    item["new_salary"] = encryption.decrypt(item["new_salary"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt new_salary: {str(e)}")
            
            if item.get("new_employee_contribution"):
                try:
                    item["new_employee_contribution"] = encryption.decrypt(item["new_employee_contribution"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt new_employee_contribution: {str(e)}")
            
            if item.get("new_employer_contribution"):
                try:
                    item["new_employer_contribution"] = encryption.decrypt(item["new_employer_contribution"])
                except Exception as e:
                    logger.warning(f"Failed to decrypt new_employer_contribution: {str(e)}")
            
            change_requests.append(item)
        
        return change_requests
        
    except Exception as e:
        logger.error(f"Failed to fetch change information: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch change information: {str(e)}"
        )


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_change_information_stats(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get statistics for change of information requests
    Returns count grouped by change_type and processing_status
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Get all change requests for organization
        response = db_service.client.table("change_information").select(
            "id, change_type, processing_status"
        ).eq(
            "organization_id", organization_id
        ).execute()
        
        # Calculate stats
        total_count = len(response.data)
        
        # Count by change_type
        change_types = {}
        for item in response.data:
            change_type = item.get("change_type", "Unknown")
            change_types[change_type] = change_types.get(change_type, 0) + 1
        
        # Count by processing_status
        statuses = {}
        for item in response.data:
            status_val = item.get("processing_status", "pending")
            statuses[status_val] = statuses.get(status_val, 0) + 1
        
        return {
            "total_count": total_count,
            "by_change_type": change_types,
            "by_status": statuses
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch change information stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )


@router.get("/{change_id}", status_code=status.HTTP_200_OK)
async def get_change_information_by_id(
    change_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a specific change of information request by ID
    Verifies it belongs to user's organization
    """
    try:
        organization_id = current_user["organization_id"]
        
        response = db_service.client.table("change_information").select(
            "*, companies(name)"
        ).eq(
            "id", change_id
        ).eq(
            "organization_id", organization_id
        ).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Change information request not found"
            )
        
        # Get encryption service for decrypting sensitive fields
        encryption = get_encryption_service()
        
        # Extract company name
        change_request = response.data
        if change_request.get("companies"):
            change_request["company_name"] = change_request["companies"].get("name")
            del change_request["companies"]
        
        # Decrypt encrypted fields if they exist
        if change_request.get("new_name"):
            try:
                change_request["new_name"] = encryption.decrypt(change_request["new_name"])
            except Exception as e:
                logger.warning(f"Failed to decrypt new_name: {str(e)}")
        
        if change_request.get("new_address"):
            try:
                change_request["new_address"] = encryption.decrypt(change_request["new_address"])
            except Exception as e:
                logger.warning(f"Failed to decrypt new_address: {str(e)}")
        
        if change_request.get("new_salary"):
            try:
                change_request["new_salary"] = encryption.decrypt(change_request["new_salary"])
            except Exception as e:
                logger.warning(f"Failed to decrypt new_salary: {str(e)}")
        
        if change_request.get("new_employee_contribution"):
            try:
                change_request["new_employee_contribution"] = encryption.decrypt(change_request["new_employee_contribution"])
            except Exception as e:
                logger.warning(f"Failed to decrypt new_employee_contribution: {str(e)}")
        
        if change_request.get("new_employer_contribution"):
            try:
                change_request["new_employer_contribution"] = encryption.decrypt(change_request["new_employer_contribution"])
            except Exception as e:
                logger.warning(f"Failed to decrypt new_employer_contribution: {str(e)}")
        
        return change_request
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch change information {change_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch change information: {str(e)}"
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_change_information(
    change_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new change of information request
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        # Prepare data
        insert_data = {
            **change_data,
            "organization_id": organization_id,
            "created_by_user_id": user_id,
            "processing_status": change_data.get("processing_status", "pending"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Remove any fields that shouldn't be set on create
        insert_data.pop("id", None)
        insert_data.pop("company_name", None)
        
        # Insert into database
        response = db_service.client.table("change_information").insert(
            insert_data
        ).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create change information request"
            )
        
        # Log audit trail
        try:
            await audit_service.log_activity(
                user_id=user_id,
                organization_id=organization_id,
                action="create",
                resource_type="change_information",
                resource_id=response.data[0]["id"],
                details={
                    "change_type": change_data.get("change_type"),
                    "company_id": change_data.get("company_id")
                }
            )
        except Exception as audit_error:
            logger.warning(f"Failed to log audit: {audit_error}")
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create change information: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create change information: {str(e)}"
        )


@router.put("/{change_id}", status_code=status.HTTP_200_OK)
async def update_change_information(
    change_id: str,
    change_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update an existing change of information request
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        # Verify ownership
        existing = db_service.client.table("change_information").select(
            "id"
        ).eq(
            "id", change_id
        ).eq(
            "organization_id", organization_id
        ).single().execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Change information request not found"
            )
        
        # Prepare update data
        update_data = {
            **change_data,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Remove fields that shouldn't be updated
        update_data.pop("id", None)
        update_data.pop("organization_id", None)
        update_data.pop("created_by_user_id", None)
        update_data.pop("created_at", None)
        update_data.pop("company_name", None)
        
        # Update in database
        response = db_service.client.table("change_information").update(
            update_data
        ).eq(
            "id", change_id
        ).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update change information request"
            )
        
        # Log audit trail
        try:
            await audit_service.log_activity(
                user_id=user_id,
                organization_id=organization_id,
                action="update",
                resource_type="change_information",
                resource_id=change_id,
                details={
                    "updated_fields": list(change_data.keys())
                }
            )
        except Exception as audit_error:
            logger.warning(f"Failed to log audit: {audit_error}")
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update change information {change_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update change information: {str(e)}"
        )


@router.delete("/{change_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_change_information(
    change_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a change of information request
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]
        
        # Verify ownership before deleting
        existing = db_service.client.table("change_information").select(
            "id"
        ).eq(
            "id", change_id
        ).eq(
            "organization_id", organization_id
        ).single().execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Change information request not found"
            )
        
        # Delete from database
        db_service.client.table("change_information").delete().eq(
            "id", change_id
        ).execute()
        
        # Log audit trail
        try:
            await audit_service.log_activity(
                user_id=user_id,
                organization_id=organization_id,
                action="delete",
                resource_type="change_information",
                resource_id=change_id,
                details={}
            )
        except Exception as audit_error:
            logger.warning(f"Failed to log audit: {audit_error}")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete change information {change_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete change information: {str(e)}"
        )


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_change_information(
    data: Dict[str, List[str]],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete multiple change of information requests at once
    """
    try:
        organization_id = current_user["organization_id"]
        user_id = current_user["id"]

        ids = data.get("ids", [])
        
        if not ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No IDs provided for deletion"
            )
        
        # Verify all records belong to user's organization
        existing = db_service.client.table("change_information").select(
            "id"
        ).in_(
            "id", ids
        ).eq(
            "organization_id", organization_id
        ).execute()
        
        verified_ids = [item["id"] for item in existing.data]
        
        if len(verified_ids) != len(ids):
            logger.warning(f"Bulk delete: {len(ids)} requested, {len(verified_ids)} verified")
        
        # Delete verified records
        if verified_ids:
            db_service.client.table("change_information").delete().in_(
                "id", verified_ids
            ).execute()

            # Confirm what remains
            remaining = db_service.client.table("change_information").select(
                "id"
            ).in_(
                "id", verified_ids
            ).eq(
                "organization_id", organization_id
            ).execute()

            remaining_ids = [row["id"] for row in (remaining.data or []) if row.get("id")]
            remaining_set = set(remaining_ids)
            deleted_ids = [cid for cid in verified_ids if cid not in remaining_set]
            not_deleted_ids = [cid for cid in verified_ids if cid in remaining_set]
            
            # Log audit trail
            try:
                await audit_service.log_activity(
                    user_id=user_id,
                    organization_id=organization_id,
                    action="bulk_delete",
                    resource_type="change_information",
                    resource_id=None,
                    details={
                        "requested_count": len(ids),
                        "verified_count": len(verified_ids),
                        "deleted_count": len(deleted_ids),
                        "deleted_ids": deleted_ids,
                        "not_deleted_ids": not_deleted_ids,
                        "not_found_count": len(ids) - len(verified_ids),
                    }
                )
            except Exception as audit_error:
                logger.warning(f"Failed to log audit: {audit_error}")

            return {
                "requested_count": len(ids),
                "verified_count": len(verified_ids),
                "deleted_count": len(deleted_ids),
                "not_deleted_ids": not_deleted_ids,
            }
        
        return {
            "requested_count": len(ids),
            "verified_count": 0,
            "deleted_count": 0,
            "not_deleted_ids": [],
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to bulk delete change information: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk delete: {str(e)}"
        )


@router.get("/export/csv", status_code=status.HTTP_200_OK)
async def export_change_information_csv(
    current_user: dict = Depends(get_current_user)
) -> StreamingResponse:
    """
    Export all change of information requests to CSV
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Get all change requests with company names
        response = db_service.client.table("change_information").select(
            "*, companies(name)"
        ).eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        # Prepare CSV data
        output = io.StringIO()
        
        if response.data:
            # Extract company names
            for item in response.data:
                if item.get("companies"):
                    item["company_name"] = item["companies"].get("name")
                    del item["companies"]
            
            # Define CSV columns
            fieldnames = [
                "id", "company_name", "first_name", "surname", "date_of_birth",
                "date_of_effect", "change_type", "other_reason", "processing_status",
                "created_at", "updated_at"
            ]
            
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            for item in response.data:
                writer.writerow(item)
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=change_information_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to export change information CSV: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export CSV: {str(e)}"
        )
