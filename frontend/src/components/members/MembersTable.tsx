import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, Trash2, Eye, EyeOff, Filter, ArrowUpDown, ArrowUp, ArrowDown, Copy, CheckCircle, GripVertical, ArrowLeft } from 'lucide-react';
import { ColumnDefinition, DatabaseMember, DatabaseType } from '../../types';
import { employeeService, Employee } from '../../services/employeeService';
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
  status: string;
  investmentApproach: string;
  nationality: string;
  maritalStatus: string;
}

interface ValidationError {
  rowId: string;
  columnId: string;
  message: string;
}

interface MembersTableProps {
  columns: ColumnDefinition[];
  databaseType: DatabaseType;
  onBack: () => void;
}

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
    <th ref={setNodeRef} style={style} className="text-left p-4 text-sm font-semibold text-slate-700 relative">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        {children}
      </div>
    </th>
  );
};

export const MembersTable = ({ columns, databaseType, onBack }: MembersTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'id', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    status: '',
    investmentApproach: '',
    nationality: '',
    maritalStatus: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [copiedData, setCopiedData] = useState(false);
  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const databaseNames = {
    ioUpload: 'Employee Database',
    newEmployeeUpload: 'Audit Logs'
  };

  const rowsPerPage = 10;

  const [columnOrder, setColumnOrder] = useState<ColumnDefinition[]>(columns);

  // Generate mock data based on column definitions
  const generateMockData = (columns: ColumnDefinition[], count: number): DatabaseMember[] => {
    const mockData: DatabaseMember[] = [];
    
    for (let i = 0; i < count; i++) {
      const member: DatabaseMember = {
        id: `MEM-${String(i + 1).padStart(4, '0')}`,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };

      columns.forEach(column => {
        switch (column.type) {
          case 'text':
            if (column.id.includes('name') || column.id.includes('Name') || column.id === 'forename' || column.id === 'surname') {
              member[column.id] = ['John', 'Jane', 'Michael', 'Sarah', 'David'][i % 5];
            } else if (column.id.includes('address') || column.id.includes('Address')) {
              member[column.id] = `${Math.floor(Math.random() * 999) + 1} ${['High Street', 'Main Road', 'Church Lane', 'Victoria Road'][i % 4]}`;
            } else if (column.id.includes('postcode') || column.id.includes('PostCode')) {
              member[column.id] = `SW1A ${Math.floor(Math.random() * 9)}AA`;
            } else if (column.id.includes('niNumber') || column.id.includes('NINumber')) {
              member[column.id] = `AB123456${String.fromCharCode(65 + (i % 26))}`;
            } else if (column.id === 'schemeRef') {
              member[column.id] = `SCH-${String(i + 1).padStart(4, '0')}`;
            } else if (column.id === 'sellingAdviserId') {
              member[column.id] = `ADV-${String((i % 10) + 1).padStart(3, '0')}`;
            } else if (column.id === 'sectionNumber') {
              member[column.id] = `SEC-${String((i % 5) + 1)}`;
            } else {
              member[column.id] = `Sample ${column.label} ${i + 1}`;
            }
            break;
          case 'email':
            member[column.id] = `member${i + 1}@example.com`;
            break;
          case 'number':
            if (column.id.includes('salary') || column.id.includes('Salary')) {
              member[column.id] = 35000 + (i * 1000);
            } else if (column.id.includes('age') || column.id.includes('Age')) {
              member[column.id] = 65 + (i % 10);
            } else {
              member[column.id] = Math.floor(Math.random() * 1000) + 1;
            }
            break;
          case 'date':
            if (column.id.includes('birth') || column.id.includes('Birth')) {
              member[column.id] = '1985-03-15';
            } else if (column.id === 'employmentStartDate') {
              member[column.id] = '2023-01-15';
            } else if (column.id === 'pensionStartingDate') {
              member[column.id] = '2024-02-01';
            } else {
              member[column.id] = '2024-01-15';
            }
            break;
          case 'select':
            if (column.options && column.options.length > 0) {
              member[column.id] = column.options[i % column.options.length];
            }
            break;
          case 'checkbox':
            member[column.id] = i % 2 === 0;
            break;
          default:
            member[column.id] = `Value ${i + 1}`;
        }
      });

      mockData.push(member);
    }

    return mockData;
  };

  const [members, setMembers] = useState<DatabaseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employees from API
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const employees = await employeeService.getEmployees();
      
      // Convert Employee[] to DatabaseMember[] format
      const memberData: DatabaseMember[] = employees.map((emp: Employee) => ({
        id: emp.id,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
        title: emp.title || '',
        forename: emp.first_name,
        surname: emp.surname,
        niNumber: emp.ni_number || '',
        dateOfBirth: emp.date_of_birth || '',
        gender: emp.gender || '',
        maritalStatus: emp.marital_status || '',
        addressLine1: emp.address_line_1 || '',
        addressLine2: emp.address_line_2 || '',
        addressLine3: emp.address_line_3 || '',
        addressLine4: emp.address_line_4 || '',
        postcode: emp.postcode || '',
        emailAddress: emp.email_address || '',
        mobileNumber: emp.mobile_number || '',
        ukResident: emp.uk_resident ? 'Yes' : 'No',
        nationality: emp.nationality || '',
        jobTitle: emp.job_title || '',
        pensionableSalary: emp.pensionable_salary || 0,
        employmentStartDate: emp.employment_start_date || '',
        selectedRetirementAge: emp.selected_retirement_age || 0,
        pensionInvestmentApproach: emp.pension_investment_approach || '',
        schemeRef: emp.scheme_ref || '',
        sectionNumber: emp.split_template_group_name || '',
        serviceStatus: emp.service_status || 'Active',
      }));
      
      setMembers(memberData);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.response?.data?.detail || 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const validateCellValue = (columnId: string, value: string): string | null => {
    const column = columnOrder.find(col => col.id === columnId);
    if (!column) return null;

    const validation = column.validation;
    if (!validation) return null;

    switch (column.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return validation.customMessage || 'Please enter a valid email address';
        }
        break;
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          return validation.customMessage || 'Please enter a valid positive number';
        }
        if (validation.min !== undefined && numValue < validation.min) {
          return validation.customMessage || `Value must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return validation.customMessage || `Value must be no more than ${validation.max}`;
        }
        break;
      case 'text':
        if (validation.required && value.trim().length === 0) {
          return validation.customMessage || 'This field is required';
        }
        if (validation.minLength && value.length < validation.minLength) {
          return validation.customMessage || `Must be at least ${validation.minLength} characters`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return validation.customMessage || `Must be no more than ${validation.maxLength} characters`;
        }
        if (validation.pattern) {
          try {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value.toUpperCase())) {
              return validation.customMessage || 'Invalid format';
            }
          } catch (e) {
            console.warn('Invalid regex pattern:', validation.pattern);
          }
        }
        break;
    }
    return null;
  };

  const updateMemberField = useCallback(async (memberId: string, field: string, value: string) => {
    const validationError = validateCellValue(field, value);
    
    if (validationError) {
      setValidationErrors(prev => [
        ...prev.filter(err => !(err.rowId === memberId && err.columnId === field)),
        { rowId: memberId, columnId: field, message: validationError }
      ]);
      return false;
    }

    setValidationErrors(prev => 
      prev.filter(err => !(err.rowId === memberId && err.columnId === field))
    );

    try {
      // Map DatabaseMember field names back to Employee API field names
      const fieldMap: Record<string, string> = {
        forename: 'first_name',
        niNumber: 'ni_number',
        dateOfBirth: 'date_of_birth',
        maritalStatus: 'marital_status',
        addressLine1: 'address_line_1',
        addressLine2: 'address_line_2',
        addressLine3: 'address_line_3',
        addressLine4: 'address_line_4',
        emailAddress: 'email_address',
        mobileNumber: 'mobile_number',
        ukResident: 'uk_resident',
        jobTitle: 'job_title',
        pensionableSalary: 'pensionable_salary',
        employmentStartDate: 'employment_start_date',
        selectedRetirementAge: 'selected_retirement_age',
        pensionInvestmentApproach: 'pension_investment_approach',
        schemeRef: 'scheme_ref',
        sectionNumber: 'split_template_group_name',
        serviceStatus: 'service_status',
      };

      const apiField = fieldMap[field] || field;
      let apiValue: any = value;

      // Convert values based on type
      const column = columnOrder.find(col => col.id === field);
      if (field === 'pensionableSalary' || field === 'salary') {
        apiValue = parseFloat(value);
      } else if (field === 'ukResident') {
        apiValue = value === 'Yes';
      } else if (column?.type === 'checkbox') {
        apiValue = value === 'true';
      }

      // Update via API
      await employeeService.updateEmployee(memberId, { [apiField]: apiValue });

      // Update local state
      setMembers(prev => prev.map(member => {
        if (member.id === memberId) {
          const updatedMember = { ...member, [field]: apiValue };
          updatedMember.updatedAt = new Date().toISOString();
          return updatedMember;
        }
        return member;
      }));

      return true;
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      alert(err.response?.data?.detail || 'Failed to update employee');
      return false;
    }
  }, [columns, columnOrder]);

  const handleCellEdit = (memberId: string, columnId: string) => {
    const column = columnOrder.find(col => col.id === columnId);
    if (column?.editable) {
      setEditingCell({ rowId: memberId, columnId });
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 0);
    }
  };

  const handleCellSave = (memberId: string, columnId: string, value: string) => {
    const success = updateMemberField(memberId, columnId, value);
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
      alert('Please select rows to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRows.size} employee(s)?`)) {
      return;
    }

    try {
      const idsToDelete = Array.from(selectedRows);
      await employeeService.bulkDeleteEmployees(idsToDelete);
      
      // Remove from local state
      setMembers(prev => prev.filter(m => !selectedRows.has(m.id)));
      setSelectedRows(new Set());
      
      alert(`Successfully deleted ${idsToDelete.length} employee(s)`);
    } catch (err: any) {
      console.error('Failed to delete employees:', err);
      alert(err.response?.data?.detail || 'Failed to delete employees');
    }
  };

  const sortedAndFilteredMembers = members
    .filter(member => {
      const matchesSearch = 
        Object.values(member).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = !filterConfig.status || 
        (member.status === filterConfig.status || member.serviceStatus === filterConfig.status);
      const matchesApproach = !filterConfig.investmentApproach || 
        (member.investmentApproach === filterConfig.investmentApproach || 
         member.pensionInvestmentApproach === filterConfig.investmentApproach);
      const matchesNationality = !filterConfig.nationality || member.nationality === filterConfig.nationality;
      const matchesMaritalStatus = !filterConfig.maritalStatus || member.maritalStatus === filterConfig.maritalStatus;

      return matchesSearch && matchesStatus && matchesApproach && matchesNationality && matchesMaritalStatus;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortConfig.column];
      const bValue = (b as any)[sortConfig.column];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredMembers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMembers = sortedAndFilteredMembers.slice(startIndex, startIndex + rowsPerPage);

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
    if (selectedRows.size === paginatedMembers.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedMembers.map(m => m.id)));
    }
  };

  const exportToCSV = (template: 'scottish' | 'io') => {
    const selectedMembers = selectedRows.size > 0 
      ? members.filter(m => selectedRows.has(m.id))
      : sortedAndFilteredMembers;
    
    alert(`Exporting ${selectedMembers.length} members to ${template === 'scottish' ? 'Scottish Widows' : 'IO Bulk'} template`);
  };

  const copySelectedData = () => {
    const selectedMembers = selectedRows.size > 0 
      ? members.filter(m => selectedRows.has(m.id))
      : sortedAndFilteredMembers;

    const headers = columnOrder.map(col => col.label).join('\t');
    const rows = selectedMembers.map(member => 
      columnOrder.map(col => {
        const value = (member as any)[col.id];
        // Hide PII fields in export
        if (col.type === 'number' && (col.id.includes('salary') || col.id.includes('Salary') || col.id === 'pensionableSalary')) {
          return showSensitiveData ? value : '••••••';
        }
        if (col.id.includes('niNumber') || col.id.includes('NINumber') || col.id === 'niNumber') {
          return showSensitiveData ? value : '••••••••';
        }
        if (col.id === 'schemeRef' || col.id.includes('schemeRef')) {
          return showSensitiveData ? value : '••••••••';
        }
        return value;
      }).join('\t')
    ).join('\n');

    const csvData = `${headers}\n${rows}`;
    navigator.clipboard.writeText(csvData);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
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

  const getCellValue = (member: DatabaseMember, columnId: string) => {
    const value = (member as any)[columnId];
    
    // Hide salary if PII is hidden
    if (typeof value === 'number' && (columnId.includes('salary') || columnId.includes('Salary') || columnId === 'pensionableSalary')) {
      return showSensitiveData ? `£${value.toLocaleString()}` : '£••••••';
    }
    
    // Hide NI number if PII is hidden
    if (columnId.includes('niNumber') || columnId.includes('NINumber') || columnId === 'niNumber') {
      return showSensitiveData ? value : '••••••••';
    }
    
    // Hide scheme ref if PII is hidden
    if (columnId === 'schemeRef' || columnId.includes('schemeRef')) {
      return showSensitiveData ? value : '••••••••';
    }
    
    return value;
  };

  const renderCell = (member: DatabaseMember, column: ColumnDefinition) => {
    const isEditing = editingCell?.rowId === member.id && editingCell?.columnId === column.id;
    const hasError = validationErrors.some(err => err.rowId === member.id && err.columnId === column.id);
    const error = validationErrors.find(err => err.rowId === member.id && err.columnId === column.id);

    if (isEditing && column.editable) {
      const currentValue = (member as any)[column.id];
      
      if (column.type === 'select' && column.options) {
        return (
          <select
            ref={editInputRef as React.RefObject<HTMLSelectElement>}
            defaultValue={currentValue}
            onBlur={(e) => handleCellSave(member.id, column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(member.id, column.id, e.currentTarget.value);
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

      if (column.type === 'checkbox') {
        return (
          <div className="flex justify-center">
            <input
              ref={editInputRef as React.RefObject<HTMLInputElement>}
              type="checkbox"
              checked={!!currentValue}
              onChange={(e) => handleCellSave(member.id, column.id, e.target.checked.toString())}
              className="w-4 h-4 accent-zomi-green"
            />
          </div>
        );
      }

      return (
        <div className="relative">
          <input
            ref={editInputRef as React.RefObject<HTMLInputElement>}
            type={column.type === 'number' ? 'number' : 'text'}
            defaultValue={currentValue}
            onBlur={(e) => handleCellSave(member.id, column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellSave(member.id, column.id, e.currentTarget.value);
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
        onClick={() => handleCellEdit(member.id, column.id)}
        className={`cursor-pointer hover:bg-slate-100 px-2 py-1 rounded ${column.editable ? 'hover:bg-blue-50' : ''} ${hasError ? 'bg-red-50' : ''}`}
      >
        {column.type === 'checkbox' ? (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={!!((member as any)[column.id])}
              onChange={(e) => {
                e.stopPropagation();
                handleCellSave(member.id, column.id, e.target.checked.toString());
              }}
              className="w-4 h-4 accent-zomi-green cursor-pointer"
            />
          </div>
        ) : (
          getCellValue(member, column.id)
        )}
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Databases
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{databaseNames[databaseType]}</h1>
        </div>
        <p className="text-slate-600">Manage and export member information with spreadsheet functionality</p>
      </div>

      {loading && (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zomi-green mx-auto mb-4"></div>
          <p className="text-slate-600">Loading employees...</p>
        </div>
      )}

      {error && (
        <div className="glass-panel rounded-2xl p-6 bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
              placeholder="Search members by name or email..."
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterConfig.status}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
              className="glass-input px-4 py-3 rounded-xl text-slate-900"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={filterConfig.investmentApproach}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, investmentApproach: e.target.value }))}
              className="glass-input px-4 py-3 rounded-xl text-slate-900"
            >
              <option value="">All Approaches</option>
              <option value="Adventurous">Adventurous</option>
              <option value="Cautious">Cautious</option>
            </select>

            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all duration-200"
            >
              {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span className="hidden sm:inline">{showSensitiveData ? 'Hide' : 'Show'} PII</span>
            </button>

            <button
              onClick={copySelectedData}
              className="flex items-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-xl transition-all duration-200"
            >
              {copiedData ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span className="hidden sm:inline">{copiedData ? 'Copied!' : 'Copy Data'}</span>
            </button>
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-zomi-mint/50 rounded-xl mb-4">
            <span className="font-medium text-slate-900">
              {selectedRows.size} member(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV('scottish')}
                className="flex items-center gap-2 px-4 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Scottish Widows
              </button>
              <button
                onClick={() => exportToCSV('io')}
                className="flex items-center gap-2 px-4 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                IO Bulk
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

        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedMembers.length && paginatedMembers.length > 0}
                      onChange={toggleAllRows}
                      className="w-4 h-4 accent-zomi-green"
                    />
                  </th>
                  <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                    {columnOrder.map((column) => (
                      <SortableTableHeader key={column.id} column={column}>
                        <button
                          onClick={() => handleSort(column.id)}
                          className="flex items-center gap-2 hover:text-zomi-green transition-colors"
                          disabled={!column.sortable}
                        >
                          <span>{column.label}</span>
                          {column.sortable && getSortIcon(column.id)}
                        </button>
                      </SortableTableHeader>
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 hover:bg-white/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(member.id)}
                        onChange={() => toggleRowSelection(member.id)}
                        className="w-4 h-4 accent-zomi-green"
                      />
                    </td>
                    {columnOrder.map((column) => (
                      <td key={column.id} className="p-4 text-sm text-slate-600 relative">
                        {renderCell(member, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, sortedAndFilteredMembers.length)} of {sortedAndFilteredMembers.length} members
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
      </div>
      )}
    </div>
  );
};