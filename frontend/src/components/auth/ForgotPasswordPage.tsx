import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-zomi-green rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Email</h1>
            <p className="text-slate-600 text-center">
              We've sent a password reset link to
            </p>
            <p className="text-zomi-green font-semibold text-center mt-1">{email}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-700">
              Click the link in the email to reset your password. The link will expire in 1 hour.
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
          <div className="w-16 h-16 bg-zomi-green rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img src="/logo.png" alt="Zomi Wealth Logo" className="w-10 h-10 rounded-lg" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
          <p className="text-slate-600 text-center">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="you@zomiwealth.com"
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
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};
