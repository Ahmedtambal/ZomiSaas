import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { changeInformationService } from '../../services/changeInformationService';
import { auditService } from '../../services/auditService';

interface ChangeInformationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeInformationExportModal({ isOpen, onClose }: ChangeInformationExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedChangeType, setSelectedChangeType] = useState('');
  const [companies, setCompanies] = useState<Array<{id: string; name: string}>>([]);
  const [exporting, setExporting] = useState(false);

  // Load companies on mount
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      const records = await changeInformationService.getAll();
      // Extract unique company names
      const uniqueCompanies = Array.from(
        new Map(records.map(r => [r.company_name, { id: r.company_id || '', name: r.company_name || '' }])).values()
      );
      setCompanies(uniqueCompanies);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Fetch all records
      const allRecords = await changeInformationService.getAll();

      // Apply filters
      let filteredRecords = allRecords.filter(record => {
        const matchesCompany = !selectedCompany || record.company_name === selectedCompany;
        const matchesChangeType = !selectedChangeType || record.change_type === selectedChangeType;
        
        // Date range filter
        const matchesDateRange = (() => {
          if (!fromDate && !toDate) return true;
          const recordDate = new Date(record.date_of_effect);
          if (fromDate && recordDate < fromDate) return false;
          if (toDate && recordDate > toDate) return false;
          return true;
        })();

        return matchesCompany && matchesChangeType && matchesDateRange;
      });

      // Create CSV content
      const headers = ['Company Name', 'First Name', 'Surname', 'Date of Birth', 'Date of Effect', 'Change Type', 'Other Reason', 'Processing Status', 'Created At', 'Updated At'];
      const rows = filteredRecords.map(record => [
        record.company_name || '',
        record.first_name || '',
        record.surname || '',
        record.date_of_birth || '',
        record.date_of_effect || '',
        record.change_type || '',
        record.other_reason || '',
        record.processing_status || '',
        new Date(record.created_at).toLocaleString(),
        new Date(record.updated_at).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.download = `change_information_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log audit trail
      try {
        await auditService.logActivity({
          action: 'export',
          resource_type: 'change_information',
          resource_id: null,
          details: {
            format,
            record_count: filteredRecords.length,
            filters: {
              company: selectedCompany,
              changeType: selectedChangeType,
              fromDate: fromDate?.toISOString(),
              toDate: toDate?.toISOString()
            }
          }
        });
      } catch (auditErr) {
        console.error('Failed to log audit:', auditErr);
      }

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
            Export Change Information
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

          {/* Advanced Filters Header */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              📅 Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                selected={fromDate}
                onChange={(date) => setFromDate(date)}
                placeholderText="From Date"
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
              />
              <DatePicker
                selected={toDate}
                onChange={(date) => setToDate(date)}
                placeholderText="To Date"
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              🏢 Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Change Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              🔄 Change Type
            </label>
            <select
              value={selectedChangeType}
              onChange={(e) => setSelectedChangeType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
            >
              <option value="">All Change Types</option>
              <option value="Leaver">Leaver</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Died">Died</option>
              <option value="Change of Name">Change of Name</option>
              <option value="Change of Address">Change of Address</option>
              <option value="Change of Salary">Change of Salary</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zomi-green hover:bg-zomi-green/90 text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
