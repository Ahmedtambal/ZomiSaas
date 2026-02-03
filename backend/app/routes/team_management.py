"""
Team Management Routes - Manage organization members and invite codes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets
import string
import logging

from app.services.database_service import db_service
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


class InviteCodeCreate(BaseModel):
    role: str  # 'admin' or 'user'
    expires_in_days: int = 7


class MemberRoleUpdate(BaseModel):
    new_role: str  # 'owner', 'admin', or 'user'


def generate_invite_code() -> str:
    """Generate a random 8-character invite code"""
    # Use uppercase letters and digits for clarity
    characters = string.ascii_uppercase + string.digits
    # Exclude confusing characters (0, O, I, 1)
    characters = characters.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
    return ''.join(secrets.choice(characters) for _ in range(8))


@router.post("/invite-codes", status_code=status.HTTP_201_CREATED)
async def create_invite_code(
    invite_data: InviteCodeCreate,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new invite code (admin or owner only)
    """
    try:
        organization_id = current_user["organization_id"]
        user_role = current_user["role"]
        user_id = current_user["id"]
        
        # Check if user is admin or owner
        if user_role not in ['admin', 'owner']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and owners can create invite codes"
            )
        
        # Validate role
        if invite_data.role not in ['admin', 'user']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'admin' or 'user'"
            )
        
        # Generate unique code
        max_attempts = 10
        code = None
        for _ in range(max_attempts):
            potential_code = generate_invite_code()
            existing = await db_service.get_invite_code(potential_code)
            if not existing:
                code = potential_code
                break
        
        if not code:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate unique invite code"
            )
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(days=invite_data.expires_in_days)
        
        # Create invite code
        invite_code_data = {
            "code": code,
            "organization_id": organization_id,
            "role": invite_data.role,
            "created_by": user_id,
            "expires_at": expires_at.isoformat(),
            "is_used": False
        }
        
        response = db_service.client.table("invite_codes").insert(invite_code_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create invite code"
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create invite code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invite code: {str(e)}"
        )


@router.get("/invite-codes", status_code=status.HTTP_200_OK)
async def list_invite_codes(
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all invite codes for the organization
    """
    try:
        organization_id = current_user["organization_id"]
        user_role = current_user["role"]
        
        # Check if user is admin or owner
        if user_role not in ['admin', 'owner']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and owners can view invite codes"
            )
        
        response = db_service.client.table("invite_codes").select("*").eq(
            "organization_id", organization_id
        ).order("created_at", desc=True).execute()
        
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list invite codes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list invite codes"
        )


@router.get("/members", status_code=status.HTTP_200_OK)
async def list_members(
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all members of the organization with their emails
    """
    try:
        organization_id = current_user["organization_id"]
        
        # Use the database function via RPC to get members with emails
        # This avoids needing Admin API access
        response = db_service.client.rpc(
            'get_user_emails_for_organization',
            {'org_id': organization_id}
        ).execute()
        
        return response.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list members: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list members"
        )


@router.put("/members/{member_id}/role", status_code=status.HTTP_200_OK)
async def update_member_role(
    member_id: str,
    role_update: MemberRoleUpdate,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update a member's role
    Rules:
    - Owner & Admin can update roles
    - Admin cannot upgrade another user to Owner
    - Only Owner can upgrade Admin to Owner
    - Only one Owner can exist at a time
    """
    try:
        organization_id = current_user["organization_id"]
        current_user_role = current_user["role"]
        current_user_id = current_user["id"]
        
        # Check permissions
        if current_user_role not in ['admin', 'owner']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and owners can update member roles"
            )
        
        # Validate new role
        if role_update.new_role not in ['owner', 'admin', 'user']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'owner', 'admin', or 'user'"
            )
        
        # Cannot update your own role
        if member_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update your own role"
            )
        
        # Get target member
        target_member_response = db_service.client.table("user_profiles").select("*").eq(
            "id", member_id
        ).eq("organization_id", organization_id).execute()
        
        if not target_member_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        target_member = target_member_response.data[0]
        target_current_role = target_member["role"]
        
        # Rule: Admin cannot upgrade to Owner
        if current_user_role == 'admin' and role_update.new_role == 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner can promote members to owner"
            )
        
        # Rule: If promoting to Owner, demote current owner first
        if role_update.new_role == 'owner':
            # Find current owner
            current_owner_response = db_service.client.table("user_profiles").select("*").eq(
                "organization_id", organization_id
            ).eq("role", "owner").execute()
            
            if current_owner_response.data:
                current_owner = current_owner_response.data[0]
                
                # Demote current owner to admin
                db_service.client.table("user_profiles").update({
                    "role": "admin"
                }).eq("id", current_owner["id"]).execute()
        
        # Update target member's role
        update_response = db_service.client.table("user_profiles").update({
            "role": role_update.new_role
        }).eq("id", member_id).execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update member role"
            )
        
        return update_response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update member role: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update member role"
        )


@router.delete("/members/{member_id}", status_code=status.HTTP_200_OK)
async def delete_member(
    member_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete a member from the organization
    Rules:
    - Admin cannot delete another Admin
    - Only Owner can delete Admin
    - Cannot delete yourself
    - Cannot delete the Owner
    """
    try:
        organization_id = current_user["organization_id"]
        current_user_role = current_user["role"]
        current_user_id = current_user["id"]
        
        # Check permissions
        if current_user_role not in ['admin', 'owner']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and owners can delete members"
            )
        
        # Cannot delete yourself
        if member_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Get target member
        target_member_response = db_service.client.table("user_profiles").select("*").eq(
            "id", member_id
        ).eq("organization_id", organization_id).execute()
        
        if not target_member_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        target_member = target_member_response.data[0]
        target_role = target_member["role"]
        
        # Cannot delete Owner
        if target_role == 'owner':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete the organization owner"
            )
        
        # Admin cannot delete another Admin
        if current_user_role == 'admin' and target_role == 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admins cannot delete other admins. Only the owner can delete admins."
            )
        
        # Delete the user profile
        db_service.client.table("user_profiles").delete().eq("id", member_id).execute()
        
        # Also delete the auth.users entry (cascade should handle this, but we'll try)
        try:
            db_service.client.auth.admin.delete_user(member_id)
        except Exception as e:
            logger.warning(f"Failed to delete auth user: {str(e)}")
            # Continue anyway, cascade should handle it
        
        return {
            "message": "Member deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete member: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete member"
        )
