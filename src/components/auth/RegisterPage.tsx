import { useState } from 'react';
import { Lock, Mail, User, Key, Leaf, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onShowLogin: () => void;
}

export const RegisterPage = ({ onShowLogin }: RegisterPageProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.inviteCode.length !== 6) {
      setError('Invite code must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName, formData.inviteCode);
    } catch (err) {
      setError('Invalid invite code or registration failed');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
        <button
          onClick={onShowLogin}
          className="flex items-center gap-2 text-slate-600 hover:text-zomi-green transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zomi-green rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Zomi Wealth</h1>
          <p className="text-slate-600 text-center">Invite-only registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="you@zomiwealth.com"
                required
              />
            </div>
          </div>

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
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit Invite Code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900 tracking-widest"
                placeholder="000000"
                required
                maxLength={6}
                pattern="[0-9]{6}"
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

        <div className="mt-6 text-center text-xs text-slate-500">
          UK/GDPR Compliant • Hosted in London (eu-west-2)
        </div>
      </div>
    </div>
  );
};
