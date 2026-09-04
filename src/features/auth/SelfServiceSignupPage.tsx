import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  selfServiceProvisioningService,
  type SelfServiceProvisionStage
} from '../../services/provisioning/selfServiceProvisioningService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

const ORGANISATION_TYPES = [
  { value: 'school', label: 'School / Academic Arts Department' },
  { value: 'music_academy', label: 'Music Academy / Conservatory' },
  { value: 'dance_school', label: 'Dance School / Studio' },
  { value: 'community_arts', label: 'Community Arts Project' },
  { value: 'arts_ngo', label: 'Arts NGO / Foundation' },
  { value: 'after_school', label: 'After-School Arts Programme' },
  { value: 'other', label: 'Other Performing Arts Organisation' }
];

const STAGE_LABELS: Record<SelfServiceProvisionStage, string> = {
  validating: 'Validating registration details…',
  creating_organisation: 'Creating your organisation workspace…',
  starting_trial: 'Activating 14-day Professional trial…',
  preparing_settings: 'Configuring default academy settings…',
  creating_admin_access: 'Establishing administrator credentials…',
  preparing_onboarding: 'Preparing your guided setup wizard…',
  completed: 'Workspace ready! Launching setup…'
};

export const SelfServiceSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [organisationName, setOrganisationName] = useState('');
  const [organisationType, setOrganisationType] = useState('school');
  const [country, setCountry] = useState('South Africa');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState<SelfServiceProvisionStage | null>(null);
  const [stageMessage, setStageMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide your first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!organisationName.trim()) {
      setError('Please provide your school or academy name.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStage('validating');
    setStageMessage('Creating your ArtsFlow administrator account…');

    try {
      // 2. Firebase Auth Account Creation
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 3. Update Display Name
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(user, { displayName: fullName });

      // 4. Send Verification Email (Best effort, non-blocking)
      try {
        await sendEmailVerification(user);
      } catch (emailErr) {
        console.warn('[SelfServiceSignup] Email verification dispatch notice:', emailErr);
      }

      // 5. Trigger Self-Service Provisioning Pipeline
      await selfServiceProvisioningService.selfServiceProvisionOrganisation(
        {
          uid: user.uid,
          email: user.email || email.trim(),
          displayName: fullName
        },
        {
          organisationName: organisationName.trim(),
          organisationType,
          primaryAdminName: fullName,
          contactPhone: phone.trim() || undefined,
          country,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        },
        (stage, msg) => {
          setCurrentStage(stage);
          setStageMessage(msg);
        }
      );

      // 6. Refresh AuthContext and show success
      await refreshAuth();
      setProvisionSuccess(true);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      let friendlyMsg = fbErr.message || 'We could not finish setting up your workspace.';
      if (fbErr.code === 'auth/email-already-in-use') {
        friendlyMsg = 'An account with this email already exists. Please sign in or use a different email.';
      } else if (fbErr.code === 'auth/weak-password') {
        friendlyMsg = 'Password is too weak. Please choose a stronger password.';
      } else if (fbErr.code === 'auth/unauthorized-domain') {
        friendlyMsg = `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current'}) is not authorized in Firebase Authentication.`;
      }
      setError(friendlyMsg);
      setCurrentStage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryProvisioning = async () => {
    if (!auth.currentUser) {
      setError('Please sign in to continue workspace setup.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      const fullName = user.displayName || `${firstName.trim()} ${lastName.trim()}` || 'Academy Admin';

      await selfServiceProvisioningService.selfServiceProvisionOrganisation(
        {
          uid: user.uid,
          email: user.email || email.trim(),
          displayName: fullName
        },
        {
          organisationName: organisationName.trim() || 'My Arts Academy',
          organisationType,
          primaryAdminName: fullName,
          contactPhone: phone.trim() || undefined,
          country,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        },
        (stage, msg) => {
          setCurrentStage(stage);
          setStageMessage(msg);
        }
      );

      await refreshAuth();
      setProvisionSuccess(true);
    } catch (retryErr: unknown) {
      const msg = (retryErr as Error).message || 'Retry setup failed. Please contact support.';
      setError(msg);
      setCurrentStage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If provisioning completed successfully:
  if (provisionSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
              Welcome to ArtsFlow!
            </h2>
            <p className="text-sm text-slate-600">
              Your organization <strong className="text-slate-900">{organisationName}</strong> and 14-day Professional trial are ready.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 text-left space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>14-Day Professional Trial Active</span>
            </div>
            <p className="text-slate-600">
              Complete the quick setup wizard to add your programmes, groups, and start taking attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="w-full py-4 px-6 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/15 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Set Up My Organisation</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-amber-400 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-2xl tracking-tight text-slate-900">
            ArtsFlow <span className="text-primary-600 font-semibold text-xl">OS</span>
          </span>
        </Link>
        <h1 className="mt-4 text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Start your 14-day free trial
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Full access to ArtsFlow Professional · No credit card required · Instant automated setup
        </p>
      </div>

      {/* Main Signup Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200/90 shadow-xl rounded-3xl">
          {/* Progress Overlay during provisioning */}
          {isSubmitting && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Setting up your ArtsFlow workspace…
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {stageMessage || (currentStage ? STAGE_LABELS[currentStage] : 'Preparing account…')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Applying multi-tenant security isolation</span>
              </div>
            </div>
          )}

          {!isSubmitting && (
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Error Notice with Retry Option */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">{error}</p>
                    {auth.currentUser && (
                      <button
                        type="button"
                        onClick={handleRetryProvisioning}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 underline hover:no-underline"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Workspace Setup</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Administrator Details */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  1. Administrator Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sipho"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Mokoena"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="principal@academy.co.za"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    You will use this email address to log in as organisation administrator.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Organisation Information */}
              <div className="space-y-4 pt-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  2. Organisation Information
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organisation / School Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={organisationName}
                    onChange={(e) => setOrganisationName(e.target.value)}
                    placeholder="e.g. Starlight Academy of Music & Dance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organisation Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={organisationType}
                      onChange={(e) => setOrganisationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                      {ORGANISATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 11 555 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the ArtsFlow{' '}
                    <Link to="/terms" target="_blank" className="text-primary-600 font-semibold hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="text-primary-600 font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Reassurance Footer */}
              <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
                <p>No credit card required. Evaluates all ArtsFlow Professional features.</p>
                <p>
                  Already have an ArtsFlow account?{' '}
                  <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
