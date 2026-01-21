import { useEffect, useState } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, Leaf } from 'lucide-react';

interface EmailConfirmationPageProps {
  email: string;
  onBackToLogin: () => void;
}

export const EmailConfirmationPage = ({ email, onBackToLogin }: EmailConfirmationPageProps) => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    // TODO: Implement resend email logic
    setCountdown(60);
    // Add your resend email API call here
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zomi-green rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Email</h1>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Verification Email Sent
          </h2>
          
          <p className="text-slate-600 mb-2">
            We've sent a verification link to:
          </p>
          
          <p className="text-zomi-green font-semibold mb-4">
            {email}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700 text-left">
            <p className="font-semibold mb-2">📧 Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected back to login</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={countdown > 0}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resend in {countdown}s
              </span>
            ) : (
              'Resend Verification Email'
            )}
          </button>

          <button
            onClick={onBackToLogin}
            className="w-full bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold py-3 rounded-xl transition-all duration-200"
          >
            Back to Login
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-center text-xs text-slate-500">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};
