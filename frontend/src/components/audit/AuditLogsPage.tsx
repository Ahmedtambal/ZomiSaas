import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Clock, User, FileText, Calendar } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user_id: string;
  user_name: string;
  user_email: string;
  organization_id: string;
  details: any;
  record_id?: string;
  ip_address?: string;
  created_at: string;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({ total_logs: 0, recent_activity: 0, actions_breakdown: {} });

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'BULK_DELETE', 'EXPORT'];
  const resourceTypes = ['employees', 'companies', 'forms', 'app_config'];

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedAction, selectedResource, sortOrder]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAction) params.append('action', selectedAction);
      if (selectedResource) params.append('resource', selectedResource);
      params.append('sort_order', sortOrder);
      params.append('limit', '100');

      const response = await apiClient.get(`/api/audit-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/audit-logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Record ID'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user_name,
        log.action,
        log.resource,
        log.record_id || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-500/20 text-green-400 border-green-500/30',
      UPDATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
      BULK_DELETE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      EXPORT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
          <p className="text-gray-400">Track all system activities and changes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="rounded-xl p-6 border"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(209, 213, 219, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Activities</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total_logs}</p>
            </div>
            <FileText className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        <div 
          className="rounded-xl p-6 border"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(209, 213, 219, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Last 24 Hours</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.recent_activity}</p>
            </div>
            <Clock className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div 
          className="rounded-xl p-6 border"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(209, 213, 219, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Most Common</p>
              <p className="text-3xl font-bold text-white mt-1">
                {Object.entries(stats.actions_breakdown).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}
              </p>
            </div>
            <Calendar className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        className="rounded-xl p-6 border space-y-4"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(209, 213, 219, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by user, action, resource, or record ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* Resource Filter */}
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Resources</option>
            {resourceTypes.map(resource => (
              <option key={resource} value={resource}>{resource}</option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Activity Log Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div 
            className="rounded-xl p-12 border text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(209, 213, 219, 0.3)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
            }}
          >
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No activity logs found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl p-5 border hover:border-indigo-500/50 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(209, 213, 219, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* User Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white font-semibold">{log.user_name}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-gray-400 text-sm">on {log.resource}</span>
                    </div>
                    
                    {log.record_id && (
                      <p className="text-gray-500 text-sm mt-1">
                        Record ID: <span className="text-gray-400 font-mono text-xs">{log.record_id.substring(0, 8)}...</span>
                      </p>
                    )}

                    {log.ip_address && (
                      <p className="text-gray-600 text-xs mt-1">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-gray-400 text-sm">{formatTimestamp(log.created_at)}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
