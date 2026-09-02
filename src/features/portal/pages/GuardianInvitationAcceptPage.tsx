import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { guardianInvitationService, TokenValidationResult } from '../../../services/guardianInvitationService';
import { Building2, CheckCircle2, AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';

export const GuardianInvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();

  const [validation, setValidation] = useState<TokenValidationResult | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    guardianInvitationService.validateInvitationToken(token)
      .then(res => {
        setValidation(res);
        if (res.valid && res.email) {
          setEmail(res.email);
        }
        if (res.guardianName) {
          setDisplayName(res.guardianName);
        }
      })
      .catch(err => setValidation({ valid: false, error: (err as Error).message }))
      .finally(() => setLoadingToken(false));
  }, [token]);

  // If user is already logged in, they can simply click "Link this Account"
  const handleLinkCurrentAccount = async () => {
    if (!token || !user) return;
    setProcessing(true);
    setError(null);

    try {
      await guardianInvitationService.acceptInvitation(token, user.uid);
      await refreshAuth();
      setAcceptedSuccess(true);
      setTimeout(() => navigate('/portal'), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProcessing(true);
    setError(null);

    try {
      let uid: string;
      if (isExistingUser) {
        // Sign in
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        uid = cred.user.uid;
      } else {
        // Create account
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = cred.user.uid;

        // Initialize user doc
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          role: 'guardian',
          organisationId: validation?.invitation?.organisationId,
          guardianId: validation?.invitation?.guardianId,
          createdAt: new Date().toISOString()
        });
      }

      // Link invitation to user in guardianPortalAccess
      await guardianInvitationService.acceptInvitation(token, uid);
      await refreshAuth();

      setAcceptedSuccess(true);
      setTimeout(() => navigate('/portal'), 2000);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please select "I already have an account" below.');
        setIsExistingUser(true);
      } else {
        setError(e.message || 'Failed to complete registration.');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loadingToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Invitation Invalid or Expired</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {validation?.error || 'This invitation link cannot be verified or has expired.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/portal/login')}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Go to Portal Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (acceptedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-6 shadow-xl rounded-3xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Welcome to ArtsFlow!</h1>
            <p className="text-sm text-slate-600">
              Your portal access has been verified and activated. Redirecting you to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          {validation.organisationName}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Activate Guardian Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Hello {validation.guardianName}, set up your login to access your children's records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are currently signed in as <strong>{user.email}</strong>. Would you like to link this account to your guardian profile?
              </p>
              <button
                type="button"
                onClick={handleLinkCurrentAccount}
                disabled={processing}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{processing ? 'Linking Account...' : 'Link My Account & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthAndAccept} className="space-y-4">
              {!isExistingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isExistingUser ? 'Your Password' : 'Create a Secure Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{processing ? 'Activating...' : isExistingUser ? 'Sign In & Activate' : 'Create Account & Activate'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsExistingUser(!isExistingUser)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  {isExistingUser
                    ? "Don't have an account yet? Create one"
                    : 'Already have an account? Sign in here'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
