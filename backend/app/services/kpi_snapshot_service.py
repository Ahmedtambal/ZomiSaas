"""
KPI Snapshot Service
Handles daily snapshots of KPI metrics for historical trend tracking
"""
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List
import logging

from app.services.database_service import database_service
from app.services.encryption_service import encryption_service

logger = logging.getLogger(__name__)


class KPISnapshotService:
    """Service for managing KPI snapshots"""
    
    def __init__(self):
        self.db = database_service.get_client()
    
    async def calculate_and_store_snapshot(self, organization_id: str, snapshot_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Calculate current KPI metrics and store as a snapshot
        
        Args:
            organization_id: Organization UUID
            snapshot_date: Date for the snapshot (defaults to today)
            
        Returns:
            Dict with snapshot data
        """
        if snapshot_date is None:
            snapshot_date = date.today()
        
        try:
            logger.info(f"Calculating KPI snapshot for org {organization_id} on {snapshot_date}")
            
            # 1. Total Active Employees
            active_response = self.db.table("employees")\
                .select("id", count="exact")\
                .eq("organization_id", organization_id)\
                .eq("service_status", "Active")\
                .execute()
            
            total_active = active_response.count or 0
            
            # 2. Calculate salaries
            salary_response = self.db.table("employees")\
                .select("pensionable_salary")\
                .eq("organization_id", organization_id)\
                .eq("service_status", "Active")\
                .not_.is_("pensionable_salary", "null")\
                .execute()
            
            salaries = []
            for emp in salary_response.data:
                try:
                    salary_str = emp.get("pensionable_salary", "0")
                    # Decrypt if encrypted
                    if salary_str and isinstance(salary_str, str) and salary_str.startswith("Z0FBQUFB"):
                        decrypted_salary = encryption_service.decrypt(salary_str)
                        salaries.append(float(decrypted_salary))
                    elif isinstance(salary_str, (int, float)):
                        salaries.append(float(salary_str))
                    elif isinstance(salary_str, str) and salary_str.replace(".", "").replace("-", "").isdigit():
                        salaries.append(float(salary_str))
                except (ValueError, TypeError) as e:
                    logger.debug(f"Failed to decrypt/parse salary: {e}")
                    continue
            
            avg_salary = sum(salaries) / len(salaries) if salaries else 0
            total_salary = sum(salaries)
            
            # 3. Pending Pension Activations
            pending_response = self.db.table("employees")\
                .select("id", count="exact")\
                .eq("organization_id", organization_id)\
                .eq("service_status", "Active")\
                .gt("pension_start_date", snapshot_date.isoformat())\
                .execute()
            
            pending_count = pending_response.count or 0
            
            # 4. Coverage rates
            coverage_response = self.db.table("employees")\
                .select("is_pension_active, has_group_life, has_gci, has_gip, has_bupa")\
                .eq("organization_id", organization_id)\
                .eq("service_status", "Active")\
                .execute()
            
            pension_active_count = sum(1 for emp in coverage_response.data if emp.get("is_pension_active"))
            group_life_count = sum(1 for emp in coverage_response.data if emp.get("has_group_life"))
            gci_count = sum(1 for emp in coverage_response.data if emp.get("has_gci"))
            gip_count = sum(1 for emp in coverage_response.data if emp.get("has_gip"))
            bupa_count = sum(1 for emp in coverage_response.data if emp.get("has_bupa"))
            
            total_employees = len(coverage_response.data) or 1  # Avoid division by zero
            
            pension_rate = (pension_active_count / total_employees) * 100
            group_life_rate = (group_life_count / total_employees) * 100
            gci_rate = (gci_count / total_employees) * 100
            gip_rate = (gip_count / total_employees) * 100
            bupa_rate = (bupa_count / total_employees) * 100
            
            # 5. Demographics
            demo_response = self.db.table("employees")\
                .select("gender, uk_resident")\
                .eq("organization_id", organization_id)\
                .eq("service_status", "Active")\
                .execute()
            
            gender_male = sum(1 for emp in demo_response.data if emp.get("gender") == "Male")
            gender_female = sum(1 for emp in demo_response.data if emp.get("gender") == "Female")
            gender_other = sum(1 for emp in demo_response.data if emp.get("gender") not in ["Male", "Female"])
            uk_resident = sum(1 for emp in demo_response.data if emp.get("uk_resident") is True)
            non_uk_resident = sum(1 for emp in demo_response.data if emp.get("uk_resident") is False)
            
            # Prepare snapshot data
            snapshot_data = {
                "organization_id": organization_id,
                "snapshot_date": snapshot_date.isoformat(),
                "total_active_employees": total_active,
                "average_pensionable_salary": round(avg_salary, 2),
                "total_salary_under_management": round(total_salary, 2),
                "pending_pension_activations": pending_count,
                "pension_participation_rate": round(pension_rate, 2),
                "group_life_coverage_rate": round(group_life_rate, 2),
                "gci_coverage_rate": round(gci_rate, 2),
                "gip_coverage_rate": round(gip_rate, 2),
                "bupa_coverage_rate": round(bupa_rate, 2),
                "gender_male_count": gender_male,
                "gender_female_count": gender_female,
                "gender_other_count": gender_other,
                "uk_resident_count": uk_resident,
                "non_uk_resident_count": non_uk_resident
            }
            
            # Store snapshot (upsert to handle re-runs)
            response = self.db.table("kpi_snapshots")\
                .upsert(snapshot_data, on_conflict="organization_id,snapshot_date")\
                .execute()
            
            logger.info(f"KPI snapshot stored successfully for org {organization_id}")
            return snapshot_data
            
        except Exception as e:
            logger.error(f"Failed to calculate/store KPI snapshot: {str(e)}")
            raise
    
    def get_snapshot(self, organization_id: str, snapshot_date: date) -> Optional[Dict[str, Any]]:
        """Get a specific snapshot by date"""
        try:
            response = self.db.table("kpi_snapshots")\
                .select("*")\
                .eq("organization_id", organization_id)\
                .eq("snapshot_date", snapshot_date.isoformat())\
                .execute()
            
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Failed to get snapshot: {str(e)}")
            return None
    
    def get_snapshots_range(self, organization_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get snapshots within a date range"""
        try:
            response = self.db.table("kpi_snapshots")\
                .select("*")\
                .eq("organization_id", organization_id)\
                .gte("snapshot_date", start_date.isoformat())\
                .lte("snapshot_date", end_date.isoformat())\
                .order("snapshot_date", desc=True)\
                .execute()
            
            return response.data or []
        except Exception as e:
            logger.error(f"Failed to get snapshots range: {str(e)}")
            return []
    
    def get_latest_snapshot(self, organization_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent snapshot"""
        try:
            response = self.db.table("kpi_snapshots")\
                .select("*")\
                .eq("organization_id", organization_id)\
                .order("snapshot_date", desc=True)\
                .limit(1)\
                .execute()
            
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Failed to get latest snapshot: {str(e)}")
            return None
    
    def calculate_trend(self, current_value: float, previous_value: float) -> Dict[str, Any]:
        """Calculate trend percentage and direction"""
        if previous_value == 0:
            trend_percent = 100.0 if current_value > 0 else 0.0
        else:
            trend_percent = ((current_value - previous_value) / previous_value) * 100
        
        return {
            "value": round(trend_percent, 1),
            "is_positive": trend_percent >= 0
        }


# Singleton instance
kpi_snapshot_service = KPISnapshotService()
