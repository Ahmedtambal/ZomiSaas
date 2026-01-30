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
            
            # Calculate trends for IO uploads and pension packs
            io_uploads_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["io_uploads_completed"],
                week_ago_snapshot["io_uploads_completed"]
            )
            pension_packs_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["pension_packs_sent"],
                week_ago_snapshot["pension_packs_sent"]
            )
        else:
            # No historical data, show 0% trend
            logger.warning(f"No historical snapshot found for org {org_id}, showing 0% trends")
            active_trend = {"value": 0.0, "is_positive": True}
            avg_salary_trend = {"value": 0.0, "is_positive": True}
            total_salary_trend = {"value": 0.0, "is_positive": True}
            pending_trend = {"value": 0.0, "is_positive": True}
            io_uploads_trend = {"value": 0.0, "is_positive": True}
            pension_packs_trend = {"value": 0.0, "is_positive": True}
        
        # Get nearest upcoming pension start date (requires live query)
        pending_response = db_service.client.table("employees")\
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
            },
            "io_uploads_completed": {
                "value": today_snapshot["io_uploads_completed"],
                "trend": io_uploads_trend["value"],
                "is_positive": io_uploads_trend["is_positive"]
            },
            "pension_packs_sent": {
                "value": today_snapshot["pension_packs_sent"],
                "trend": pension_packs_trend["value"],
                "is_positive": pension_packs_trend["is_positive"]
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch workforce KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workforce KPIs: {str(e)}"
        )


@router.get("/time-series")
async def get_time_series_data(
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get time series data for charts:
    - New Hires (Weekly): Last 16 weeks of hiring data
    - Employee Growth Rate (Monthly): Last 12 months of growth percentage
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        today = date.today()
        
        # Calculate new hires per week for last 16 weeks
        weeks_data = []
        for i in range(15, -1, -1):  # 16 weeks back to now
            week_end = today - timedelta(weeks=i)
            week_start = week_end - timedelta(days=6)
            
            # Query employees created in this week
            response = db_service.client.table("employees")\
                .select("id", count="exact")\
                .eq("organization_id", org_id)\
                .gte("created_at", week_start.isoformat())\
                .lte("created_at", week_end.isoformat())\
                .execute()
            
            weeks_data.append({
                "week": week_end.strftime("%b %d"),
                "new_hires": response.count or 0
            })
        
        # Calculate monthly growth rate for last 12 months
        months_data = []
        for i in range(11, -1, -1):  # 12 months back to now
            current_month = today - timedelta(days=30*i)
            previous_month = current_month - timedelta(days=30)
            
            # Get snapshots for these months (or closest available)
            current_snapshots = kpi_snapshot_service.get_snapshots_range(
                org_id, 
                current_month - timedelta(days=5),
                current_month + timedelta(days=5)
            )
            previous_snapshots = kpi_snapshot_service.get_snapshots_range(
                org_id,
                previous_month - timedelta(days=5),
                previous_month + timedelta(days=5)
            )
            
            growth_rate = 0.0
            if current_snapshots and previous_snapshots:
                current_count = current_snapshots[-1]["total_active_employees"]
                previous_count = previous_snapshots[-1]["total_active_employees"]
                
                if previous_count > 0:
                    growth_rate = ((current_count - previous_count) / previous_count) * 100
            
            months_data.append({
                "month": current_month.strftime("%b %Y"),
                "growth_rate": round(growth_rate, 2)
            })
        
        return {
            "new_hires_weekly": weeks_data,
            "growth_rate_monthly": months_data
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch time series data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch time series data: {str(e)}"
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
