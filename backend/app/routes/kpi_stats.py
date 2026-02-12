"""  
KPI Statistics API endpoints for Executive Dashboard
Uses historical snapshots for accurate trend tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta, date
from typing import Dict, Any, Optional
import logging

from app.services.database_service import db_service
from app.services.encryption_service import get_encryption_service
from app.services.kpi_snapshot_service import kpi_snapshot_service
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/workforce")
async def get_workforce_kpis(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get workforce KPI statistics with trend indicators based on historical snapshots
    - Total Active Employees
    - Average Pensionable Salary
    - Total Pensionable Salary Under Management
    - Pending Pension Activations
    
    Trends are calculated by comparing end date with equivalent prior period
    If no dates provided, defaults to comparing today vs 7 days ago
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        # Parse dates or use defaults
        if end_date:
            target_end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            target_end_date = date.today()
        
        if start_date:
            target_start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            target_start_date = target_end_date - timedelta(days=7)
        
        # Calculate comparison period (same duration, prior)
        period_days = (target_end_date - target_start_date).days
        comparison_end_date = target_start_date - timedelta(days=1)
        comparison_start_date = comparison_end_date - timedelta(days=period_days)
        
        # Get or create snapshot for end date
        today_snapshot = kpi_snapshot_service.get_snapshot(org_id, target_end_date)
        if not today_snapshot:
            logger.info(f"No snapshot for {target_end_date}, calculating now for org {org_id}")
            today_snapshot = await kpi_snapshot_service.calculate_and_store_snapshot(org_id, target_end_date)
        
        # Get snapshot from comparison period (or closest available)
        comparison_snapshot = kpi_snapshot_service.get_snapshot(org_id, comparison_end_date)
        
        # If no comparison snapshot, look for the most recent one in the comparison range
        if not comparison_snapshot:
            snapshots = kpi_snapshot_service.get_snapshots_range(org_id, comparison_start_date, comparison_end_date)
            comparison_snapshot = snapshots[-1] if snapshots else None
        
        # Calculate trends
        if comparison_snapshot:
            active_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["total_active_employees"],
                comparison_snapshot["total_active_employees"]
            )
            avg_salary_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["average_pensionable_salary"],
                comparison_snapshot["average_pensionable_salary"]
            )
            total_salary_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["total_salary_under_management"],
                comparison_snapshot["total_salary_under_management"]
            )
            pending_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["pending_pension_activations"],
                comparison_snapshot["pending_pension_activations"]
            )
            # For pending items, decrease is positive
            pending_trend["is_positive"] = pending_trend["value"] <= 0
            
            # Calculate trends for IO uploads and pension packs
            io_uploads_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["io_uploads_completed"],
                comparison_snapshot["io_uploads_completed"]
            )
            pension_packs_trend = kpi_snapshot_service.calculate_trend(
                today_snapshot["pension_packs_sent"],
                comparison_snapshot["pension_packs_sent"]
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
            .gt("pension_start_date", target_end_date.isoformat())\
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
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get time series data for charts:
    - New Hires (Weekly): Hiring data for the specified period
    - Employee Growth Rate (Monthly): Growth percentage for the period
    
    If no dates provided, defaults to last 16 weeks and 12 months
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        # Parse dates or use defaults
        if end_date:
            target_end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            target_end_date = date.today()
        
        if start_date:
            target_start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            # Default to 16 weeks back
            target_start_date = target_end_date - timedelta(weeks=16)
        
        # Calculate number of weeks in the period
        period_days = (target_end_date - target_start_date).days
        num_weeks = max(1, period_days // 7)
        
        # Calculate new hires per week for the period
        weeks_data = []
        for i in range(num_weeks - 1, -1, -1):
            week_end = target_end_date - timedelta(weeks=i)
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
        
        # Calculate number of months in the period
        num_months = max(1, period_days // 30)
        
        # Calculate monthly growth rate for the period
        months_data = []
        for i in range(num_months - 1, -1, -1):
            current_month = target_end_date - timedelta(days=30*i)
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


@router.get("/analytics")
async def get_analytics_data(
    date: Optional[str] = Query(None, description="Target date in YYYY-MM-DD format (defaults to today)"),
    current_user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get comprehensive analytics data for dashboard charts:
    - Employees by Company
    - Nationality Breakdown
    - Age Distribution
    - Pension Investment Approach
    - Coverage Rates (Pension, Group Life, GCI, GIP, BUPA)
    - Gender Distribution
    - UK Resident vs Non-Resident
    - IO Upload Status
    - Geographic Distribution
    
    Note: Currently returns live data. Historical snapshot support coming soon.
    """
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found"
            )
        
        # Fetch all active employees with company name
        response = db_service.client.table("employees")\
            .select("*, companies(name)")\
            .eq("organization_id", org_id)\
            .eq("service_status", "Active")\
            .execute()
        
        employees = response.data
        total = len(employees)
        
        # 1. Employees by Company (top 15)
        company_counts = {}
        for emp in employees:
            company_name = emp.get("companies", {}).get("name", "Unknown") if emp.get("companies") else "Unknown"
            company_counts[company_name] = company_counts.get(company_name, 0) + 1
        
        employees_by_company = [
            {"name": name, "count": count}
            for name, count in sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        ]
        
        # 2. Nationality Breakdown (top 10)
        nationality_counts = {}
        for emp in employees:
            nationality = emp.get("nationality", "Unknown") or "Unknown"
            nationality_counts[nationality] = nationality_counts.get(nationality, 0) + 1
        
        nationality_breakdown = [
            {"name": name, "count": count}
            for name, count in sorted(nationality_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # 3. Age Distribution (calculate from date_of_birth)
        from datetime import date, datetime
        encryption = get_encryption_service()
        age_brackets = {"18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56-65": 0, "65+": 0}
        for emp in employees:
            dob = emp.get("date_of_birth")
            if dob:
                try:
                    decrypted_dob = encryption.decrypt(dob) if isinstance(dob, str) else dob
                    if isinstance(decrypted_dob, datetime):
                        birth_date = decrypted_dob.date()
                    elif isinstance(decrypted_dob, date):
                        birth_date = decrypted_dob
                    elif isinstance(decrypted_dob, str):
                        birth_date = date.fromisoformat(decrypted_dob)
                    else:
                        continue
                    age = (date.today() - birth_date).days // 365
                    if age <= 25:
                        age_brackets["18-25"] += 1
                    elif age <= 35:
                        age_brackets["26-35"] += 1
                    elif age <= 45:
                        age_brackets["36-45"] += 1
                    elif age <= 55:
                        age_brackets["46-55"] += 1
                    elif age <= 65:
                        age_brackets["56-65"] += 1
                    else:
                        age_brackets["65+"] += 1
                except:
                    pass
        
        age_distribution = [{"bracket": k, "count": v} for k, v in age_brackets.items()]
        
        # 4. Pension Investment Approach
        approach_counts = {}
        for emp in employees:
            approach = emp.get("pension_investment_approach", "Not Set") or "Not Set"
            approach_counts[approach] = approach_counts.get(approach, 0) + 1
        
        pension_approaches = [
            {"name": name, "count": count}
            for name, count in sorted(approach_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # 5. Coverage Rates
        pension_active = sum(1 for emp in employees if emp.get("is_pension_active"))
        group_life = sum(1 for emp in employees if emp.get("has_group_life"))
        gci = sum(1 for emp in employees if emp.get("has_gci"))
        gip = sum(1 for emp in employees if emp.get("has_gip"))
        bupa = sum(1 for emp in employees if emp.get("has_bupa"))
        
        coverage_rates = {
            "pension": {"active": pension_active, "inactive": total - pension_active, "rate": round((pension_active / total) * 100, 1) if total > 0 else 0},
            "group_life": {"has": group_life, "no": total - group_life, "rate": round((group_life / total) * 100, 1) if total > 0 else 0},
            "gci": {"has": gci, "no": total - gci, "rate": round((gci / total) * 100, 1) if total > 0 else 0},
            "gip": {"has": gip, "no": total - gip, "rate": round((gip / total) * 100, 1) if total > 0 else 0},
            "bupa": {"has": bupa, "no": total - bupa, "rate": round((bupa / total) * 100, 1) if total > 0 else 0}
        }
        
        # 6. Gender Distribution
        gender_counts = {}
        for emp in employees:
            gender = emp.get("gender", "Not Specified") or "Not Specified"
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
        
        gender_distribution = [{"name": name, "count": count} for name, count in gender_counts.items()]
        
        # 7. UK Resident vs Non-Resident
        uk_residents = sum(1 for emp in employees if emp.get("uk_resident") is True)
        non_uk_residents = total - uk_residents
        
        residency = {
            "uk_resident": uk_residents,
            "non_uk_resident": non_uk_residents
        }
        
        # 8. IO Upload Status
        io_completed = sum(1 for emp in employees if emp.get("io_upload_status") is True)
        io_pending = total - io_completed
        
        io_status = {
            "completed": io_completed,
            "pending": io_pending
        }
        
        # 9. Geographic Distribution (postcode areas)
        postcode_counts = {}
        for emp in employees:
            postcode = emp.get("postcode", "")
            if postcode:
                # Extract postcode area (first 1-2 letters)
                area = ''.join(filter(str.isalpha, postcode.split()[0][:2])).upper() if postcode else "Unknown"
                if area:
                    postcode_counts[area] = postcode_counts.get(area, 0) + 1
        
        geographic_distribution = [
            {"area": area, "count": count}
            for area, count in sorted(postcode_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return {
            "employees_by_company": employees_by_company,
            "nationality_breakdown": nationality_breakdown,
            "age_distribution": age_distribution,
            "pension_approaches": pension_approaches,
            "coverage_rates": coverage_rates,
            "gender_distribution": gender_distribution,
            "residency": residency,
            "io_status": io_status,
            "geographic_distribution": geographic_distribution,
            "total_employees": total
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch analytics data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics data: {str(e)}"
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
