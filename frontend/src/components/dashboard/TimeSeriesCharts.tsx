import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface WeeklyHires {
  week: string;
  new_hires: number;
}

interface MonthlyGrowth {
  month: string;
  growth_rate: number;
}

interface TimeSeriesData {
  new_hires_weekly: WeeklyHires[];
  growth_rate_monthly: MonthlyGrowth[];
}

export const TimeSeriesCharts = forwardRef((props, ref) => {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/kpi/time-series');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load time series data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchData
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loading skeletons */}
        <div className="glass-panel rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
        <div className="glass-panel rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zomi-green text-white rounded-lg hover:bg-zomi-green/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxHires = Math.max(...data.new_hires_weekly.map(d => d.new_hires), 1);
  const maxGrowth = Math.max(...data.growth_rate_monthly.map(d => Math.abs(d.growth_rate)), 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workforce Trends</h2>
          <p className="text-slate-600">Historical hiring and growth patterns</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-zomi-green ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-slate-700">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Hires Weekly */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-zomi-green" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Hires</h3>
                <p className="text-sm text-slate-600">Weekly trend (16 weeks)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zomi-green">{data.new_hires_weekly.reduce((sum, d) => sum + d.new_hires, 0)}</p>
              <p className="text-xs text-slate-500">Total hires</p>
            </div>
          </div>

          <div className="h-64">
            <div className="flex items-end justify-between gap-1 h-56">
              {data.new_hires_weekly.map((item, index) => {
                const height = maxHires > 0 ? (item.new_hires / maxHires) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                        style={{ height: `${Math.max(height, item.new_hires > 0 ? 5 : 0)}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <span className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                            {item.new_hires}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-1 mt-2">
              {data.new_hires_weekly.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  {index % 4 === 0 && (
                    <span className="text-[10px] text-slate-500 block transform -rotate-45 origin-center">
                      {item.week}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Rate Monthly */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-zomi-green" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Employee Growth Rate</h3>
                <p className="text-sm text-slate-600">Month-over-month (12 months)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zomi-green">
                {data.growth_rate_monthly.length > 0 ? data.growth_rate_monthly[data.growth_rate_monthly.length - 1].growth_rate.toFixed(1) : '0.0'}%
              </p>
              <p className="text-xs text-slate-500">Current rate</p>
            </div>
          </div>

          <div className="h-64">
            <div className="relative h-56">
              {/* Zero line */}
              <div className="absolute left-0 right-0 top-1/2 border-t-2 border-slate-300 z-0"></div>
              
              <div className="relative flex items-center justify-between gap-1 h-full">
                {data.growth_rate_monthly.map((item, index) => {
                  const isPositive = item.growth_rate >= 0;
                  const absHeight = maxGrowth > 0 ? (Math.abs(item.growth_rate) / maxGrowth) * 45 : 0; // 45% max height
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-center">
                      {/* Positive bar space */}
                      <div className="w-full flex items-end justify-center" style={{ height: '50%' }}>
                        {isPositive && item.growth_rate !== 0 && (
                          <div
                            className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                            style={{ height: `${Math.max(absHeight, 3)}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <span className="bg-slate-900 text-white px-1 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                +{item.growth_rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Negative bar space */}
                      <div className="w-full flex items-start justify-center" style={{ height: '50%' }}>
                        {!isPositive && item.growth_rate !== 0 && (
                          <div
                            className="w-full bg-gradient-to-b from-red-500 to-red-400 rounded-b-md transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                            style={{ height: `${Math.max(absHeight, 3)}%` }}
                          >
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <span className="bg-slate-900 text-white px-1 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                {item.growth_rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Month labels */}
            <div className="flex items-center justify-between gap-1 mt-2">
              {data.growth_rate_monthly.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  {index % 3 === 0 && (
                    <span className="text-[10px] text-slate-500 block transform -rotate-45 origin-center">
                      {item.month.replace(' ', "\n")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
