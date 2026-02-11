import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createForm } from '../../services/formService';
import { useAuth } from '../../context/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface FormData {
  // Personal Details
  title: string;
  forename: string;
  surname: string;
  niNumber: string;
  dateOfBirth: string;
  sex: string;
  maritalStatus: string;
  
  // Contact Details
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  postcode: string;
  
  // Employment Details
  ukResident: string;
  nationality: string;
  salary: string;
  employmentStartDate: string;
  selectedRetirementAge: string;
  sectionNumber: string;
  pensionInvestmentApproach: string;
}

const initialFormData: FormData = {
  title: '',
  forename: '',
  surname: '',
  niNumber: '',
  dateOfBirth: '',
  sex: '',
  maritalStatus: '',
  address1: '',
  address2: '',
  address3: '',
  address4: '',
  postcode: '',
  ukResident: '',
  nationality: '',
  salary: '',
  employmentStartDate: '',
  selectedRetirementAge: '',
  sectionNumber: '',
  pensionInvestmentApproach: '',
};

export const SWNewEmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [formName, setFormName] = useState('SW New Employee Form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
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
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Details
        return !!(formData.title && formData.forename && formData.surname && 
                  formData.niNumber && formData.dateOfBirth && formData.sex && 
                  formData.maritalStatus);
      case 2: // Contact Details
        return !!(formData.address1 && formData.postcode);
      case 3: // Employment Details
        return !!(formData.ukResident && formData.nationality && formData.salary && 
                  formData.employmentStartDate && formData.selectedRetirementAge);
      case 4: // Pension Details (Section Number and Pension Investment Approach disabled - filled by team later)
        return true; // No required fields in this step anymore
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }

    if (!validateStep(4)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDefinition = {
        name: formName,
        description: 'Scottish Widows New Employee Enrollment Form',
        template_type: 'sw_new_employee' as const,
        linked_company_id: selectedCompany,
        form_data: {
          fields: [
            { name: 'title', label: 'Title', type: 'select', required: true, options: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr'] },
            { name: 'forename', label: 'Forename', type: 'text', required: true },
            { name: 'surname', label: 'Surname', type: 'text', required: true },
            { name: 'niNumber', label: 'NI Number', type: 'text', required: true, pattern: '^[A-Z]{2}[0-9]{6}[A-Z]$' },
            { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
            { name: 'sex', label: 'Sex', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
            { name: 'maritalStatus', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Partnership'] },
            { name: 'address1', label: 'Address Line 1', type: 'text', required: true },
            { name: 'address2', label: 'Address Line 2', type: 'text', required: false },
            { name: 'address3', label: 'Address Line 3', type: 'text', required: false },
            { name: 'address4', label: 'Address Line 4', type: 'text', required: false },
            { name: 'postcode', label: 'Postcode', type: 'text', required: true },
            { name: 'ukResident', label: 'UK Resident', type: 'select', required: true, options: ['Yes', 'No'] },
            { name: 'nationality', label: 'Nationality', type: 'text', required: true },
            { name: 'salary', label: 'Salary', type: 'number', required: true, min: 0 },
            { name: 'employmentStartDate', label: 'Employment Start Date', type: 'date', required: true },
            { name: 'selectedRetirementAge', label: 'Selected Retirement Age', type: 'number', required: true, min: 55, max: 75 },
            // Disabled fields - to be filled by team in database later
            // { name: 'sectionNumber', label: 'Section Number', type: 'text', required: false },
            // { name: 'pensionInvestmentApproach', label: 'Pension Investment Approach', type: 'select', required: false, options: ['Default', 'Ethical', 'High Growth', 'Conservative'] },
          ]
        }
      };

      const result = await createForm(formDefinition);
      navigate('/forms', { state: { message: 'Form created successfully', formId: result.id } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/forms')}
            className="text-white/60 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forms
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Scottish Widows New Employee Form
          </h1>
          <p className="text-white/60">Complete employee pension enrollment</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>Personal</span>
            <span>Contact</span>
            <span>Employment</span>
            <span>Pension</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Personal Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">Title *</label>
                  <select
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">Forename *</label>
                  <input
                    type="text"
                    value={formData.forename}
                    onChange={(e) => handleInputChange('forename', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Surname *</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">NI Number *</label>
                  <input
                    type="text"
                    value={formData.niNumber}
                    onChange={(e) => handleInputChange('niNumber', e.target.value)}
                    placeholder="AB123456C"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white mb-2">Marital Status *</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Civil Partnership">Civil Partnership</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Contact Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    value={formData.address1}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Address Line 3</label>
                  <input
                    type="text"
                    value={formData.address3}
                    onChange={(e) => handleInputChange('address3', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Address Line 4</label>
                  <input
                    type="text"
                    value={formData.address4}
                    onChange={(e) => handleInputChange('address4', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Postcode *</label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => handleInputChange('postcode', e.target.value)}
                    placeholder="SW1A 1AA"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Employment Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Employment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">UK Resident *</label>
                  <select
                    value={formData.ukResident}
                    onChange={(e) => handleInputChange('ukResident', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">Nationality *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Salary (£) *</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Employment Start Date *</label>
                  <input
                    type="date"
                    value={formData.employmentStartDate}
                    onChange={(e) => handleInputChange('employmentStartDate', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white mb-2">Selected Retirement Age *</label>
                  <input
                    type="number"
                    value={formData.selectedRetirementAge}
                    onChange={(e) => handleInputChange('selectedRetirementAge', e.target.value)}
                    min="55"
                    max="75"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pension Details & Company */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Company Selection</h2>
              <p className="text-white/70 text-sm mb-4">
                Note: Section Number and Pension Investment Approach will be filled by the team later in the database.
              </p>
              
              <div className="space-y-6">
                {/* Section Number and Pension Investment Approach fields are hidden - will be filled by team in database */}

                <div className="border-t border-white/20 pt-6 mt-6">
                  <div>
                    <label className="block text-white mb-2">Form Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-white mb-2">Linked Company *</label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Company</option>
                      {(companies || []).map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-white/60 text-sm mt-2">
                      This company's Master Rulebook will auto-fill employee data on submission
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="ml-auto px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg font-semibold transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Form...' : 'Create Form'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
