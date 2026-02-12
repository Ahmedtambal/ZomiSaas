import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, PoundSterling, Clock, Upload, Send } from 'lucide-react';
import apiClient from '../../services/apiClient';
import type { DateRange } from './TimePeriodSelector';

interface KPIData {
  value: number;
  trend: number;
  is_positive: boolean;
  nearest_date?: string;
}

interface WorkforceKPIs {
  total_active_employees: KPIData;
  average_pensionable_salary: KPIData;
  total_salary_under_management: KPIData;
  pending_pension_activations: KPIData;
  io_uploads_completed: KPIData;
  pension_packs_sent: KPIData;
}

interface WorkforceDashboardProps {
  dateRange: DateRange;
}

export const WorkforceDashboard = forwardRef<any, WorkforceDashboardProps>(({ dateRange }, ref) => {
  const [kpiData, setKpiData] = useState<WorkforceKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIData();
  }, [dateRange, fetchKPIData]);

  const fetchKPIData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/kpi/workforce', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
        },
      });
      setKpiData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch KPI data:', err);
      setError(err.response?.data?.detail || 'Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const handleRefresh = async () => {
    try {
      // First, trigger snapshot generation to get fresh data
      await apiClient.post('/api/kpi/snapshot/generate');
      // Then fetch the updated KPIs
      await fetchKPIData();
    } catch (err: any) {
      console.error('Failed to refresh KPI data:', err);
      setError(err.response?.data?.detail || 'Failed to refresh KPI data');
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: handleRefresh
  }));

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(1)}K`;
    }
    return `£${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Workforce Metrics</h2>
          <p className="text-sm text-slate-600">Real-time employee and salary analytics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-zomi-mint/50 rounded-xl"></div>
                <div className="h-5 w-16 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-24 bg-slate-200 rounded mb-1"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[1, 2].map((i) => (
            <div key={`second-${i}`} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-zomi-mint/50 rounded-xl"></div>
                <div className="h-5 w-16 bg-slate-200 rounded"></div>
              </div>
              <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-24 bg-slate-200 rounded mb-1"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Workforce Metrics</h2>
          <p className="text-sm text-slate-600">Real-time employee and salary analytics</p>
        </div>
        <div className="glass-panel rounded-2xl p-6 border-red-200">
          <p className="text-red-600 font-medium">Error loading KPI data</p>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
          <button
            onClick={fetchKPIData}
            className="mt-4 px-4 py-2 bg-zomi-green text-white rounded-lg hover:bg-zomi-green/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!kpiData) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Workforce Metrics</h2>
        <p className="text-sm text-slate-600">Real-time employee and salary analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Active Employees */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.total_active_employees.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.total_active_employees.is_positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{kpiData.total_active_employees.is_positive ? '+' : ''}{kpiData.total_active_employees.trend}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">Total Active Employees</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {kpiData.total_active_employees.value.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">Active participants</p>
        </div>

        {/* Average Pensionable Salary */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.average_pensionable_salary.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.average_pensionable_salary.is_positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{kpiData.average_pensionable_salary.is_positive ? '+' : ''}{kpiData.average_pensionable_salary.trend}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">Average Pensionable Salary</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {formatCurrency(kpiData.average_pensionable_salary.value)}
          </p>
          <p className="text-sm text-slate-500">Per employee</p>
        </div>

        {/* Total Salary Under Management */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <PoundSterling className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.total_salary_under_management.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.total_salary_under_management.is_positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{kpiData.total_salary_under_management.is_positive ? '+' : ''}{kpiData.total_salary_under_management.trend}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">Total Salary Under Management</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {formatCurrency(kpiData.total_salary_under_management.value)}
          </p>
          <p className="text-sm text-slate-500">Assets under management</p>
        </div>

        {/* Pending Pension Activations */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.pending_pension_activations.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.pending_pension_activations.is_positive ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>{Math.abs(kpiData.pending_pension_activations.trend)}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">Pending Pension Activations</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {kpiData.pending_pension_activations.value}
          </p>
          <p className="text-sm text-slate-500">
            Next: {formatDate(kpiData.pending_pension_activations.nearest_date)}
          </p>
        </div>
      </div>

      {/* Second Row - Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* IO Uploads Completed */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.io_uploads_completed.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.io_uploads_completed.is_positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{kpiData.io_uploads_completed.is_positive ? '+' : ''}{kpiData.io_uploads_completed.trend}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">IO Uploads Completed</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {kpiData.io_uploads_completed.value}
          </p>
          <p className="text-sm text-slate-500">Upload status complete</p>
        </div>

        {/* Pension Packs Sent */}
        <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-zomi-green" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              kpiData.pension_packs_sent.is_positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {kpiData.pension_packs_sent.is_positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{kpiData.pension_packs_sent.is_positive ? '+' : ''}{kpiData.pension_packs_sent.trend}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-2">Pension Packs Sent</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {kpiData.pension_packs_sent.value}
          </p>
          <p className="text-sm text-slate-500">Sent to members</p>
        </div>
      </div>
    </div>
  );
});
