import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ApplicationVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Music, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: ApplicationVerifier;
  }
}

function formatAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/user-disabled':
      return 'Your account is currently disabled. Please contact platform support.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. Access is temporarily paused for security. Please reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/invalid-verification-code':
      return 'The SMS verification code entered is incorrect. Please try again.';
    default: {
      const msg = (error as Error)?.message || '';
      return msg.replace(/^Firebase:\s*(Error\s*)?(\(auth\/[^)]+\)\.?\s*)?/i, '') || 'Authentication could not be completed. Please try again.';
    }
  }
}

interface LoginPageProps {
  initialForgotPassword?: boolean;
}

export function LoginPage({ initialForgotPassword = false }: LoginPageProps = {}) {
  const navigate = useNavigate();
  const { user, authUser, loading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(initialForgotPassword);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Phone Auth State
  const [usePhone, setUsePhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // If already logged in, redirect intelligently
  useEffect(() => {
    if (user && authUser && !authLoading) {
      if (authUser.platformRole === 'super_admin') {
        navigate('/platform', { replace: true });
      } else if (authUser.role === 'guardian') {
        navigate('/portal', { replace: true });
      } else if (authUser.role === 'learner') {
        navigate('/learner-portal', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authUser, authLoading, navigate]);

  const routeUserAfterAuth = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const platformRole = userData?.platformRole || (userData?.role === 'super_admin' ? 'super_admin' : null);

      if (platformRole === 'super_admin') {
        navigate('/platform', { replace: true });
        return;
      }
      if (userData?.role === 'guardian') {
        navigate('/portal', { replace: true });
        return;
      }
      if (userData?.role === 'learner') {
        navigate('/learner-portal', { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await routeUserAfterAuth(cred.user.uid);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await routeUserAfterAuth(cred.user.uid);
      }
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        // Safe generic confirmation prevents account enumeration while reassuring the user
        setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      await routeUserAfterAuth(cred.user.uid);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      const cred = await confirmationResult.confirm(verificationCode);
      await routeUserAfterAuth(cred.user.uid);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Music className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {isForgotPassword ? 'Reset Your Password' : (isLogin ? 'Sign in to ArtsFlow OS' : 'Create an account')}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          {isForgotPassword
            ? 'Enter your registered email address to receive a secure password reset link.'
            : 'Operational & SaaS platform for modern arts academies.'}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-sm sm:rounded-2xl border border-slate-200">
          
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm leading-snug">
              {error}
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {isForgotPassword ? (
            <div>
              {resetSent ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Password Reset Email Sent</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      If an account is associated with <span className="font-semibold text-slate-800">{email}</span>, you will receive an email shortly with instructions to set your new password.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSent(false);
                        setError('');
                      }}
                    >
                      Return to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleForgotPassword}>
                  <Input
                    label="Registered email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. founder@artsflow.example"
                    required
                    autoFocus
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending link...' : 'Send Password Reset Link'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium pt-2 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>
                </form>
              )}
            </div>
          ) : !usePhone ? (
            /* STANDARD EMAIL / PASSWORD LOGIN */
            <>
              <form className="space-y-5" onSubmit={handleEmailAuth}>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@academy.example"
                  required
                />
                <div>
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {isLogin && (
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Forgot password?</span>
                      </button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full text-xs">
                    Google
                  </Button>
                  <Button variant="outline" onClick={() => setUsePhone(true)} disabled={loading} className="w-full text-xs">
                    Phone
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                {isLogin ? (
                  <>
                    <span>Don't have an account? </span>
                    <Link
                      to="/start-trial"
                      className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors ml-0.5"
                    >
                      Start 14-Day Free Trial
                    </Link>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsLogin(true);
                        setError('');
                      }} 
                      className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors ml-0.5"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* PHONE AUTH VIEW */
            <div className="space-y-5">
              {!confirmationResult ? (
                <>
                  <Input
                    label="Phone Number (e.g. +27825550100)"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+27825550100"
                    required
                  />
                  <Button onClick={handleSendCode} className="w-full" disabled={loading || !phoneNumber}>
                    {loading ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label="Verification Code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    required
                  />
                  <Button onClick={handleVerifyCode} className="w-full" disabled={loading || !verificationCode}>
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </>
              )}
              
              <div id="recaptcha-container"></div>

              <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setUsePhone(false);
                    setConfirmationResult(null);
                    setError('');
                  }} 
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Email/Password</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
