import { Database, Users, ArrowRight } from 'lucide-react';
import { DatabaseType } from '../../types';

interface DatabaseSelectorProps {
  onSelectDatabase: (databaseType: DatabaseType) => void;
}

export const DatabaseSelector = ({ onSelectDatabase }: DatabaseSelectorProps) => {
  const databases = [
    {
      id: 'ioUpload' as DatabaseType,
      name: 'IO Upload',
      description: 'Comprehensive member data with full address and policy information',
      icon: Database,
      recordCount: 247,
      lastUpdated: '2024-01-15',
      color: 'bg-blue-500',
      features: ['Employee Details', 'Pension Setup', 'Provider Routes', 'Team Tracking', 'Financial Status']
    },
    {
      id: 'newEmployeeUpload' as DatabaseType,
      name: 'New Employee Upload',
      description: 'New employee onboarding data with employment details',
      icon: Users,
      recordCount: 89,
      lastUpdated: '2024-01-20',
      color: 'bg-zomi-green',
      features: ['Employment Details', 'Personal Information', 'Pension Approach', 'UK Residency']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Members Data</h1>
        <p className="text-slate-600">Select a database to view and manage member information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {databases.map((database) => {
          const Icon = database.icon;
          return (
            <div
              key={database.id}
              className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => onSelectDatabase(database.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${database.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-zomi-green transition-colors" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">{database.name}</h2>
              <p className="text-slate-600 mb-4">{database.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{database.recordCount}</p>
                  <p className="text-xs text-slate-500">Records</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <p className="text-sm font-bold text-slate-900">{database.lastUpdated}</p>
                  <p className="text-xs text-slate-500">Last Updated</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">Key Features:</p>
                <div className="flex flex-wrap gap-2">
                  {database.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 group-hover:shadow-lg">
                  <span>Open Database</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Database Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">IO Upload Database</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Complete member profiles with full address information</li>
              <li>• Policy numbers and adviser assignments</li>
              <li>• Service status and client categorization</li>
              <li>• Salary information with post-sacrifice details</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">New Employee Upload Database</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• New employee onboarding information</li>
              <li>• Employment start dates and retirement planning</li>
              <li>• UK residency status and nationality</li>
              <li>• Pension investment approach preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};