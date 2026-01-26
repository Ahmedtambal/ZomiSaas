import React, { useState, useEffect } from 'react';
import { getFormByToken, submitFormByToken } from '../../services/formService';
import { FormDefinition } from '../../types/forms';

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
        
        // Check if token is still valid
        if (data.token_info.expires_at && new Date(data.token_info.expires_at) < new Date()) {
          setError('This form link has expired');
          return;
        }
        
        if (data.token_info.max_submissions && 
            data.token_info.submission_count >= data.token_info.max_submissions) {
          setError('This form has reached its submission limit');
          return;
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load form');
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
    const commonClasses = "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500";
    const hasError = !!errors[field.name];
    const errorClasses = hasError ? "border-red-500 ring-2 ring-red-500/50" : "";

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-white font-medium">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${commonClasses} ${errorClasses}`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {hasError && <p className="text-red-400 text-sm">{errors[field.name]}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-white font-medium">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`${commonClasses} ${errorClasses} resize-none`}
            />
            {hasError && <p className="text-red-400 text-sm">{errors[field.name]}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500"
            />
            <label className="text-white">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            {hasError && <p className="text-red-400 text-sm ml-8">{errors[field.name]}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-white font-medium">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              className={`${commonClasses} ${errorClasses}`}
            />
            {hasError && <p className="text-red-400 text-sm">{errors[field.name]}</p>}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Form Unavailable</h2>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Submission Successful!</h2>
          <p className="text-white/60 mb-4">
            Your form has been submitted successfully.
          </p>
          <p className="text-white/40 text-sm">
            Submission ID: {submissionId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{form?.name}</h1>
              {form?.description && (
                <p className="text-white/60">{form.description}</p>
              )}
              {company && (
                <p className="text-white/80 mt-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {company.name}
                </p>
              )}
            </div>
            {tokenInfo && (
              <div className="text-right">
                {tokenInfo.max_submissions && (
                  <p className="text-white/60 text-sm">
                    {tokenInfo.submission_count} / {tokenInfo.max_submissions} submissions
                  </p>
                )}
                {tokenInfo.expires_at && (
                  <p className="text-white/60 text-sm">
                    Expires: {new Date(tokenInfo.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {form?.formData?.fields?.map(renderField)}
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-white/40 text-sm">
          <p>Powered by Zomi Wealth Portal</p>
        </div>
      </div>
    </div>
  );
};
