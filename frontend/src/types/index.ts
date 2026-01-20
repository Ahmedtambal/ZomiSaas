export type UserRole = 'Admin' | 'Member';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  dateOfBirth?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  niNumber: string;
  dateOfBirth: string;
  pensionableSalary: number;
  nationality: string;
  maritalStatus: string;
  investmentApproach: 'Adventurous' | 'Cautious';
  selectedRetirementAge: number;
  status: 'Active' | 'Pending' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface InviteCode {
  id: string;
  code: string;
  isUsed: boolean;
  createdBy: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: string;
}

export interface ColumnDefinition {
  id: string;
  label: string;
  sortable: boolean;
  editable: boolean;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox';
  options?: string[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
}

export const IO_UPLOAD_COLUMNS: ColumnDefinition[] = [
  { id: 'id', label: 'ID', sortable: true, editable: false, type: 'text' },
  
  // New Employee Details (from New Employee database)
  { id: 'title', label: 'Title', sortable: true, editable: true, type: 'select', options: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] },
  { id: 'forename', label: 'Forename*', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'surname', label: 'Surname*', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'niNumber', label: 'NINumber', sortable: true, editable: true, type: 'text', validation: { pattern: '^[A-Z]{2}[0-9]{6}[A-Z]$', customMessage: 'NI Number format: AB123456C' } },
  { id: 'dateOfBirth', label: 'Date of Birth*', sortable: true, editable: true, type: 'date', validation: { required: true } },
  { id: 'sex', label: 'Sex', sortable: true, editable: true, type: 'select', options: ['Male', 'Female'] },
  { id: 'maritalStatus', label: 'Marital Status', sortable: true, editable: true, type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Partnership'] },
  { id: 'address1', label: 'Address 1', sortable: true, editable: true, type: 'text' },
  { id: 'address2', label: 'Address 2', sortable: true, editable: true, type: 'text' },
  { id: 'address3', label: 'Address 3', sortable: true, editable: true, type: 'text' },
  { id: 'address4', label: 'Address 4', sortable: true, editable: true, type: 'text' },
  { id: 'postcode', label: 'Postcode', sortable: true, editable: true, type: 'text' },
  { id: 'ukResident', label: 'UK Resident', sortable: true, editable: true, type: 'checkbox' },
  { id: 'nationality', label: 'Nationality', sortable: true, editable: true, type: 'select', options: ['British', 'Irish', 'American', 'Canadian', 'Australian', 'Other'] },
  { id: 'salary', label: 'Salary', sortable: true, editable: true, type: 'number', validation: { min: 0, max: 1000000 } },
  { id: 'employmentStartDate', label: 'Employment Start Date', sortable: true, editable: true, type: 'date' },
  { id: 'selectedRetirementAge', label: 'Selected Retirement Age', sortable: true, editable: true, type: 'number', validation: { min: 50, max: 75 } },
  { id: 'sectionNumber', label: 'Section Number', sortable: true, editable: true, type: 'text' },
  { id: 'pensionInvestmentApproach', label: 'Pension Investment Approach', sortable: true, editable: true, type: 'select', options: ['Adventurous', 'Cautious'] },
  
  // Additional IO Upload Fields
  { id: 'schemeRef', label: 'SchemeRef*', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'categoryName', label: 'Category Name', sortable: true, editable: true, type: 'select', options: ['Employee', 'Director', 'Contractor'] },
  { id: 'adviceType', label: 'Advice Type*', sortable: true, editable: true, type: 'select', options: ['Independent', 'Restricted', 'Execution Only'], validation: { required: true } },
  { id: 'sellingAdviserId', label: 'Selling Adviser ID*', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'providerRoute', label: 'Provider Route', sortable: true, editable: true, type: 'select', options: ['Royal London', 'Scottish Widows', 'Aviva', 'Legal & General', 'Standard Life'] },
  { id: 'pensionStartingDate', label: 'Pension Starting Date', sortable: true, editable: true, type: 'date' },
  
  // Team Members Columns (Checkboxes)
  { id: 'ioUploadStatus', label: 'IO Upload Status', sortable: true, editable: true, type: 'checkbox' },
  { id: 'pensionPack', label: 'Pension Pack', sortable: true, editable: true, type: 'checkbox' },
  { id: 'providerStatus', label: 'Provider Status', sortable: true, editable: true, type: 'checkbox' },
  
  // Financial Tracking
  { id: 'invoiced', label: 'Invoiced', sortable: true, editable: true, type: 'checkbox' },
  { id: 'contributionsUploaded', label: 'Contributions Uploaded', sortable: true, editable: true, type: 'checkbox' },
  
  // Group Risk/PMI Actions
  { id: 'glCover', label: 'GL Cover', sortable: true, editable: true, type: 'checkbox' },
  { id: 'gipCover', label: 'GIP Cover', sortable: true, editable: true, type: 'checkbox' },
  { id: 'gciCover', label: 'GCI Cover', sortable: true, editable: true, type: 'checkbox' },
  { id: 'bupaCover', label: 'Bupa Cover', sortable: true, editable: true, type: 'checkbox' },
];

export const NEW_EMPLOYEE_UPLOAD_COLUMNS: ColumnDefinition[] = [
  { id: 'id', label: 'ID', sortable: true, editable: false, type: 'text' },
  { id: 'title', label: 'Title', sortable: true, editable: true, type: 'select', options: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] },
  { id: 'forename', label: 'Forename', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'surname', label: 'Surname', sortable: true, editable: true, type: 'text', validation: { required: true } },
  { id: 'niNumber', label: 'NI Number', sortable: true, editable: true, type: 'text', validation: { pattern: '^[A-Z]{2}[0-9]{6}[A-Z]$', customMessage: 'NI Number format: AB123456C' } },
  { id: 'dateOfBirth', label: 'Date of Birth', sortable: true, editable: true, type: 'date', validation: { required: true } },
  { id: 'sex', label: 'Sex', sortable: true, editable: true, type: 'select', options: ['Male', 'Female'] },
  { id: 'maritalStatus', label: 'Marital Status', sortable: true, editable: true, type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Partnership'] },
  { id: 'address1', label: 'Address 1', sortable: true, editable: true, type: 'text' },
  { id: 'address2', label: 'Address 2', sortable: true, editable: true, type: 'text' },
  { id: 'address3', label: 'Address 3', sortable: true, editable: true, type: 'text' },
  { id: 'address4', label: 'Address 4', sortable: true, editable: true, type: 'text' },
  { id: 'postcode', label: 'Postcode', sortable: true, editable: true, type: 'text' },
  { id: 'ukResident', label: 'UK Resident', sortable: true, editable: true, type: 'checkbox' },
  { id: 'nationality', label: 'Nationality', sortable: true, editable: true, type: 'select', options: ['British', 'Irish', 'American', 'Canadian', 'Australian', 'Other'] },
  { id: 'salary', label: 'Salary', sortable: true, editable: true, type: 'number', validation: { min: 0, max: 1000000 } },
  { id: 'employmentStartDate', label: 'Employment Start Date', sortable: true, editable: true, type: 'date' },
  { id: 'selectedRetirementAge', label: 'Selected Retirement Age', sortable: true, editable: true, type: 'number', validation: { min: 50, max: 75 } },
  { id: 'sectionNumber', label: 'Section number', sortable: true, editable: true, type: 'text' },
  { id: 'pensionInvestmentApproach', label: 'Pension Investment Approach', sortable: true, editable: true, type: 'select', options: ['Adventurous', 'Cautious'] },
];

export type DatabaseType = 'ioUpload' | 'newEmployeeUpload';

export interface DatabaseMember {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Allow dynamic properties based on column definitions
}