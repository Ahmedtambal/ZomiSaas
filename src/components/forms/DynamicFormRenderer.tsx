import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import { FormDefinition, FormField, FormSubmission } from '../../types/forms';

interface DynamicFormRendererProps {
  formId: string;
  onSubmit?: (submission: FormSubmission) => void;
}

interface FormErrors {
  [fieldId: string]: string;
}

interface FormData {
  [fieldId: string]: any;
}

export const DynamicFormRenderer = ({ formId, onSubmit }: DynamicFormRendererProps) => {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load form definition from localStorage
    const savedForms = localStorage.getItem('zomi_forms');
    if (savedForms) {
      const forms: FormDefinition[] = JSON.parse(savedForms);
      const foundForm = forms.find(f => f.id === formId && f.isActive);
      setForm(foundForm || null);
    }
    setLoading(false);
  }, [formId]);

  const validateField = (field: FormField, value: any): string | null => {
    const { validation } = field;

    // Required validation
    if (validation.required) {
      if (field.type === 'checkbox' && !value) {
        return validation.customMessage || `${field.label} is required`;
      }
      if (field.type !== 'checkbox' && (!value || value.toString().trim() === '')) {
        return validation.customMessage || `${field.label} is required`;
      }
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    const stringValue = value.toString();

    // Email validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return validation.customMessage || 'Please enter a valid email address';
      }
    }

    // Number validation
    if (field.type === 'number') {
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue)) {
        return validation.customMessage || 'Please enter a valid number';
      }
      if (validation.min !== undefined && numValue < validation.min) {
        return validation.customMessage || `Value must be at least ${validation.min}`;
      }
      if (validation.max !== undefined && numValue > validation.max) {
        return validation.customMessage || `Value must be no more than ${validation.max}`;
      }
    }

    // Length validation for text fields
    if (field.type === 'text' || field.type === 'textarea') {
      if (validation.minLength && stringValue.length < validation.minLength) {
        return validation.customMessage || `Must be at least ${validation.minLength} characters`;
      }
      if (validation.maxLength && stringValue.length > validation.maxLength) {
        return validation.customMessage || `Must be no more than ${validation.maxLength} characters`;
      }
    }

    // Pattern validation
    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(stringValue)) {
          return validation.customMessage || 'Invalid format';
        }
      } catch (e) {
        console.warn('Invalid regex pattern:', validation.pattern);
      }
    }

    return null;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    const newErrors: FormErrors = {};

    // Validate all fields
    form.fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const submission: FormSubmission = {
      id: `submission_${Date.now()}`,
      formId: form.id,
      data: formData,
      submittedAt: new Date().toISOString(),
    };

    // Save submission to localStorage
    const savedSubmissions = localStorage.getItem('zomi_form_submissions');
    const submissions: FormSubmission[] = savedSubmissions ? JSON.parse(savedSubmissions) : [];
    submissions.push(submission);
    localStorage.setItem('zomi_form_submissions', JSON.stringify(submissions));

    if (onSubmit) {
      onSubmit(submission);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];
    const hasError = !!error;

    const baseInputClasses = `
      w-full px-4 py-3 rounded-xl border transition-all duration-200
      ${hasError 
        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
        : 'border-slate-300 bg-white focus:border-zomi-green focus:ring-zomi-green/20'
      }
      focus:outline-none focus:ring-4
    `;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClasses} h-24 resize-none`}
              rows={4}
            />
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.validation.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={field.id}
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-zomi-green"
              />
              <div className="flex-1">
                <label htmlFor={field.id} className="text-sm font-medium text-slate-700 cursor-pointer">
                  {field.label}
                  {field.validation.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.placeholder && (
                  <p className="text-sm text-slate-500 mt-1">{field.placeholder}</p>
                )}
              </div>
            </div>
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.validation.options?.map((option) => (
                <div key={option} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`${field.id}_${option}`}
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-4 h-4 accent-zomi-green"
                  />
                  <label htmlFor={`${field.id}_${option}`} className="text-sm text-slate-700 cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.validation.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={baseInputClasses}
            />
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8">
          <div className="w-12 h-12 border-4 border-zomi-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Form Not Found</h1>
          <p className="text-slate-600">
            The form you're looking for doesn't exist or has been deactivated.
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-zomi-green mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600 mb-6">
            Your form has been submitted successfully. We'll be in touch soon.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({});
              setErrors({});
            }}
            className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-slate-600">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields
              .sort((a, b) => a.order - b.order)
              .map(renderField)}

            <div className="pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Form
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};