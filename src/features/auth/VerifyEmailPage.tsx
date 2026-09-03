import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setMessage(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification link resent. Please check your inbox and spam folder.');
    } catch (err) {
      setMessage((err as Error).message || 'Could not resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await refreshAuth();
      if (auth.currentUser.emailVerified) {
        navigate('/onboarding');
      } else {
        setMessage('Email not yet verified. Please click the link in your email.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
          Verify your email address
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a verification link to <strong className="text-slate-900">{user?.email || 'your email'}</strong>.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 shadow-xl rounded-3xl space-y-6 text-center">
          {message && (
            <div className="p-3.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800">
              {message}
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Verifying your email ensures you can receive parent messages, tuition updates, and password recovery emails.
          </p>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckStatus}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow"
            >
              <span>I Have Verified My Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Resending…' : 'Resend Verification Link'}</span>
            </button>

            <div className="pt-2">
              <Link
                to="/onboarding"
                className="text-xs text-primary-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Continue to Onboarding Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
