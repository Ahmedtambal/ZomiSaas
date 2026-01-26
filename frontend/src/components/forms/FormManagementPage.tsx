import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Eye, Trash2, Calendar, Users, CheckCircle } from 'lucide-react';
import { FormBuilder } from './FormBuilder';
import { FormDefinition } from '../../types/forms';
import { getForms, createForm, deleteForm, generateToken, getTokens } from '../../services/formService';

// Pre-defined SW New Employee Form Template
const SW_NEW_EMPLOYEE_TEMPLATE = {
  fields: [
    { name: 'title', label: 'Title', type: 'select', required: true, options: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] },
    { name: 'forename', label: 'Forename', type: 'text', required: true },
    { name: 'surname', label: 'Surname', type: 'text', required: true },
    { name: 'nationalInsuranceNumber', label: 'NI Number', type: 'text', required: true },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
    { name: 'gender', label: 'Sex', type: 'select', required: true, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { name: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Partnership'] },
    { name: 'addressLine1', label: 'Address 1', type: 'text', required: true },
    { name: 'addressLine2', label: 'Address 2', type: 'text', required: false },
    { name: 'addressLine3', label: 'Address 3', type: 'text', required: false },
    { name: 'addressLine4', label: 'Address 4', type: 'text', required: false },
    { name: 'postcode', label: 'Postcode', type: 'text', required: true },
    { name: 'ukResident', label: 'UK Resident', type: 'select', required: true, options: ['Yes', 'No'] },
    { name: 'nationality', label: 'Nationality', type: 'text', required: true },
    { name: 'salary', label: 'Salary', type: 'number', required: true },
    { name: 'employmentStartDate', label: 'Employment Start Date', type: 'date', required: true },
    { name: 'selectedRetirementAge', label: 'Selected Retirement Age', type: 'number', required: true },
    { name: 'sectionNumber', label: 'Section Number', type: 'text', required: false },
    { name: 'pensionInvestmentApproach', label: 'Pension Investment Approach', type: 'select', required: true, options: ['Conservative', 'Moderate', 'Aggressive'] },
  ]
};

interface Company {
  id: string;
  name: string;
}

export const FormManagementPage: React.FC = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<FormDefinition | null>(null);
  const [selectedFormForLinks, setSelectedFormForLinks] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadForms();
    loadCompanies();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await getForms();
      setForms(data);
    } catch (err) {
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = import.meta.env.VITE_API_URL || 'https://zomisaasbackend.onrender.com';
      const response = await fetch(`${API_URL}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Companies API response:', data); // Debug log
        console.log('Companies array:', Array.isArray(data) ? data : []);
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('Failed to load companies:', response.status, errorText);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const createSWEmployeeForm = async () => {
    try {
      setLoading(true);
      const newForm = await createForm({
        name: 'SW New Employee Form',
        description: 'Complete employee onboarding form with all required information including personal details, address, and employment data',
        form_data: SW_NEW_EMPLOYEE_TEMPLATE,
        template_type: 'sw_new_employee',
      });
      await loadForms();
      alert('SW New Employee Form created successfully!');
    } catch (err) {
      console.error('Failed to create form:', err);
      alert('Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      await deleteForm(formId);
      await loadForms();
    } catch (err) {
      alert('Failed to delete form');
    }
  };

  const handleGenerateLink = async (formId: string, companyId: string) => {
    try {
      setGeneratingLink(true);
      const token = await generateToken(formId, {
        company_id: companyId,
        expiry_days: 30,
        max_submissions: null,
      });
      
      const publicUrl = `${window.location.origin}/public/form/${token.token}`;
      
      // Store the generated link
      setGeneratedLinks(prev => ({ ...prev, [formId]: publicUrl }));
      
      // Copy to clipboard
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(formId);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (err) {
      console.error('Failed to generate link:', err);
      alert('Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const saveForm = (formDef: FormDefinition) => {
    // Save logic here - would call createForm or updateForm API
    setShowBuilder(false);
    setEditingForm(null);
    loadForms();
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {editingForm ? 'Edit Form' : 'Create New Form'}
          </h2>
          <button
            onClick={() => {
              setShowBuilder(false);
              setEditingForm(null);
            }}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
        <FormBuilder
          formDefinition={editingForm}
          onSave={saveForm}
          onCancel={() => {
            setShowBuilder(false);
            setEditingForm(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Inter',_'Roboto',_sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Form Management</h2>
          <p className="text-white/60">Create forms and generate shareable links for companies</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={createSWEmployeeForm}
            className="px-5 py-2.5 bg-zomi-green text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create SW Employee Form
          </button>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-5 py-2.5 bg-zomi-green text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Custom Form
          </button>
        </div>
      </div>

      {/* Forms List */}
      {loading ? (
        <div className="glass-panel rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zomi-green mx-auto mb-4"></div>
          <p className="text-white/60">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <div className="w-20 h-20 bg-zomi-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-zomi-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-gray-900 text-xl font-semibold mb-2">No forms yet</h3>
          <p className="text-gray-600 mb-6">Create your first form to get started</p>
          <button
            onClick={createSWEmployeeForm}
            className="px-6 py-3 bg-zomi-green text-white rounded-lg hover:bg-emerald-600 transition-colors inline-flex items-center gap-2 font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create SW Employee Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {(forms || []).map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 font-semibold text-xl">{form.name || 'Untitled Form'}</h3>
                    {form.templateType === 'sw_new_employee' && (
                      <span className="px-3 py-1 bg-zomi-green/10 text-zomi-green rounded-full text-xs font-medium border border-zomi-green/20">
                        SW New Employee
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-gray-600 mb-3 leading-relaxed">{form.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'Recently created'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-zomi-green" />
                      <span className="text-gray-700 font-medium">{form.formData?.fields?.length || 0} fields</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete form"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Generate Link Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-gray-900 font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-zomi-green" />
                  Generate Shareable Link
                  {companies.length > 0 && (
                    <span className="text-xs text-gray-500 font-normal">({companies.length} companies)</span>
                  )}
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-zomi-green focus:border-transparent appearance-none cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleGenerateLink(form.id, e.target.value);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {companies.length === 0 ? 'No companies available - Add companies first' : 'Select company to generate link...'}
                    </option>
                    {(companies || []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedFormForLinks(form.id)}
                    className="px-4 py-2.5 bg-zomi-green text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    View Links
                  </button>
                </div>
                {generatedLinks[form.id] && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Generated Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedLinks[form.id]}
                        readOnly
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm font-mono"
                      />
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(generatedLinks[form.id]);
                          setCopiedLink(form.id);
                          setTimeout(() => setCopiedLink(null), 2000);
                        }}
                        className="px-4 py-2.5 bg-zomi-green text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium shadow-md"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedLink === form.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
