import { useState, useEffect } from 'react';
import { 
  Building2, Globe, Users, TrendingUp, Shield, Heart, Activity, 
  FileCheck, MapPin, RefreshCw, Info
} from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AnalyticsData {
  employees_by_company: Array<{ name: string; count: number }>;
  nationality_breakdown: Array<{ name: string; count: number }>;
  age_distribution: Array<{ bracket: string; count: number }>;
  pension_approaches: Array<{ name: string; count: number }>;
  coverage_rates: {
    pension: { active: number; inactive: number; rate: number };
    group_life: { has: number; no: number; rate: number };
    gci: { has: number; no: number; rate: number };
    gip: { has: number; no: number; rate: number };
    bupa: { has: number; no: number; rate: number };
  };
  gender_distribution: Array<{ name: string; count: number }>;
  residency: { uk_resident: number; non_uk_resident: number };
  io_status: { completed: number; pending: number };
  geographic_distribution: Array<{ area: string; count: number }>;
  total_employees: number;
}

const ABBREVIATIONS = {
  'GCI': 'Group Critical Illness',
  'GIP': 'Group Income Protection',
  'BUPA': 'British United Provident Association (Private Healthcare)'
};

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/kpi/analytics');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics data');
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
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel rounded-2xl p-6 h-80 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
              <div className="h-64 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-3 bg-zomi-green text-white rounded-lg hover:bg-zomi-green/90 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxCompanyCount = Math.max(...data.employees_by_company.map(d => d.count), 1);
  const maxNationalityCount = Math.max(...data.nationality_breakdown.map(d => d.count), 1);
  const maxApproachCount = Math.max(...data.pension_approaches.map(d => d.count), 1);
  const maxAgeCount = Math.max(...data.age_distribution.map(d => d.count), 1);

  const renderGauge = (label: string, rate: number, has: number, total: number, abbr?: string) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;

    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
            {abbr && (
              <button
                onMouseEnter={() => setShowInfo(abbr)}
                onMouseLeave={() => setShowInfo(null)}
                className="relative"
              >
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-zomi-green transition-colors" />
                {showInfo === abbr && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl">
                    <p className="font-semibold mb-1">{abbr}</p>
                    <p>{ABBREVIATIONS[abbr as keyof typeof ABBREVIATIONS]}</p>
                  </div>
                )}
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500">{has}/{total}</span>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="#38b000"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{rate}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workforce Analytics</h2>
          <p className="text-sm text-slate-600 mt-1">Comprehensive insights and distributions</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-zomi-green ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-slate-700">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>

      {/* Section 1: Comparison Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Company */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-zomi-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Employees by Company</h3>
              <p className="text-xs text-slate-500 truncate">Top 15 companies</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {data.employees_by_company.map((company, idx) => {
              const percentage = (company.count / maxCompanyCount) * 100;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[60%]" title={company.name}>
                      {company.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex-shrink-0">{company.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-zomi-green to-zomi-mint h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nationality Breakdown */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-zomi-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Nationality Breakdown</h3>
              <p className="text-xs text-slate-500 truncate">Top 10 nationalities</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {data.nationality_breakdown.map((nat, idx) => {
              const percentage = (nat.count / maxNationalityCount) * 100;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[70%]" title={nat.name}>
                      {nat.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex-shrink-0">{nat.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-zomi-green to-zomi-mint h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-zomi-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Age Distribution</h3>
              <p className="text-xs text-slate-500 truncate">By age bracket</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-56">
            {data.age_distribution.map((age, idx) => {
              const height = maxAgeCount > 0 ? (age.count / maxAgeCount) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center" style={{ height: '180px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-zomi-green to-zomi-mint rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                      style={{ height: `${Math.max(height, age.count > 0 ? 5 : 0)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
                          {age.count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 text-center">{age.bracket}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pension Investment Approach */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-zomi-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Investment Approach</h3>
              <p className="text-xs text-slate-500 truncate">Pension strategies</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {data.pension_approaches.map((approach, idx) => {
              const percentage = maxApproachCount > 0 ? (approach.count / maxApproachCount) * 100 : 0;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[65%]" title={approach.name}>
                      {approach.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex-shrink-0">{approach.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-zomi-green to-zomi-mint h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Coverage Rates Grid (2x2 mini gauges) + Other Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coverage Rates 2x2 Grid */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Coverage Rates</h3>
              <p className="text-xs text-slate-500">Insurance and benefits</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {renderGauge('Group Life', data.coverage_rates.group_life.rate, data.coverage_rates.group_life.has, data.total_employees)}
            {renderGauge('GCI', data.coverage_rates.gci.rate, data.coverage_rates.gci.has, data.total_employees, 'GCI')}
            {renderGauge('GIP', data.coverage_rates.gip.rate, data.coverage_rates.gip.has, data.total_employees, 'GIP')}
            {renderGauge('BUPA', data.coverage_rates.bupa.rate, data.coverage_rates.bupa.has, data.total_employees, 'BUPA')}
          </div>
        </div>

        {/* Pension Participation */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pension Participation</h3>
              <p className="text-[10px] text-slate-500">Active vs Inactive</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#38b000"
                  strokeWidth="16"
                  strokeDasharray={`${(data.coverage_rates.pension.rate / 100) * 352} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{data.coverage_rates.pension.rate}%</p>
                  <p className="text-[10px] text-slate-500">Active</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between px-3 py-2 bg-zomi-green/10 rounded-lg">
                <span className="text-xs font-medium text-slate-700">Active</span>
                <span className="text-xs font-bold text-zomi-green">{data.coverage_rates.pension.active}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-lg">
                <span className="text-xs font-medium text-slate-700">Inactive</span>
                <span className="text-xs font-bold text-slate-600">{data.coverage_rates.pension.inactive}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Gender, Residency, IO Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gender</h3>
              <p className="text-[10px] text-slate-500">Distribution</p>
            </div>
          </div>
          <div className="space-y-2">
            {data.gender_distribution.map((gender, idx) => {
              const total = data.gender_distribution.reduce((sum, g) => sum + g.count, 0);
              const percentage = total > 0 ? (gender.count / total) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-xs font-medium text-slate-700">{gender.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{gender.count}</span>
                    <span className="text-[10px] text-slate-500">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UK Residency */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">UK Residency</h3>
              <p className="text-[10px] text-slate-500">Resident status</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-xs font-medium text-slate-700">UK Resident</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{data.residency.uk_resident}</span>
                <span className="text-[10px] text-slate-500">
                  ({((data.residency.uk_resident / data.total_employees) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-xs font-medium text-slate-700">Non-UK Resident</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{data.residency.non_uk_resident}</span>
                <span className="text-[10px] text-slate-500">
                  ({((data.residency.non_uk_resident / data.total_employees) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* IO Upload Status */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-zomi-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">IO Upload Status</h3>
              <p className="text-[10px] text-slate-500">Upload progress</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-zomi-green/10 rounded-lg">
              <span className="text-xs font-medium text-slate-700">Completed</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zomi-green">{data.io_status.completed}</span>
                <span className="text-[10px] text-slate-500">
                  ({((data.io_status.completed / data.total_employees) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="text-xs font-medium text-slate-700">Pending</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{data.io_status.pending}</span>
                <span className="text-[10px] text-slate-500">
                  ({((data.io_status.pending / data.total_employees) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Geographic Distribution */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-zomi-mint rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-zomi-green" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Geographic Distribution</h3>
            <p className="text-xs text-slate-500">UK postcode areas</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.geographic_distribution.slice(0, 18).map((geo, idx) => {
            const maxGeoCount = Math.max(...data.geographic_distribution.map(g => g.count), 1);
            const intensity = (geo.count / maxGeoCount) * 100;
            return (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 hover:border-zomi-green transition-all cursor-pointer group"
                style={{
                  background: `linear-gradient(135deg, rgba(56, 176, 0, ${intensity / 200}) 0%, rgba(199, 249, 204, ${intensity / 300}) 100%)`
                }}
              >
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900 group-hover:text-zomi-green transition-colors">
                    {geo.area}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{geo.count} emp</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #38b000;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2d8c00;
        }
      `}</style>
    </div>
  );
};
