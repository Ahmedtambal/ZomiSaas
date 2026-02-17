export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'date-range' | 'select' | 'searchable-select' | 'multi-select' | 'textarea' | 'checkbox' | 'radio' | 'file';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  customMessage?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  validation: ValidationRule;
  order: number;
  conditionalLogic?: {
    showIf?: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: string | number;
    };
  };
  fileConfig?: {
    maxSize?: number; // in MB
    allowedTypes?: string[]; // e.g., ['image/*', 'application/pdf']
    multiple?: boolean;
  };
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  formData?: {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
      pattern?: string;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }>;
  };
  // Backend returns snake_case
  form_data?: {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
      pattern?: string;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }>;
  };
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  // Database fields
  organizationId?: string;
  createdByUserId?: string;
  templateType?: 'custom' | 'sw_new_employee' | 'io_upload' | 'new_employee_upload' | 'change_information_upload';
  template_type?: 'custom' | 'sw_new_employee' | 'io_upload' | 'new_employee_upload' | 'change_information_upload'; // Backend returns snake_case
  linkedCompanyId?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  ipAddress?: string;
  organizationId?: string;
  processingStatus?: string;
  matchedCompanyId?: string;
}

export interface FormToken {
  id: string;
  formId: string;
  companyId: string;
  organizationId: string;
  token: string;
  url: string;
  expiresAt: string | null;
  maxSubmissions: number | null;
  submissionCount: number;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
}

// Legacy interface for backward compatibility
export interface GeneratedLink {
  id: string;
  formId: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  accessCount: number;
}