import { useState, useCallback, useEffect } from 'react';
import { Search, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';
import { DatabaseType } from '../../types';
import { changeInformationService, ChangeInformation } from '../../services/changeInformationService';
import { useNotification } from '../../context/NotificationContext';

interface ChangeInformationTableProps {
  databaseType: DatabaseType;
  onBack: () => void;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export const ChangeInformationTable = ({ databaseType, onBack }: ChangeInformationTableProps) => {
  const [data, setData] = useState<ChangeInformation[]>([]);
  const [filteredData, setFilteredData] = useState<ChangeInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [data, searchTerm, sortConfig]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await changeInformationService.getAll();
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch change information:', error);
      showNotification('Failed to load change information data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = useCallback(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.first_name?.toLowerCase().includes(lowerSearch) ||
        item.surname?.toLowerCase().includes(lowerSearch) ||
        item.company_name?.toLowerCase().includes(lowerSearch) ||
        item.change_type?.toLowerCase().includes(lowerSearch) ||
        item.other_reason?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.column as keyof ChangeInformation];
      const bValue = b[sortConfig.column as keyof ChangeInformation];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
  }, [data, searchTerm, sortConfig]);

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedRows.size} record(s)?`)) {
      return;
    }

    try {
      await changeInformationService.bulkDelete(Array.from(selectedRows));
      showNotification(`Successfully deleted ${selectedRows.size} record(s)`, 'success');
      setSelectedRows(new Set());
      await fetchData();
    } catch (error) {
      showNotification('Failed to delete records', 'error');
    }
  };

  const handleExport = () => {
    const headers = ['Company Name', 'First Name', 'Last Name', 'Date of Birth', 'Date of Effect', 'Change Type', 'Other Reason', 'Created At', 'Updated At'];
    const csvData = filteredData.map(item => [
      item.company_name || '',
      item.first_name,
      item.surname,
      item.date_of_birth,
      item.date_of_effect,
      item.change_type,
      item.other_reason || '',
      new Date(item.created_at).toLocaleString(),
      new Date(item.updated_at).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-information-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Change of Information</h2>
            <p className="text-sm text-slate-600">{filteredData.length} records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete ({selectedRows.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, company, or change type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zomi-green/20 focus:border-zomi-green"
        />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-zomi-green focus:ring-zomi-green"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('company_name')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Company Name {getSortIcon('company_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('first_name')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    First Name {getSortIcon('first_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('surname')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Last Name {getSortIcon('surname')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('date_of_birth')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Date of Birth {getSortIcon('date_of_birth')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('date_of_effect')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Date of Effect {getSortIcon('date_of_effect')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('change_type')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Change Type {getSortIcon('change_type')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Other Reason
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Created At {getSortIcon('created_at')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <button
                    onClick={() => handleSort('updated_at')}
                    className="flex items-center gap-2 hover:text-zomi-green"
                  >
                    Updated At {getSortIcon('updated_at')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="rounded border-slate-300 text-zomi-green focus:ring-zomi-green"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {item.company_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {item.first_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {item.surname}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(item.date_of_birth)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {formatDate(item.date_of_effect)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.change_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item.other_reason || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDateTime(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDateTime(item.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
