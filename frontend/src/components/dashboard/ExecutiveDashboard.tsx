import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { WorkforceDashboard } from './WorkforceDashboard';
import { TimeSeriesCharts } from './TimeSeriesCharts';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export const ExecutiveDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const workforceRef = useRef<any>(null);
  const timeSeriesRef = useRef<any>(null);
  const analyticsRef = useRef<any>(null);

  const handleUnifiedRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger refresh on all child components
      await Promise.all([
        workforceRef.current?.refresh(),
        timeSeriesRef.current?.refresh(),
        analyticsRef.current?.refresh()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Unified Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Dashboard</h1>
          <p className="text-slate-600">Real-time insights for Zomi Wealth Group</p>
        </div>
        <button
          onClick={handleUnifiedRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 bg-zomi-green text-white rounded-lg hover:bg-zomi-green/90 transition-all duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="font-semibold">{refreshing ? 'Refreshing All Data...' : 'Refresh All'}</span>
        </button>
      </div>

      {/* Section 1: Workforce KPIs */}
      <WorkforceDashboard ref={workforceRef} />

      {/* Section 2: Time Series Charts */}
      <TimeSeriesCharts ref={timeSeriesRef} />

      {/* Section 3: Analytics Dashboard */}
      <AnalyticsDashboard ref={analyticsRef} />
    </div>
  );
};
