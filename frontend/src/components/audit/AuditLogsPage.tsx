import React, { useEffect, useState } from 'react';
import { Clock, Calendar, User, Search, Download, Filter } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  record_id: string | null;
  details: any;
  created_at: string;
  organization_id: string;
}

interface AuditStats {
  total_logs: number;
  last_24_hours: number;
  most_common_action: string;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [searchTerm, actionFilter, resourceFilter, sortOrder]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resource', resourceFilter);
      params.append('sort_order', sortOrder);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Record ID', 'Details'];
    const csvData = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_name || log.user_email,
      log.action,
      log.resource,
      log.record_id || 'N/A',
      JSON.stringify(log.details)
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800 border-green-200',
      UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      BULK_DELETE: 'bg-red-100 text-red-800 border-red-200',
      EXPORT: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-950">Activity Log</h1>
            <p className="text-gray-700 mt-1">Track all system activities and changes</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Activities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_logs}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Last 24 Hours</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.last_24_hours}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Most Common</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.most_common_action}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user, action, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="BULK_DELETE">Bulk Delete</option>
              <option value="EXPORT">Export</option>
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Resources</option>
              <option value="employees">Employees</option>
              <option value="companies">Companies</option>
              <option value="forms">Forms</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            <button
              onClick={handleExport}
              className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Activity Logs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
              <p className="text-gray-600">No activity logs match your current filters.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* Left: User Info and Action */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-gray-900 font-semibold">
                          {log.action === 'form_submission' && log.details?.company_name
                            ? log.details.company_name
                            : (log.user_name || log.user_email)}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-gray-600 text-sm">on {log.resource}</span>
                      </div>

                      {/* Record ID if exists */}
                      {log.record_id && (
                        <p className="text-gray-600 text-sm mt-1">
                          Record ID: <span className="font-mono text-gray-900">{log.record_id}</span>
                        </p>
                      )}

                      {/* Bulk Delete IDs */}
                      {log.action === 'BULK_DELETE' && log.details?.metadata?.deleted_ids && (
                        <div className="text-gray-600 text-sm mt-1">
                          <span>Deleted IDs ({log.details.metadata.count}):</span>
                          <div className="font-mono text-xs text-gray-900 mt-1 bg-gray-50 p-2 rounded border border-gray-200 max-h-20 overflow-y-auto">
                            {log.details.metadata.deleted_ids.slice(0, 5).map((id: string, idx: number) => (
                              <div key={idx}>{id}</div>
                            ))}
                            {log.details.metadata.deleted_ids.length > 5 && (
                              <div className="text-gray-500 mt-1">
                                + {log.details.metadata.deleted_ids.length - 5} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-gray-500 text-sm">{getRelativeTime(log.created_at)}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
