import React, { useState, useEffect } from 'react';
import { CheckCircle, Building2, Calendar, Users, AlertCircle } from 'lucide-react';
import { getFormByToken, submitFormByToken } from '../../services/formService';
import { FormDefinition } from '../../types/forms';
import SearchableSelect from './SearchableSelect';

interface TokenInfo {
  max_submissions: number | null;
  submission_count: number;
  expires_at: string | null;
}

interface Company {
  name: string;
  id: string;
}

interface PublicFormViewProps {
  token: string;
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  useEffect(() => {
    const loadForm = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await getFormByToken(token);
        setForm(data.form);
        setCompany(data.company);
        setTokenInfo(data.token_info);
        
        // Check if token is still valid (30-minute expiry)
        if (data.token_info.expires_at && new Date(data.token_info.expires_at) < new Date()) {
          setError('This form link has expired. Please request a new link from WhiteLeaf Team.');
          return;
        }
        
        if (data.token_info.max_submissions && 
            data.token_info.submission_count >= data.token_info.max_submissions) {
          setError('This form has reached its submission limit. Please request a new link from your administrator.');
          return;
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to load form';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [token]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    const newErrors: Record<string, string> = {};
    const fields = form.formData?.fields || [];

    fields.forEach((field: any) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.pattern && formData[field.name]) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(formData[field.name])) {
          newErrors[field.name] = `Invalid format for ${field.label}`;
        }
      }

      if (field.min !== undefined && formData[field.name] < field.min) {
        newErrors[field.name] = `${field.label} must be at least ${field.min}`;
      }

      if (field.max !== undefined && formData[field.name] > field.max) {
        newErrors[field.name] = `${field.label} must be at most ${field.max}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await submitFormByToken(token, formData);
      setSubmissionId(result.submission_id);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const baseInputClasses = "w-full bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#38b000] focus:border-transparent transition-all";
    const hasError = !!errors[field.name];
    const errorClasses = hasError ? "border-red-500 ring-2 ring-red-500/50" : "";

    switch (field.type) {
      case 'searchable-select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-gray-800 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <SearchableSelect
              options={field.options || []}
              value={formData[field.name] || ''}
              onChange={(value) => handleInputChange(field.name, value)}
              placeholder={`Select ${field.label}`}
              required={field.required}
            />
            {hasError && <p className="text-red-600 text-sm flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-gray-800 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${baseInputClasses} ${errorClasses}`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && <p className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-gray-800 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`${baseInputClasses} ${errorClasses} resize-none`}
            />
            {hasError && <p className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#38b000] focus:ring-2 focus:ring-[#38b000]"
            />
            <label className="text-gray-800">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {hasError && <p className="text-red-600 text-sm ml-8 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );

      case 'multi-select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-gray-800 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3">
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`${field.name}-${option}`}
                    checked={(formData[field.name] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = formData[field.name] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleInputChange(field.name, newValues);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-[#38b000] focus:ring-2 focus:ring-[#38b000]"
                  />
                  <label htmlFor={`${field.name}-${option}`} className="text-gray-800 cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );


      default:
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-gray-800 font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className={`${baseInputClasses} ${errorClasses}`}
            />
            {hasError && <p className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors[field.name]}</p>}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefae0] to-white flex items-center justify-center p-6 font-['Inter',_'Roboto',_sans-serif]">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg border border-white/40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#38b000] mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg font-medium">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefae0] to-white flex items-center justify-center p-6 font-['Inter',_'Roboto',_sans-serif]">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-white/40">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Unavailable</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fefae0] to-white flex items-center justify-center p-6 font-['Inter',_'Roboto',_sans-serif]">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-white/40">
          <div className="w-20 h-20 bg-[#c7f9cc] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-[#38b000]" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Submission Successful!</h2>
          <p className="text-gray-700 mb-4 text-lg">
            Your form has been submitted successfully.
          </p>
          <p className="text-gray-600 text-sm font-mono bg-gray-100 px-4 py-2 rounded-lg">
            ID: {submissionId}
          </p>
        </div>
      </div>
    );
  }

  // Helper function to format expiry time
  const formatExpiryTime = (expiresAt: string): string => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // If less than 1 day away, show relative time
    if (diffDays === 0) {
      if (diffHours > 0) {
        return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else if (diffMins > 0) {
        return `Expires in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
      } else {
        return 'Expires soon';
      }
    }
    // Otherwise show date
    return `Expires: ${expiryDate.toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefae0] to-white p-6 font-['Inter',_'Roboto',_sans-serif]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 mb-6 shadow-lg border border-white/40">
          {/* Logo and Privacy Notice */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/whiteleaf%20group/whiteleaf.png"
              alt="WhiteLeaf"
              className="w-56 max-w-full h-auto mb-4"
              loading="eager"
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.src = '/whiteleaf%20group/Whiteleaf%20Logo%20-%20New.png';
              }}
            />
            <div className="text-center text-sm text-gray-700 space-y-2 max-w-2xl">
              <p className="font-medium">Please complete with the employee details and the change so we can update our records</p>
              <p className="text-gray-600 text-xs">When you submit this form, it will not automatically collect your details like name and email address unless you provide it yourself.</p>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{form?.name}</h1>
              {form?.description && (
                <p className="text-gray-700 text-lg leading-relaxed">{form.description}</p>
              )}
              {company && (
                <div className="mt-4 flex items-center gap-2 text-gray-800 bg-[#c7f9cc]/40 px-4 py-2 rounded-lg inline-flex">
                  <Building2 className="w-5 h-5 text-[#38b000]" />
                  <span className="font-medium">{company.name}</span>
                </div>
              )}
            </div>
            {tokenInfo && (
              <div className="text-right ml-4">
                {tokenInfo.max_submissions && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
                    <Users className="w-4 h-4" />
                    <span>{tokenInfo.submission_count} / {tokenInfo.max_submissions} submissions</span>
                  </div>
                )}
                {tokenInfo.expires_at && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatExpiryTime(tokenInfo.expires_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/40">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {((form as any)?.form_data?.fields || form?.formData?.fields)?.map((field: any) => {
              // Hide otherReason field unless "Other" is selected in changeType
              if (field.name === 'otherReason') {
                const changeTypeValues = formData['changeType'] || [];
                if (!changeTypeValues.includes('Other')) {
                  return null;
                }
              }
              
              // Hide newName field unless "Change of Name" is selected in changeType
              if (field.name === 'newName') {
                const changeTypeValues = formData['changeType'] || [];
                if (!changeTypeValues.includes('Change of Name')) {
                  return null;
                }
              }
              
              // Hide newAddress field unless "Change of Address" is selected in changeType
              if (field.name === 'newAddress') {
                const changeTypeValues = formData['changeType'] || [];
                if (!changeTypeValues.includes('Change of Address')) {
                  return null;
                }
              }
              
              // Hide newSalary field unless "Change of Salary" is selected in changeType
              if (field.name === 'newSalary') {
                const changeTypeValues = formData['changeType'] || [];
                if (!changeTypeValues.includes('Change of Salary')) {
                  return null;
                }
              }
              
              // Hide newEmployeeContribution field unless updateEmployeeContribution checkbox is checked
              if (field.name === 'newEmployeeContribution') {
                if (!formData['updateEmployeeContribution']) {
                  return null;
                }
              }
              
              return renderField(field);
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-[#38b000] hover:bg-[#2d8c00] text-white text-lg font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Form
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>Powered by WhiteLeaf</p>
        </div>
      </div>
    </div>
  );
};
