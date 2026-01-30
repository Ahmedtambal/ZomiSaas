import { TrendingDown } from 'lucide-react';
import { WorkforceDashboard } from './WorkforceDashboard';
import { TimeSeriesCharts } from './TimeSeriesCharts';

export const ExecutiveDashboard = () => {
  const retirementPipeline = [
    { year: '2024', count: 8 },
    { year: '2025', count: 15 },
    { year: '2026', count: 22 },
    { year: '2027', count: 18 },
    { year: '2028', count: 25 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Dashboard</h1>
        <p className="text-slate-600">Real-time insights for Zomi Wealth Group</p>
      </div>

      {/* Section 1: Workforce KPIs */}
      <WorkforceDashboard />

      {/* Section 2: Time Series Charts */}
      <TimeSeriesCharts />

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="w-6 h-6 text-zomi-green" />
          <h2 className="text-xl font-bold text-slate-900">Retirement Pipeline</h2>
        </div>
        <div className="flex items-end justify-between gap-4 h-64">
          {retirementPipeline.map((item, index) => {
            const maxPipelineCount = Math.max(...retirementPipeline.map(d => d.count));
            const height = (item.count / maxPipelineCount) * 100;
            return (
              <div key={item.year} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-xl transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-slate-900 text-white px-2 py-1 rounded text-sm font-bold whitespace-nowrap">
                        {item.count} members
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">{item.year}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
