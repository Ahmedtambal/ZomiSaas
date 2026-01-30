"""
KPI Statistics API endpoints for Executive Dashboard
Uses historical snapshots for accurate trend tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, date
from typing import Dict, Any, Optional
import logging

from app.services.database_service import db_service
from app.services.kpi_snapshot_service import kpi_snapshot_service
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/workforce")
async def get_workforce_kpis(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get workforce KPI statistics with trend indicators based on historical snapshots
    - Total Active Employees
    - Average Pensionable Salary
    - Total Pensionable Salary Under Management
    - Pending Pension Activations
    
    Trends are calculated by comparing today's snapshot with 7 days ago
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        # Get or create today's snapshot
        today_snapshot = kpi_snapshot_service.get_snapshot(org_id, today)
        if not today_snapshot:
            logger.info(f"No snapshot for today, calculating now for org {org_id}")
            today_snapshot = await kpi_snapshot_service.calculate_and_store_snapshot(org_id, today)
        
        # Get snapshot from 7 days ago (or closest available)
        week_ago_snapshot = kpi_snapshot_service.get_snapshot(org_id, week_ago)
        
        # If no week-ago snapshot, look for the most recent one before today
        if not week_ago_snapshot:
            snapshots = kpi_snapshot_service.get_snapshots_range(org_id, week_ago, today - timedelta(days=1))
            week_ago_snapshot = snapshots[0] if snapshots else None
        
        # Calculate trends
        if week_ago_snapshot:
            active_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["total_active_employees"],
                week_ago_snapshot["total_active_employees"]
            )
            avg_salary_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["average_pensionable_salary"],
                week_ago_snapshot["average_pensionable_salary"]
            )
            total_salary_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["total_salary_under_management"],
                week_ago_snapshot["total_salary_under_management"]
            )
            pending_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["pending_pension_activations"],
                week_ago_snapshot["pending_pension_activations"]
            )
            # For pending items, decrease is positive
            pending_trend["is_positive"] = pending_trend["value"] <= 0
        else:
            # No historical data, show 0% trend
            logger.warning(f"No historical snapshot found for org {org_id}, showing 0% trends")
            active_trend = {"value": 0.0, "is_positive": True}
            avg_salary_trend = {"value": 0.0, "is_positive": True}
            total_salary_trend = {"value": 0.0, "is_positive": True}
            pending_trend = {"value": 0.0, "is_positive": True}
        
        # Get nearest upcoming pension start date (requires live query)
        db_service = database_service.get_client()
        pending_response = db_service.table("employees")\
            .select("pension_start_date")\
            .eq("organization_id", org_id)\
            .eq("service_status", "Active")\
            .gt("pension_start_date", today.isoformat())\
            .order("pension_start_date", desc=False)\
            .limit(1)\
            .execute()
        
        nearest_date = None
        if pending_response.data and pending_response.data[0].get("pension_start_date"):
            nearest_date = pending_response.data[0]["pension_start_date"]
        
        return {
            "total_active_employees": {
                "value": today_snapshot["total_active_employees"],
                "trend": active_trend["value"],
                "is_positive": active_trend["is_positive"]
            },
            "average_pensionable_salary": {
                "value": round(today_snapshot["average_pensionable_salary"], 2),
                "trend": avg_salary_trend["value"],
                "is_positive": avg_salary_trend["is_positive"]
            },
            "total_salary_under_management": {
                "value": round(today_snapshot["total_salary_under_management"], 2),
                "trend": total_salary_trend["value"],
                "is_positive": total_salary_trend["is_positive"]
            },
            "pending_pension_activations": {
                "value": today_snapshot["pending_pension_activations"],
                "trend": pending_trend["value"],
                "is_positive": pending_trend["is_positive"],
                "nearest_date": nearest_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch workforce KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workforce KPIs: {str(e)}"
        )


@router.post("/snapshot/generate")
async def generate_snapshot(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually trigger snapshot generation for today (admin/cron use)
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        today = date.today()
        snapshot = await kpi_snapshot_service.calculate_and_store_snapshot(org_id, today)
        
        return {
            "success": True,
            "message": f"Snapshot generated for {today}",
            "data": snapshot
        }
        
    except Exception as e:
        logger.error(f"Failed to generate snapshot: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate snapshot: {str(e)}"
        )
