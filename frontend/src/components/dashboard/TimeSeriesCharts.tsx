import { useState, useEffect } from 'react';
import { TrendingUp, Users, RefreshCw } from 'lucide-react';
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

export const TimeSeriesCharts = () => {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">New Hires</h3>
              <p className="text-sm text-slate-600">Weekly trend (16 weeks)</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-64">
            {data.new_hires_weekly.map((item, index) => {
              const height = (item.new_hires / maxHires) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center" style={{ height: '220px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                      style={{ height: `${height}%`, minHeight: item.new_hires > 0 ? '8px' : '0' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                          {item.new_hires} {item.new_hires === 1 ? 'hire' : 'hires'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index % 2 === 0 && (
                    <span className="text-xs font-medium text-slate-600 -rotate-45 mt-2">
                      {item.week}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth Rate Monthly */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Employee Growth Rate</h3>
              <p className="text-sm text-slate-600">Month-over-month (12 months)</p>
            </div>
          </div>

          <div className="relative h-64">
            {/* Zero line */}
            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-slate-300 z-0"></div>
            
            <div className="relative flex items-center justify-between gap-2 h-full">
              {data.growth_rate_monthly.map((item, index) => {
                const isPositive = item.growth_rate >= 0;
                const height = Math.abs((item.growth_rate / maxGrowth) * 50); // 50% of container
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center h-full justify-center gap-2">
                    <div className="relative w-full flex items-center justify-center" style={{ height: '50%' }}>
                      {isPositive ? (
                        <div
                          className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group self-end"
                          style={{ height: `${height}%`, minHeight: item.growth_rate !== 0 ? '4px' : '0' }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                              +{item.growth_rate}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full" style={{ height: '0' }}></div>
                      )}
                    </div>
                    
                    <div className="relative w-full flex items-center justify-center" style={{ height: '50%' }}>
                      {!isPositive ? (
                        <div
                          className="w-full bg-gradient-to-b from-red-500 to-red-400 rounded-b-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group self-start"
                          style={{ height: `${height}%`, minHeight: item.growth_rate !== 0 ? '4px' : '0' }}
                        >
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                              {item.growth_rate}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full" style={{ height: '0' }}></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Month labels */}
            <div className="flex items-center justify-between gap-2 mt-2">
              {data.growth_rate_monthly.map((item, index) => (
                <div key={index} className="flex-1 text-center">
                  {index % 2 === 0 && (
                    <span className="text-xs font-medium text-slate-600 -rotate-45 inline-block">
                      {item.month}
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
};
