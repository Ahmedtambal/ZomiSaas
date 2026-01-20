export type FormFieldType = 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';

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
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  ipAddress?: string;
}

export interface GeneratedLink {
  id: string;
  formId: string;
  url: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  accessCount: number;
}