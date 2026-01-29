import React, { useState, useEffect } from 'react';
import { getForms, deleteForm } from '../../services/formService';
import { FormDefinition } from '../../types/forms';
import { FormTokenManager } from './FormTokenManager';
import { useNotification } from '../../context/NotificationContext';

interface FormsListPageProps {
  onCreateNewForm?: () => void;
}

export const FormsListPage: React.FC<FormsListPageProps> = ({ onCreateNewForm }) => {
  const { notify } = useNotification();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sw_new_employee' | 'custom'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadForms();
  }, [filter]);

  const loadForms = async () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { templateType: filter };
      const data = await getForms(filters);
      setForms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load forms');
      console.error('Failed to load forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    notify({
      type: 'warning',
      title: 'Delete form?',
      description: 'This action cannot be undone',
      duration: 10000,
      actions: [
        {
          label: 'Confirm Delete',
          onClick: async () => {
            try {
              await deleteForm(formId);
              setForms(prev => prev.filter(f => f.id !== formId));
              if (selectedFormId === formId) {
                setSelectedFormId(null);
              }
              notify({
                type: 'success',
                title: 'Form deleted',
                description: 'Form deleted successfully',
              });
            } catch (err) {
              notify({
                type: 'error',
                title: 'Delete failed',
                description: 'Failed to delete form',
              });
              console.error('Failed to delete form:', err);
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

  const getTemplateBadge = (templateType: string) => {
    switch (templateType) {
      case 'sw_new_employee':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">SW New Employee</span>;
      case 'io_upload':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">IO Upload</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Custom</span>;
    }
  };

  if (selectedFormId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedFormId(null)}
          className="text-white/60 hover:text-white flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Forms
        </button>
        <FormTokenManager formId={selectedFormId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Forms</h1>
          <p className="text-white/60">Manage your form templates and links</p>
        </div>
        <button
          onClick={onCreateNewForm}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create SW Form
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/10 backdrop-blur-lg rounded-lg p-1">
        {(['all', 'sw_new_employee', 'custom'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'All' : f === 'sw_new_employee' ? 'SW Forms' : 'Custom'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Forms List */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-white/60 mb-2">No forms found</p>
          <p className="text-white/40 text-sm">Create your first form to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(forms || []).map((form) => (
            <div
              key={form.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">{form.name}</h3>
                  {form.description && (
                    <p className="text-white/60 text-sm mb-3">{form.description}</p>
                  )}
                  {getTemplateBadge(form.templateType || 'custom')}
                </div>
              </div>

              <div className="space-y-2 text-sm text-white/60 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(form.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {form.formData?.fields?.length || 0} fields
                </div>
                {form.isActive ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Active
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Inactive
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/20">
                <button
                  onClick={() => setSelectedFormId(form.id)}
                  className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Manage Links
                </button>
                <button
                  onClick={() => handleDelete(form.id)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
