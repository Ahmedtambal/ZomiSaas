import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Trash2, Eye, EyeOff, Filter, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, ArrowLeft, Calendar } from 'lucide-react';
import { ColumnDefinition, DatabaseType } from '../../types';
import { changeInformationService, ChangeInformation } from '../../services/changeInformationService';
import { useNotification } from '../../context/NotificationContext';
import { auditService } from '../../services/auditService';
import ChangeInformationExportModal from './ChangeInformationExportModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface EditingCell {
  rowId: string;
  columnId: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  companyName: string;
  changeType: string;
  fromDate: Date | null;
  toDate: Date | null;
}

interface ValidationError {
  rowId: string;
  columnId: string;
  message: string;
}

interface ChangeInformationTableProps {
  databaseType: DatabaseType;
  onBack: () => void;
}

// Helper function to generate columns dynamically from change information data
const generateColumnsFromData = (records: ChangeInformation[]): ColumnDefinition[] => {
  if (records.length === 0) return [];
  
  const sampleRecord = records[0];
  const columns: ColumnDefinition[] = [];
  
  // Backend columns to HIDE from UI (remain in database only)
  const hiddenColumns = new Set([
    'id',
    'organization_id',
    'company_id', // Replaced by company_name
    'source_form_id',
    'created_by_user_id'
  ]);
  
  // Field label mapping
  const labelMap: Record<string, string> = {
    company_name: 'Company Name',
    first_name: 'First Name',
    surname: 'Surname',
    date_of_birth: 'Date of Birth',
    date_of_effect: 'Date of Effect',
    change_type: 'Change Type',
    other_reason: 'Other Reason',
    new_name: 'New Name',
    new_address: 'New Address',
    new_salary: 'New Salary',
    update_employee_contribution: 'Update EE Contribution',
    new_employee_contribution: 'New EE Contribution',
    submission_token: 'Submission Token',
    submitted_via: 'Submitted Via',
    ip_address: 'IP Address',
    user_agent: 'User Agent',
    processing_status: 'Processing Status',
    created_at: 'Created At',
    updated_at: 'Updated At',
  };
  
  // Generate columns from record keys
  Object.keys(sampleRecord).forEach(key => {
    if (hiddenColumns.has(key)) return;
    
    let columnType: 'text' | 'number' | 'date' | 'select' | 'email' = 'text';
    
    if (key.includes('date') || key.includes('_at')) {
      columnType = 'date';
    }
    
    columns.push({
      id: key,
      label: labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      sortable: true,
      editable: !['created_at', 'updated_at', 'company_name'].includes(key),
      type: columnType
    });
  });
  
  return columns;
};

const SortableTableHeader = ({ column, children }: { column: ColumnDefinition; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th ref={setNodeRef} style={style} className="text-left p-4 text-sm font-semibold text-slate-700 relative bg-white">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        {children}
      </div>
    </th>
  );
};

export const ChangeInformationTable = ({ databaseType, onBack }: ChangeInformationTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'created_at', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    companyName: '',
    changeType: '',
    fromDate: null,
    toDate: null,
  });
  const [companies, setCompanies] = useState<Array<{id: string; name: string}>>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const [records, setRecords] = useState<ChangeInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnDefinition[]>([]);
  const { notify, update } = useNotification();

  const databaseNames = {
    ioUpload: 'Employee Database',
    newEmployeeUpload: 'Audit Logs',
    changeInformation: 'Change of Information'
  };

  const rowsPerPage = 10;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load records and companies from API
  useEffect(() => {
    loadRecords();
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await changeInformationService.getAll();
      // Extract unique company names
      const uniqueCompanies = Array.from(
        new Map(response.map(r => [r.company_name, { id: r.company_id || '', name: r.company_name || '' }])).values()
      );
      setCompanies(uniqueCompanies);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await changeInformationService.getAll();
      
      // Sort by created_at DESC (newest first) by default
      const sortedRecords = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // DESC order
      });
      
      setRecords(sortedRecords);
      
      // Generate columns dynamically from the first record
      if (sortedRecords.length > 0) {
        const dynamicColumns = generateColumnsFromData(sortedRecords);
        
        // Reorder columns: company_name first, new fields before submission_token
        const companyCol = dynamicColumns.find(c => c.id === 'company_name');
        const otherCols = dynamicColumns.filter(c => c.id !== 'company_name');
        
        // Define desired column order for new fields (before submission_token)
        const priorityOrder = [
          'first_name', 'surname', 'date_of_birth', 'date_of_effect', 'change_type', 'other_reason',
          'new_name', 'new_address', 'new_salary', 'update_employee_contribution', 'new_employee_contribution',
          'submission_token', 'submitted_via', 'ip_address', 'user_agent', 'processing_status', 'created_at', 'updated_at'
        ];
        
        // Sort otherCols according to priorityOrder
        const sortedCols = otherCols.sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a.id);
          const bIndex = priorityOrder.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        
        // Company name first, then sorted columns
        const orderedColumns = companyCol ? [companyCol, ...sortedCols] : sortedCols;
        setColumnOrder(orderedColumns);
      }
    } catch (err: any) {
      console.error('Failed to load change information:', err);
      setError(err.response?.data?.detail || 'Failed to load change information data');
      notify({
        type: 'error',
        title: 'Load failed',
        description: 'Failed to load change information data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  const handleCellEdit = (recordId: string, columnId: string) => {
    const column = columnOrder.find(col => col.id === columnId);
    if (column?.editable) {
      setEditingCell({ rowId: recordId, columnId });
    }
  };

  const updateRecordField = async (recordId: string, fieldName: string, value: string): Promise<boolean> => {
    const recordIndex = records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return false;

    const updatedRecords = [...records];
    const oldValue = (updatedRecords[recordIndex] as any)[fieldName];
    (updatedRecords[recordIndex] as any)[fieldName] = value;
    setRecords(updatedRecords);

    try {
      // Call API to update
      await changeInformationService.update(recordId, { [fieldName]: value });
      
      // Log audit trail
      try {
        await auditService.logActivity({
          action: 'update',
          resource_type: 'change_information',
          resource_id: recordId,
          details: {
            field: fieldName,
            old_value: oldValue,
            new_value: value
          }
        });
      } catch (auditErr) {
        console.error('Failed to log audit:', auditErr);
      }

      notify({
        type: 'success',
        title: 'Update successful',
        description: 'Record updated successfully',
        duration: 2000,
      });
      return true;
    } catch (err: any) {
      console.error('Failed to update record:', err);
      notify({
        type: 'error',
        title: 'Update failed',
        description: err.response?.data?.detail || 'Failed to update record',
      });
      // Revert on error
      loadRecords();
      return false;
    }
  };

  const handleCellSave = async (recordId: string, columnId: string, value: string) => {
    const success = await updateRecordField(recordId, columnId, value);
    if (success) {
      setEditingCell(null);
    }
  };

  const handleSort = (columnId: string) => {
    const column = columnOrder.find(col => col.id === columnId);
    if (!column?.sortable) return;

    setSortConfig(prev => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) {
      notify({
        type: 'warning',
        title: 'No selection',
        description: 'Please select rows to delete',
      });
      return;
    }

    notify({
      type: 'warning',
      title: `Delete ${selectedRows.size} record(s)?`,
      description: 'This action cannot be undone',
      duration: 10000,
      actions: [
        {
          label: 'Confirm Delete',
          onClick: async () => {
            const loadingId = notify({
              type: 'loading',
              title: 'Deleting records...',
              dismissible: false,
            });

            try {
              const idsToDelete = Array.from(selectedRows);
              await changeInformationService.bulkDelete(idsToDelete);
              
              // Log audit trail
              try {
                await auditService.logActivity({
                  action: 'bulk_delete',
                  resource_type: 'change_information',
                  resource_id: null,
                  details: {
                    deleted_count: idsToDelete.length,
                    ids: idsToDelete
                  }
                });
              } catch (auditErr) {
                console.error('Failed to log audit:', auditErr);
              }
              
              // Remove from local state
              setRecords(prev => prev.filter(r => !selectedRows.has(r.id)));
              setSelectedRows(new Set());
              
              update(loadingId, {
                type: 'success',
                title: 'Delete successful',
                description: `Successfully deleted ${idsToDelete.length} record(s)`,
                duration: 3000,
                dismissible: true,
              });
            } catch (err: any) {
              console.error('Failed to delete records:', err);
              update(loadingId, {
                type: 'error',
                title: 'Delete failed',
                description: err.response?.data?.detail || 'Failed to delete records',
                duration: 6000,
                dismissible: true,
              });
            }
          },
        },
        {
          label: 'Cancel',
          onClick: () => {},
        },
      ],
    });
  };

  const sortedAndFilteredRecords = records
    .filter(record => {
      const matchesSearch = 
        Object.values(record).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesCompany = !filterConfig.companyName || 
        record.company_name === filterConfig.companyName;
      
      const matchesChangeType = !filterConfig.changeType || 
        record.change_type === filterConfig.changeType;
      
      // Date range filter
      const matchesDateRange = (() => {
        if (!filterConfig.fromDate && !filterConfig.toDate) return true;
        const recordDate = new Date(record.date_of_effect);
        if (filterConfig.fromDate && recordDate < filterConfig.fromDate) return false;
        if (filterConfig.toDate && recordDate > filterConfig.toDate) return false;
        return true;
      })();

      return matchesSearch && matchesCompany && matchesChangeType && matchesDateRange;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.column];
      const bValue = (b as any)[sortConfig.column];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle date strings
      if (sortConfig.column.includes('date') || sortConfig.column.includes('_at')) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredRecords.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRecords = sortedAndFilteredRecords.slice(startIndex, startIndex + rowsPerPage);

  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === paginatedRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRecords.map(r => r.id)));
    }
  };

  const exportToCSV = async () => {
    const selectedRecords = selectedRows.size > 0 
      ? records.filter(r => selectedRows.has(r.id))
      : sortedAndFilteredRecords;
    
    try {
      // Create CSV content
      const headers = ['Company Name', 'First Name', 'Surname', 'Date of Birth', 'Date of Effect', 'Change Type', 'Other Reason', 'Processing Status', 'Created At', 'Updated At'];
      const rows = selectedRecords.map(record => [
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
            format: 'csv',
            record_count: selectedRecords.length,
            filters: filterConfig
          }
        });
      } catch (auditErr) {
        console.error('Failed to log audit:', auditErr);
      }

      notify({
        type: 'success',
        title: 'Export successful',
        description: `Exported ${selectedRecords.length} records to CSV`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Export failed:', err);
      notify({
        type: 'error',
        title: 'Export failed',
        description: 'Failed to export data. Please try again.',
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getCellValue = (record: ChangeInformation, columnId: string) => {
    const value = (record as any)[columnId];
    
    // Skip rendering if value is an object
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      return '';
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '';
    }
    
    return value;
  };

  const renderCell = (record: ChangeInformation, column: ColumnDefinition) => {
    const isEditing = editingCell?.rowId === record.id && editingCell?.columnId === column.id;
    const hasError = validationErrors.some(err => err.rowId === record.id && err.columnId === column.id);
    const error = validationErrors.find(err => err.rowId === record.id && err.columnId === column.id);

    if (isEditing && column.editable) {
      const currentValue = (record as any)[column.id];
      
      if (column.type === 'select' && column.options) {
        return (
          <select
            ref={editInputRef as React.RefObject<HTMLSelectElement>}
            defaultValue={currentValue}
            onBlur={(e) => handleCellSave(record.id, column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(record.id, column.id, e.currentTarget.value);
              }
              if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className={`w-full px-2 py-1 border rounded ${hasError ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:border-zomi-green`}
          >
            {column.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }

      return (
        <div className="relative">
          <input
            ref={editInputRef as React.RefObject<HTMLInputElement>}
            type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
            defaultValue={currentValue}
            onBlur={(e) => handleCellSave(record.id, column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(record.id, column.id, e.currentTarget.value);
              }
              if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className={`w-full px-2 py-1 border rounded ${hasError ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:border-zomi-green`}
          />
          {error && (
            <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 z-10 whitespace-nowrap">
              {error.message}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => handleCellEdit(record.id, column.id)}
        className={`cursor-pointer hover:bg-slate-100 px-2 py-1 rounded ${column.editable ? 'hover:bg-blue-50' : ''} ${hasError ? 'bg-red-50' : ''}`}
      >
        {getCellValue(record, column.id)}
      </div>
    );
  };

  const getSortIcon = (columnId: string) => {
    if (sortConfig.column !== columnId) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-zomi-green" />
      : <ArrowDown className="w-4 h-4 text-zomi-green" />;
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-full min-h-0 h-full"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* TOP SECTION - FIXED HEADER */}
      <div className="bg-white border-b border-slate-200" style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Databases
            </button>
            <h1 className="text-3xl font-bold text-slate-900">{databaseNames[databaseType]}</h1>
          </div>
          <p className="text-slate-600">Manage and export change information with spreadsheet functionality</p>
        </div>

        {!loading && !error && (
          <div className="bg-white p-6 border-t border-slate-100">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
                  placeholder="Search by name, company, or change type..."
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterConfig.companyName}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, companyName: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
                >
                  <option value="">All Companies</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.name}>{company.name}</option>
                  ))}
                </select>

                <select
                  value={filterConfig.changeType}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, changeType: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors"
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

                <div className="relative">
                  <DatePicker
                    selected={filterConfig.fromDate}
                    onChange={(date) => setFilterConfig(prev => ({ ...prev, fromDate: date }))}
                    placeholderText="From Date"
                    dateFormat="yyyy-MM-dd"
                    className="px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors w-40"
                  />
                </div>

                <div className="relative">
                  <DatePicker
                    selected={filterConfig.toDate}
                    onChange={(date) => setFilterConfig(prev => ({ ...prev, toDate: date }))}
                    placeholderText="To Date"
                    dateFormat="yyyy-MM-dd"
                    className="px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-slate-50 focus:bg-white focus:border-zomi-green focus:outline-none transition-colors w-40"
                  />
                </div>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-xl transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-zomi-mint/50 rounded-xl">
                <span className="font-medium text-slate-900">
                  {selectedRows.size} record(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToCSV()}
                    className="flex items-center gap-2 px-4 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button 
                    onClick={handleDeleteSelected}
                    disabled={selectedRows.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedRows.size > 0 ? `(${selectedRows.size})` : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MIDDLE SECTION - ONLY THIS AREA SCROLLS */}
      <div className="bg-white" style={{ minWidth: 0, minHeight: 0, overflow: 'auto' }}>
        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zomi-green mx-auto mb-4"></div>
            <p className="text-slate-600">Loading change information...</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-white rounded-2xl p-6 border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table
              className="border-collapse"
              style={{ width: 'max-content', minWidth: '100%' }}
            >
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 bg-slate-50 sticky left-0 z-20 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={toggleAllRows}
                      className="w-4 h-4 accent-zomi-green"
                    />
                  </th>
                  <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                    {columnOrder.map((column) => (
                      <SortableTableHeader key={column.id} column={column}>
                        <button
                          onClick={() => handleSort(column.id)}
                          className="flex items-center gap-2 hover:text-zomi-green transition-colors w-full text-left"
                          disabled={!column.sortable}
                        >
                          <span className="font-medium text-slate-700">{column.label}</span>
                          {column.sortable && getSortIcon(column.id)}
                        </button>
                      </SortableTableHeader>
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(record.id)}
                        onChange={() => toggleRowSelection(record.id)}
                        className="w-4 h-4 accent-zomi-green"
                      />
                    </td>
                    {columnOrder.map((column) => (
                      <td key={column.id} className="p-4 text-sm text-slate-600 relative whitespace-nowrap">
                        {renderCell(record, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        )}
      </div>

      {/* BOTTOM SECTION - FIXED FOOTER */}
      <div className="bg-white border-t border-slate-200" style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
        <div className="px-6 py-4">
          {!loading && !error ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, sortedAndFilteredRecords.length)} of {sortedAndFilteredRecords.length} records
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-zomi-green text-white rounded-lg font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">&nbsp;</div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ChangeInformationExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
