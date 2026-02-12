"""
Lookup Tables Routes - Public endpoints for reference data
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
import logging

from app.services.database_service import db_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/nationalities")
async def get_nationalities() -> List[str]:
    """
    Get list of all available nationalities
    
    Returns:
        List of nationality strings sorted alphabetically
    """
    try:
        response = db_service.client.table("lookup_nationalities").select("value").order("value").execute()
        
        if not response.data:
            # Return fallback list if table is empty
            logger.warning("lookup_nationalities table is empty, returning fallback list")
            return ['British', 'Irish', 'American', 'Canadian', 'Australian', 'Other']
        
        # Extract values from response
        nationalities = [row["value"] for row in response.data]
        return nationalities
        
    except Exception as e:
        logger.error(f"Failed to fetch nationalities: {str(e)}")
        # Return fallback list on error
        return ['British', 'Irish', 'American', 'Canadian', 'Australian', 'Other']


@router.get("/nationalities/check")
async def check_nationalities_table() -> Dict[str, Any]:
    """
    Check if nationalities lookup table exists and has data
    
    Returns:
        Status information about the lookup table
    """
    try:
        response = db_service.client.table("lookup_nationalities").select("id", count="exact").execute()
        
        return {
            "exists": True,
            "count": response.count if response.count is not None else 0,
            "status": "ok" if response.count and response.count > 0 else "empty"
        }
    except Exception as e:
        logger.error(f"Failed to check nationalities table: {str(e)}")
        return {
            "exists": False,
            "count": 0,
            "status": "error",
            "error": str(e)
        }
