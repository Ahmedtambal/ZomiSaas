import { useEffect, useState } from 'react';
import { Mail, X, Loader2, Leaf, Sparkles } from 'lucide-react';

interface EmailConfirmationPageProps {
  email: string;
  onBackToLogin: () => void;
}

export const EmailConfirmationPage = ({ email, onBackToLogin }: EmailConfirmationPageProps) => {
  const [countdown, setCountdown] = useState(60);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 50);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onBackToLogin, 300); // Wait for animation
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 backdrop-blur-none'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleClose}
    >
      <div 
        className={`glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-700 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-zomi-green to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-pulse">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Check Your Email</h1>
          <p className="text-sm text-slate-600">Verification Required</p>
        </div>

        {/* Email Icon & Message */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-inner">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zomi-green rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Verification Email Sent!
          </h2>
          
          <p className="text-sm text-slate-600 mb-2">
            We've sent a verification link to:
          </p>
          
          <div className="bg-gradient-to-r from-zomi-green/10 to-emerald-100/50 border border-zomi-green/30 rounded-xl px-4 py-2 mb-4">
            <p className="text-zomi-green font-semibold text-sm break-all">
              {email}
            </p>
          </div>
          
          {/* Instructions Box with Glassmorphism */}
          <div className="bg-white/60 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 text-sm text-slate-700 text-left shadow-inner">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">📧</span>
              <p className="font-semibold text-slate-900">Next Steps:</p>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected back to login</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={countdown > 0}
            className="w-full bg-white/70 hover:bg-white/90 backdrop-blur-sm text-slate-700 font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border border-slate-200/50"
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
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-zomi-green to-emerald-600 hover:from-zomi-green/90 hover:to-emerald-600/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Login
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-5 border-t border-slate-200/50">
          <p className="text-center text-xs text-slate-500">
            💡 Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};
