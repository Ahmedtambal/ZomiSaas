import { useState, useEffect } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import apiClient from '../../services/apiClient';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Company {
  id: string;
  name: string;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<SelectOption | null>(null);
  const [adviceType, setAdviceType] = useState('');
  const [pensionProvider, setPensionProvider] = useState('');
  const [serviceStatuses, setServiceStatuses] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load companies on mount
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const companyOptions: SelectOption[] = [
    { value: '', label: 'All Companies' },
    ...companies.map(c => ({ value: c.id, label: c.name }))
  ];

  const toggleServiceStatus = (status: string) => {
    setServiceStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (selectedCompany?.value) params.append('company_id', selectedCompany.value);
      if (adviceType) params.append('advice_type', adviceType);
      if (pensionProvider) params.append('pension_provider', pensionProvider);
      if (serviceStatuses.length > 0) params.append('service_status', serviceStatuses.join(','));
      if (fromDate) params.append('from_date', fromDate.toISOString().split('T')[0]);
      if (toDate) params.append('to_date', toDate.toISOString().split('T')[0]);

      const response = await apiClient.get(
        `/api/employees/export/io-template?${params.toString()}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.setAttribute('download', `employee_export_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(209, 213, 219, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Export Employee Data
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              📄 Export Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                  className="w-4 h-4 text-zomi-green focus:ring-zomi-green"
                />
                <span className="text-slate-900 dark:text-white">CSV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={(e) => setFormat(e.target.value as 'excel')}
                  className="w-4 h-4 text-zomi-green focus:ring-zomi-green"
                />
                <span className="text-slate-900 dark:text-white">Excel</span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-6"></div>

          {/* Advanced Filters */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              🔍 Advanced Filters
            </h3>

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📅 Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <DatePicker
                    selected={fromDate}
                    onChange={(date) => setFromDate(date)}
                    placeholderText="From Date"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-zomi-green focus:border-transparent"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <div>
                  <DatePicker
                    selected={toDate}
                    onChange={(date) => setToDate(date)}
                    placeholderText="To Date"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-zomi-green focus:border-transparent"
                    dateFormat="yyyy-MM-dd"
                    minDate={fromDate || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Company Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏢 Company
              </label>
              <Select
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companyOptions}
                placeholder="Select Company..."
                isClearable
                isLoading={loading}
                className="text-slate-900"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#cbd5e1',
                    '&:hover': {
                      borderColor: '#94a3b8'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 100
                  })
                }}
              />
            </div>

            {/* Advice Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                💼 Advice Type
              </label>
              <select
                value={adviceType}
                onChange={(e) => setAdviceType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-zomi-green focus:border-transparent"
              >
                <option value="">All Advice Types</option>
                <option value="Migrated Plans">Migrated Plans</option>
                <option value="Pre-Existing Plan">Pre-Existing Plan</option>
              </select>
            </div>

            {/* Pension Provider */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏦 Pension Provider
              </label>
              <select
                value={pensionProvider}
                onChange={(e) => setPensionProvider(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-zomi-green focus:border-transparent"
              >
                <option value="">All Providers</option>
                <option value="Royal London">Royal London</option>
                <option value="Scottish Widows">Scottish Widows</option>
                <option value="Aegon">Aegon</option>
                <option value="Aviva">Aviva</option>
                <option value="Opt Enrol">Opt Enrol</option>
              </select>
            </div>

            {/* Service Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ✅ Service Status
              </label>
              <div className="flex gap-4">
                {['Active', 'Inactive', 'Pending'].map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceStatuses.includes(status)}
                      onChange={() => toggleServiceStatus(status)}
                      className="w-4 h-4 text-zomi-green focus:ring-zomi-green rounded"
                    />
                    <span className="text-slate-900 dark:text-white">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
