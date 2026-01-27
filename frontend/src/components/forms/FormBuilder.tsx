import { useState, useEffect } from 'react';
import { Plus, GripVertical, CreditCard as Edit, Trash2, Save, X, Type, Mail, Hash, Calendar, List, FileText, CheckSquare, Circle, Phone, Upload, Search, ListChecks, CalendarRange } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormDefinition, FormField, FormFieldType, ValidationRule } from '../../types/forms';

interface FormBuilderProps {
  formDefinition: FormDefinition | null;
  onSave: (form: FormDefinition) => void;
  onCancel: () => void;
}

interface FieldEditorProps {
  field: FormField | null;
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

const SortableFieldItem = ({ field, onEdit, onDelete }: { 
  field: FormField; 
  onEdit: () => void; 
  onDelete: () => void; 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFieldIcon = (type: FormFieldType) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'tel': return <Phone className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'date-range': return <CalendarRange className="w-4 h-4" />;
      case 'select': return <List className="w-4 h-4" />;
      case 'searchable-select': return <Search className="w-4 h-4" />;
      case 'multi-select': return <ListChecks className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4" />;
      case 'radio': return <Circle className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white/50 hover:bg-white/80 rounded-xl border border-slate-200 transition-all duration-200"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex items-center gap-2 text-zomi-green">
        {getFieldIcon(field.type)}
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-slate-900">{field.label}</p>
        <p className="text-sm text-slate-500 capitalize">{field.type}</p>
      </div>
      
      <div className="flex items-center gap-2">
        {field.validation.required && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            Required
          </span>
        )}
        <button
          onClick={onEdit}
          className="p-2 text-slate-600 hover:text-zomi-green hover:bg-zomi-mint/50 rounded-lg transition-all duration-200"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FieldEditor = ({ field, onSave, onCancel }: FieldEditorProps) => {
  const [formData, setFormData] = useState<Partial<FormField>>({
    id: field?.id || '',
    label: field?.label || '',
    type: field?.type || 'text',
    placeholder: field?.placeholder || '',
    validation: {
      required: field?.validation.required || false,
      minLength: field?.validation.minLength || undefined,
      maxLength: field?.validation.maxLength || undefined,
      min: field?.validation.min || undefined,
      max: field?.validation.max || undefined,
      pattern: field?.validation.pattern || '',
      options: field?.validation.options || [],
      customMessage: field?.validation.customMessage || '',
    },
    order: field?.order || 0,
    conditionalLogic: field?.conditionalLogic || undefined,
    fileConfig: field?.fileConfig || {
      maxSize: 10,
      allowedTypes: [],
      multiple: false,
    },
  });

  const [newOption, setNewOption] = useState('');
  const [showConditionalLogic, setShowConditionalLogic] = useState(!!field?.conditionalLogic);

  const handleSave = () => {
    if (!formData.label?.trim()) return;

    const newField: FormField = {
      id: formData.id || `field_${Date.now()}`,
      label: formData.label,
      type: formData.type!,
      placeholder: formData.placeholder,
      validation: formData.validation!,
      order: formData.order!,
    };

    onSave(newField);
  };

  const addOption = () => {
    if (newOption.trim() && !formData.validation!.options?.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        validation: {
          ...prev.validation!,
          options: [...(prev.validation!.options || []), newOption.trim()]
        }
      }));
      setNewOption('');
    }
  };

  const removeOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      validation: {
        ...prev.validation!,
        options: prev.validation!.options?.filter(opt => opt !== option) || []
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            {field ? 'Edit Field' : 'Add New Field'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Field Label *</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                placeholder="Enter field label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Field Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as FormFieldType }))}
                className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Telephone</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="date-range">Date Range</option>
                <option value="select">Select Dropdown</option>
                <option value="searchable-select">Searchable Select</option>
                <option value="multi-select">Multi-Select</option>
                <option value="textarea">Textarea</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio Buttons</option>
                <option value="file">File Upload</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Placeholder Text</label>
            <input
              type="text"
              value={formData.placeholder}
              onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
              placeholder="Enter placeholder text"
            />
          </div>

          {(formData.type === 'select' || formData.type === 'radio' || formData.type === 'searchable-select' || formData.type === 'multi-select') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  className="glass-input flex-1 px-4 py-3 rounded-xl text-slate-900"
                  placeholder="Add option..."
                />
                <button
                  onClick={addOption}
                  className="px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.validation!.options?.map((option) => (
                  <span
                    key={option}
                    className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg"
                  >
                    <span className="text-sm font-medium text-slate-900">{option}</span>
                    <button
                      onClick={() => removeOption(option)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Configuration */}
          {formData.type === 'file' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/50 mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">File Upload Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={formData.fileConfig?.maxSize || 10}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      fileConfig: { ...prev.fileConfig!, maxSize: parseInt(e.target.value) }
                    }))}
                    className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Allowed File Types</label>
                  <input
                    type="text"
                    value={formData.fileConfig?.allowedTypes?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      fileConfig: { ...prev.fileConfig!, allowedTypes: e.target.value.split(',').map(t => t.trim()) }
                    }))}
                    className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                    placeholder="e.g., image/*, application/pdf, .docx"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="multiple-files"
                    checked={formData.fileConfig?.multiple || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      fileConfig: { ...prev.fileConfig!, multiple: e.target.checked }
                    }))}
                    className="w-4 h-4 accent-zomi-green"
                  />
                  <label htmlFor="multiple-files" className="text-sm font-medium text-slate-700">
                    Allow multiple files
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Phone Number Validation Patterns */}
          {formData.type === 'tel' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-green-50/50 mb-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Phone Validation</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Format</label>
                <select
                  value={formData.validation!.pattern || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validation: { ...prev.validation!, pattern: e.target.value }
                  }))}
                  className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                >
                  <option value="">No specific format</option>
                  <option value="^\\+?[1-9]\\d{1,14}$">International (E.164)</option>
                  <option value="^0[0-9]{10}$">UK Mobile (11 digits)</option>
                  <option value="^\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$">US Format</option>
                  <option value="^[0-9]{10}$">10 digits</option>
                </select>
              </div>
            </div>
          )}

          {/* Conditional Logic */}
          <div className="border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">Conditional Logic</h4>
              <button
                type="button"
                onClick={() => setShowConditionalLogic(!showConditionalLogic)}
                className="text-sm text-zomi-green hover:text-zomi-green/80"
              >
                {showConditionalLogic ? 'Remove' : 'Add Condition'}
              </button>
            </div>
            {showConditionalLogic && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Show this field only when:</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field ID"
                    value={formData.conditionalLogic?.showIf?.fieldId || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditionalLogic: {
                        showIf: {
                          ...prev.conditionalLogic?.showIf,
                          fieldId: e.target.value,
                          operator: prev.conditionalLogic?.showIf?.operator || 'equals',
                          value: prev.conditionalLogic?.showIf?.value || ''
                        }
                      }
                    }))}
                    className="glass-input px-3 py-2 rounded-lg text-sm text-slate-900"
                  />
                  <select
                    value={formData.conditionalLogic?.showIf?.operator || 'equals'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditionalLogic: {
                        showIf: {
                          ...prev.conditionalLogic?.showIf!,
                          operator: e.target.value as any
                        }
                      }
                    }))}
                    className="glass-input px-3 py-2 rounded-lg text-sm text-slate-900"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">&gt;</option>
                    <option value="less_than">&lt;</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={formData.conditionalLogic?.showIf?.value || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditionalLogic: {
                        showIf: {
                          ...prev.conditionalLogic?.showIf!,
                          value: e.target.value
                        }
                      }
                    }))}
                    className="glass-input px-3 py-2 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Validation Rules</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.validation!.required}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validation: { ...prev.validation!, required: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-zomi-green"
                />
                <label htmlFor="required" className="text-sm font-medium text-slate-700">
                  Required field
                </label>
              </div>

              {(formData.type === 'text' || formData.type === 'textarea') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Min Length</label>
                    <input
                      type="number"
                      value={formData.validation!.minLength || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validation: { ...prev.validation!, minLength: e.target.value ? parseInt(e.target.value) : undefined }
                      }))}
                      className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Length</label>
                    <input
                      type="number"
                      value={formData.validation!.maxLength || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validation: { ...prev.validation!, maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                      }))}
                      className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {formData.type === 'number' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Min Value</label>
                    <input
                      type="number"
                      value={formData.validation!.min || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validation: { ...prev.validation!, min: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))}
                      className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Value</label>
                    <input
                      type="number"
                      value={formData.validation!.max || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validation: { ...prev.validation!, max: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))}
                      className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Custom Validation Pattern (Regex)</label>
                <input
                  type="text"
                  value={formData.validation!.pattern || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validation: { ...prev.validation!, pattern: e.target.value }
                  }))}
                  className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                  placeholder="e.g., ^[A-Z]{2}[0-9]{6}[A-Z]$ for NI Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Custom Error Message</label>
                <input
                  type="text"
                  value={formData.validation!.customMessage || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    validation: { ...prev.validation!, customMessage: e.target.value }
                  }))}
                  className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                  placeholder="Custom error message for validation failures"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={!formData.label?.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Save Field
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const FormBuilder = ({ formDefinition, onSave, onCancel }: FormBuilderProps) => {
  const [form, setForm] = useState<FormDefinition>(() => {
    if (formDefinition) return formDefinition;
    
    return {
      id: `form_${Date.now()}`,
      name: '',
      description: '',
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
  });

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setForm(prev => ({
        ...prev,
        fields: arrayMove(
          prev.fields,
          prev.fields.findIndex(field => field.id === active.id),
          prev.fields.findIndex(field => field.id === over.id)
        ).map((field, index) => ({ ...field, order: index })),
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  const handleSaveField = (field: FormField) => {
    setForm(prev => {
      const existingIndex = prev.fields.findIndex(f => f.id === field.id);
      let newFields;
      
      if (existingIndex >= 0) {
        newFields = [...prev.fields];
        newFields[existingIndex] = field;
      } else {
        field.order = prev.fields.length;
        newFields = [...prev.fields, field];
      }

      return {
        ...prev,
        fields: newFields,
        updatedAt: new Date().toISOString(),
      };
    });
    
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId).map((field, index) => ({ ...field, order: index })),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSaveForm = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {formDefinition ? 'Edit Form' : 'Create New Form'}
          </h1>
          <p className="text-slate-600">Design your custom form with fields and validation rules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveForm}
            disabled={!form.name.trim() || form.fields.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Save Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Form Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Form Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
                  placeholder="Enter form name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value, updatedAt: new Date().toISOString() }))}
                  className="glass-input w-full px-4 py-3 rounded-xl text-slate-900 h-24 resize-none"
                  placeholder="Describe what this form is for"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Form Fields</h2>
              <button
                onClick={() => {
                  setEditingField(null);
                  setShowFieldEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Field
              </button>
            </div>

            {form.fields.length === 0 ? (
              <div className="text-center py-12">
                <Type className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No fields added yet</p>
                <button
                  onClick={() => {
                    setEditingField(null);
                    setShowFieldEditor(true);
                  }}
                  className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  Add Your First Field
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={form.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {form.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={() => {
                            setEditingField(field);
                            setShowFieldEditor(true);
                          }}
                          onDelete={() => handleDeleteField(field.id)}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Form Preview</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {form.fields.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Add fields to see preview</p>
              ) : (
                form.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {field.label}
                        {field.validation.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          rows={3}
                          disabled
                        />
                      ) : field.type === 'select' ? (
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" disabled>
                          <option>{field.placeholder || 'Select an option'}</option>
                          {field.validation.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" disabled />
                          <span className="text-sm text-slate-600">{field.placeholder || field.label}</span>
                        </div>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.validation.options?.map((option) => (
                            <div key={option} className="flex items-center gap-2">
                              <input type="radio" name={field.id} className="w-4 h-4" disabled />
                              <span className="text-sm text-slate-600">{option}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          disabled
                        />
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showFieldEditor && (
        <FieldEditor
          field={editingField}
          onSave={handleSaveField}
          onCancel={() => {
            setShowFieldEditor(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
};