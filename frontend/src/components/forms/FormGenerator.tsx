import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Eye, Trash2, Copy, CheckCircle, Calendar, Users, ExternalLink } from 'lucide-react';
import { FormDefinition, GeneratedLink } from '../../types/forms';
import { FormBuilder } from './FormBuilder';

export const FormGenerator = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Load forms and links from localStorage on component mount
  useEffect(() => {
    const savedForms = localStorage.getItem('zomi_forms');
    if (savedForms) {
      setForms(JSON.parse(savedForms));
    }

    const savedLinks = localStorage.getItem('zomi_generated_links');
    if (savedLinks) {
      setGeneratedLinks(JSON.parse(savedLinks));
    }
  }, []);

  // Save forms to localStorage whenever forms state changes
  useEffect(() => {
    localStorage.setItem('zomi_forms', JSON.stringify(forms));
  }, [forms]);

  // Save links to localStorage whenever links state changes
  useEffect(() => {
    localStorage.setItem('zomi_generated_links', JSON.stringify(generatedLinks));
  }, [generatedLinks]);

  const saveForm = (form: FormDefinition) => {
    setForms(prev => {
      const existingIndex = prev.findIndex(f => f.id === form.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = form;
        return updated;
      } else {
        return [...prev, form];
      }
    });
    setActiveFormId(null);
  };

  const deleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      setForms(prev => prev.filter(f => f.id !== formId));
      // Also remove any generated links for this form
      setGeneratedLinks(prev => prev.filter(link => link.formId !== formId));
    }
  };

  const generateLink = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const linkId = `link_${Date.now()}`;
    const newLink: GeneratedLink = {
      id: linkId,
      formId: formId,
      url: `${window.location.origin}/form/${formId}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true,
      accessCount: 0,
    };

    setGeneratedLinks(prev => [newLink, ...prev]);
  };

  const copyLink = (link: GeneratedLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedLinkId(link.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const toggleFormStatus = (formId: string) => {
    setForms(prev => prev.map(form => 
      form.id === formId 
        ? { ...form, isActive: !form.isActive, updatedAt: new Date().toISOString() }
        : form
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFormSubmissionCount = (formId: string) => {
    const savedSubmissions = localStorage.getItem('zomi_form_submissions');
    if (!savedSubmissions) return 0;
    
    const submissions = JSON.parse(savedSubmissions);
    return submissions.filter((sub: any) => sub.formId === formId).length;
  };

  // If editing/creating a form, show the FormBuilder
  if (activeFormId) {
    const formToEdit = forms.find(f => f.id === activeFormId);
    return (
      <FormBuilder
        formDefinition={formToEdit || null}
        onSave={saveForm}
        onCancel={() => setActiveFormId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Form Generator</h1>
          <p className="text-slate-600">Create, manage, and deploy custom forms with validation</p>
        </div>
        <button
          onClick={() => setActiveFormId(`form_${Date.now()}`)}
          className="flex items-center gap-2 px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Create New Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-zomi-mint rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-zomi-green" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">No Forms Created Yet</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Get started by creating your first custom form. Add fields, set validation rules, and generate secure links for your clients.
          </p>
          <button
            onClick={() => setActiveFormId(`form_${Date.now()}`)}
            className="px-8 py-4 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Your Forms</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {forms.map((form) => {
                const submissionCount = getFormSubmissionCount(form.id);
                const formLinks = generatedLinks.filter(link => link.formId === form.id);
                
                return (
                  <div
                    key={form.id}
                    className="bg-white/50 hover:bg-white/80 rounded-xl p-6 border border-slate-200 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{form.name}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{form.description}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          form.isActive 
                            ? 'bg-zomi-mint text-zomi-green' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{form.fields.length}</p>
                        <p className="text-xs text-slate-500">Fields</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{submissionCount}</p>
                        <p className="text-xs text-slate-500">Submissions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">{formLinks.length}</p>
                        <p className="text-xs text-slate-500">Links</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(form.createdAt)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveFormId(form.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => generateLink(form.id)}
                        disabled={!form.isActive}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-medium">Generate Link</span>
                      </button>
                      <button
                        onClick={() => toggleFormStatus(form.id)}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                          form.isActive
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-zomi-mint hover:bg-zomi-mint/80 text-zomi-green'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {generatedLinks.length > 0 && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <ExternalLink className="w-6 h-6 text-zomi-green" />
                <h2 className="text-xl font-bold text-slate-900">Generated Links</h2>
              </div>

              <div className="space-y-3">
                {generatedLinks.map((link) => {
                  const form = forms.find(f => f.id === link.formId);
                  if (!form) return null;

                  return (
                    <div
                      key={link.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-xl transition-all duration-200 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-zomi-mint text-zomi-green text-xs font-semibold rounded">
                            {form.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {link.accessCount} access{link.accessCount !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 font-mono truncate mb-1">{link.url}</p>
                        <p className="text-xs text-slate-500">
                          Created {formatDate(link.createdAt)} • Expires {formatDate(link.expiresAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyLink(link)}
                        className="flex items-center gap-2 px-4 py-2 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg transition-all duration-200 whitespace-nowrap"
                      >
                        {copiedLinkId === link.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};