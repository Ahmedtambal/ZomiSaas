import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Debug: Log full URL
    console.log('Reset Password Page - Full URL:', window.location.href);
    console.log('Reset Password Page - Hash:', window.location.hash);
    console.log('Reset Password Page - Search:', window.location.search);
    
    // Supabase redirects with token in URL hash (#access_token=XXX&type=recovery)
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    
    console.log('Extracted from hash - access_token:', accessToken ? 'present' : 'missing', 'type:', type);
    
    // Also check query params as fallback (?token=XXX&type=recovery)
    const queryToken = searchParams.get('token');
    const queryType = searchParams.get('type');
    
    console.log('Extracted from query - token:', queryToken ? 'present' : 'missing', 'type:', queryType);
    
    if (accessToken && type === 'recovery') {
      setToken(accessToken);
      console.log('Token set from hash fragment');
    } else if (queryToken && queryType === 'recovery') {
      setToken(queryToken);
      console.log('Token set from query params');
    } else {
      console.error('No valid token found in URL');
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one digit';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (!token) {
        throw new Error('No reset token found');
      }

      await authService.updatePassword(password, token);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Password Reset!</h1>
            <p className="text-slate-600 text-center">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zomi-green rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img
              src="/whiteleaf%20group/Whiteleaf%20Logo%20-%20New.png"
              alt="WhiteLeaf Logo"
              className="w-10 h-10 rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Set New Password</h1>
          <p className="text-slate-600 text-center">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="Enter new password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-slate-700">
            <p className="font-semibold mb-1">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
              <li>One special character</li>
            </ul>
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
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-600 hover:text-zomi-green transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
