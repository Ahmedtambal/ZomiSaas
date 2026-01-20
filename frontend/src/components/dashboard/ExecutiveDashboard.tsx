import { Users, TrendingUp, Activity, Link as LinkIcon, BarChart3, PieChart, TrendingDown } from 'lucide-react';
import { KPICard } from './KPICard';

export const ExecutiveDashboard = () => {
  const mockMembers = 247;
  const mockAUM = 12450000;
  const mockDataHealth = 94.5;
  const mockPendingForms = 12;

  const salaryDistribution = [
    { range: '£20k-£30k', count: 45 },
    { range: '£30k-£40k', count: 78 },
    { range: '£40k-£50k', count: 62 },
    { range: '£50k-£60k', count: 38 },
    { range: '£60k+', count: 24 },
  ];

  const investmentApproach = {
    adventurous: 152,
    cautious: 95,
  };

  const retirementPipeline = [
    { year: '2024', count: 8 },
    { year: '2025', count: 15 },
    { year: '2026', count: 22 },
    { year: '2027', count: 18 },
    { year: '2028', count: 25 },
  ];

  const maxCount = Math.max(...salaryDistribution.map(d => d.count));
  const totalInvestment = investmentApproach.adventurous + investmentApproach.cautious;
  const adventurousPercent = (investmentApproach.adventurous / totalInvestment) * 100;
  const cautiousPercent = (investmentApproach.cautious / totalInvestment) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Dashboard</h1>
        <p className="text-slate-600">Real-time insights for Zomi Wealth Group</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Members"
          value={mockMembers.toLocaleString()}
          subtitle="Active participants"
          icon={Users}
          trend={{ value: '12%', isPositive: true }}
        />
        <KPICard
          title="Estimated AUM"
          value={`£${(mockAUM / 1000000).toFixed(1)}M`}
          subtitle="Assets under management"
          icon={TrendingUp}
          trend={{ value: '8.3%', isPositive: true }}
        />
        <KPICard
          title="Data Health"
          value={`${mockDataHealth}%`}
          subtitle="Profile completeness"
          icon={Activity}
          trend={{ value: '2.1%', isPositive: true }}
        />
        <KPICard
          title="Pending Forms"
          value={mockPendingForms}
          subtitle="Awaiting completion"
          icon={LinkIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-zomi-green" />
            <h2 className="text-xl font-bold text-slate-900">Salary Distribution</h2>
          </div>
          <div className="space-y-4">
            {salaryDistribution.map((item) => (
              <div key={item.range}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.range}</span>
                  <span className="text-sm font-bold text-slate-900">{item.count} members</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-zomi-green to-zomi-mint h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-zomi-green" />
            <h2 className="text-xl font-bold text-slate-900">Investment Approach</h2>
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#c7f9cc"
                  strokeWidth="32"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#38b000"
                  strokeWidth="32"
                  strokeDasharray={`${(adventurousPercent / 100) * 502.65} 502.65`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">{totalInvestment}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zomi-green/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-zomi-green rounded"></div>
                <span className="font-medium text-slate-900">Adventurous</span>
              </div>
              <span className="font-bold text-slate-900">{investmentApproach.adventurous} ({adventurousPercent.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zomi-mint/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-zomi-mint rounded"></div>
                <span className="font-medium text-slate-900">Cautious</span>
              </div>
              <span className="font-bold text-slate-900">{investmentApproach.cautious} ({cautiousPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

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
