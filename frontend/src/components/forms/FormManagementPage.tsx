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
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
    { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { name: 'nationalInsuranceNumber', label: 'National Insurance Number', type: 'text', required: true },
    { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
    { name: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
    { name: 'town', label: 'Town', type: 'text', required: true },
    { name: 'county', label: 'County', type: 'text', required: false },
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zomisaasbackend.onrender.com'}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
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
        description: 'Form for onboarding new employees with all required information',
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
      
      // Copy to clipboard
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(token.token);
      setTimeout(() => setCopiedLink(null), 3000);
      
      alert(`Link generated and copied to clipboard!\n\n${publicUrl}`);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Form Management</h2>
          <p className="text-white/60">Create forms and generate shareable links</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={createSWEmployeeForm}
            className="px-5 py-2.5 bg-gradient-to-r from-zomi-green to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium shadow-lg shadow-zomi-green/25"
          >
            <Plus className="w-5 h-5" />
            Create SW Employee Form
          </button>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-5 py-2.5 glass-panel text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 font-medium"
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
        <div className="glass-panel rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-zomi-green/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-zomi-green/30">
            <svg className="w-10 h-10 text-zomi-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No forms yet</h3>
          <p className="text-white/60 mb-6">Create your first form to get started</p>
          <button
            onClick={createSWEmployeeForm}
            className="px-6 py-3 bg-gradient-to-r from-zomi-green to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 font-medium shadow-lg shadow-zomi-green/25"
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
              className="glass-panel rounded-xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold text-xl">{form.name}</h3>
                    {form.templateType === 'sw_new_employee' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                        SW New Employee
                      </span>
                    )}
                  </div>
                  {form.description && (
                    <p className="text-white/70 mb-3">{form.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-white/50 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'Recently created'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-zomi-green" />
                      <span className="text-white/70">{form.formData?.fields?.length || 0} fields</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete form"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Generate Link Section */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <h4 className="text-white/90 font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-zomi-green" />
                  Generate Shareable Link
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    className="flex-1 glass-panel rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-zomi-green/50 appearance-none cursor-pointer bg-slate-900/50"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleGenerateLink(form.id, e.target.value);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select company to generate link...</option>
                    {(companies || []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelectedFormForLinks(form.id)}
                    className="px-4 py-2.5 glass-panel text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Links
                  </button>
                </div>
                {copiedLink && (
                  <div className="mt-3 flex items-center gap-2 text-zomi-green text-sm bg-zomi-green/10 px-3 py-2 rounded-lg border border-zomi-green/20">
                    <CheckCircle className="w-4 h-4" />
                    Link copied to clipboard!
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
