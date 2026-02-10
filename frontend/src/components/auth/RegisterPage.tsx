import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Key, ArrowLeft, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type TabType = 'admin' | 'user';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    jobTitle: '',
    inviteCode: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { registerAdmin, registerUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one digit');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setIsLoading(true);

    try {
      let requiresEmailConfirmation = false;
      
      if (activeTab === 'admin') {
        // Admin signup
        if (!formData.organizationName) {
          setError('Organization name is required for admin signup');
          setIsLoading(false);
          return;
        }
        const response = await registerAdmin(
          formData.fullName,
          formData.email,
          formData.password,
          formData.jobTitle,
          formData.organizationName
        );
        // Check if email confirmation is needed (registerAdmin returns void normally, but no redirect happens)
        requiresEmailConfirmation = true;
      } else {
        // User signup
        if (!formData.inviteCode || formData.inviteCode.length !== 8) {
          setError('Valid 8-character invite code is required');
          setIsLoading(false);
          return;
        }
        const response = await registerUser(
          formData.fullName,
          formData.email,
          formData.password,
          formData.jobTitle,
          formData.inviteCode
        );
        requiresEmailConfirmation = true;
      }
      
      // Show email confirmation modal
      setRegisteredEmail(formData.email);
      setShowEmailConfirmation(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/whiteleaf%20group/whiteleaf.png"
              alt="WhiteLeaf"
              className="w-64 max-w-full h-auto mb-4"
              onError={(e) => {
                e.currentTarget.src = '/whiteleaf%20group/Whiteleaf%20Logo%20-%20New.png';
              }}
            />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Email</h1>
            <p className="text-slate-600 text-center">We've sent a confirmation email to</p>
            <p className="text-zomi-green font-semibold text-center mt-1">{registeredEmail}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-700">
              Click the confirmation link in the email to activate your account and complete the registration process.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-600 hover:text-zomi-green transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="flex flex-col items-center mb-8">
          <img
            src="/whiteleaf%20group/whiteleaf.png"
            alt="WhiteLeaf"
            className="w-64 max-w-full h-auto mb-4"
            onError={(e) => {
              e.currentTarget.src = '/whiteleaf%20group/Whiteleaf%20Logo%20-%20New.png';
            }}
          />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
          <p className="text-slate-600 text-center">Create your account</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'user'
                ? 'bg-white text-zomi-green shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Signup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-zomi-green shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="John Smith"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="Manager"
                required
              />
            </div>
          </div>

          {/* Conditional Fields */}
          {activeTab === 'admin' ? (
            // Admin: Organization Name
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                  placeholder="Your Company Name"
                  required={activeTab === 'admin'}
                />
              </div>
            </div>
          ) : (
            // User: Invite Code
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">8-Character Invite Code</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="inviteCode"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900 tracking-widest uppercase"
                  placeholder="ABC12345"
                  required={activeTab === 'user'}
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Ask your admin for an invite code</p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Must contain: uppercase, lowercase, digit, special character
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
