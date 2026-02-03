import { useState, useEffect } from 'react';
import { Database, ArrowRight } from 'lucide-react';
import { DatabaseType } from '../../types';
import apiClient from '../../services/apiClient';

interface DatabaseSelectorProps {
  onSelectDatabase: (databaseType: DatabaseType) => void;
}

export const DatabaseSelector = ({ onSelectDatabase }: DatabaseSelectorProps) => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  const [changeInfoCount, setChangeInfoCount] = useState(0);
  const [changeInfoLastUpdated, setChangeInfoLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeStats();
    fetchChangeInformationStats();
  }, []);

  const fetchEmployeeStats = async () => {
    try {
      const response = await apiClient.get('/api/employees');
      const employees = response.data;
      setEmployeeCount(employees.length);
      
      // Get most recent updated_at timestamp
      if (employees.length > 0) {
        const mostRecent = employees.reduce((latest: any, emp: any) => {
          const empDate = new Date(emp.updated_at || emp.created_at);
          const latestDate = new Date(latest.updated_at || latest.created_at);
          return empDate > latestDate ? emp : latest;
        });
        setLastUpdated(new Date(mostRecent.updated_at || mostRecent.created_at).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to fetch employee stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeInformationStats = async () => {
    try {
      const response = await apiClient.get('/api/change-information');
      const changeInfos = response.data;
      setChangeInfoCount(changeInfos.length);
      
      // Get most recent updated_at timestamp
      if (changeInfos.length > 0) {
        const mostRecent = changeInfos.reduce((latest: any, info: any) => {
          const infoDate = new Date(info.updated_at || info.created_at);
          const latestDate = new Date(latest.updated_at || latest.created_at);
          return infoDate > latestDate ? info : latest;
        });
        setChangeInfoLastUpdated(new Date(mostRecent.updated_at || mostRecent.created_at).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to fetch change information stats:', error);
    }
  };

  const databases = [
    {
      id: 'ioUpload' as DatabaseType,
      name: 'Employee Database',
      description: 'Comprehensive member data with full address and policy information',
      icon: Database,
      recordCount: loading ? '...' : employeeCount,
      lastUpdated: loading ? '...' : lastUpdated,
      color: 'bg-blue-500',
      features: ['Employee Details', 'Pension Setup', 'Provider Routes', 'Team Tracking', 'Financial Status']
    },
    {
      id: 'changeInformation' as DatabaseType,
      name: 'Change of Information',
      description: 'Track and manage employee status changes, updates, and modifications',
      icon: Database,
      recordCount: loading ? '...' : changeInfoCount,
      lastUpdated: loading ? '...' : changeInfoLastUpdated,
      color: 'bg-orange-500',
      features: ['Change Type', 'Date of Effect', 'Processing Status', 'Audit Trail', 'Form Submissions']
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
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Employee Database</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Complete member profiles with full address information</li>
              <li>• Policy numbers and adviser assignments</li>
              <li>• Service status and client categorization</li>
              <li>• Salary information with post-sacrifice details</li>
              <li>• Real-time employee count: <span className="font-semibold text-slate-900">{loading ? 'Loading...' : employeeCount}</span></li>
              <li>• Last updated: <span className="font-semibold text-slate-900">{loading ? 'Loading...' : lastUpdated}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Change of Information</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Track employee status changes (Leavers, Maternity, etc.)</li>
              <li>• Name, address, and salary change records</li>
              <li>• Form submission tracking and audit trail</li>
              <li>• Processing status workflow management</li>
              <li>• Real-time record count: <span className="font-semibold text-slate-900">{loading ? 'Loading...' : changeInfoCount}</span></li>
              <li>• Last updated: <span className="font-semibold text-slate-900">{loading ? 'Loading...' : changeInfoLastUpdated}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};