import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  GraduationCap, 
  Building, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}) => {
  const { signIn, signUp, resetPassword, resendVerificationEmail, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-300' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 65, label: 'Good', color: 'bg-[#D9A441]' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailVerificationPending(false);
    setIsEmailUnverified(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    resetFormState();
    setMode(newMode);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter your email above to resend verification.');
      return;
    }
    setIsResending(true);
    const res = await resendVerificationEmail(email);
    setIsResending(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(res.message || 'Verification link resent! Please check your email inbox.');
    }
  };

  // Handle Login Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      if (result.error.toLowerCase().includes('invalid login credentials')) {
        setErrorMessage('Invalid email or password. Please verify your credentials or use Forgot Password.');
      } else if (result.error.toLowerCase().includes('email not confirmed')) {
        setIsEmailUnverified(true);
        setErrorMessage('Your email address has not been verified yet. Please check your inbox for the Supabase confirmation link.');
      } else {
        setErrorMessage(result.error);
      }
      return;
    }

    setSuccessMessage('Authentication successful! Welcome back.');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 600);
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid college or personal email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    const result = await signUp({
      email,
      password,
      fullName,
      rollNo,
      department,
    });
    setLoading(false);

    if (result.error) {
      if (result.error.toLowerCase().includes('already registered')) {
        setErrorMessage('An account with this email already exists. Please Sign In instead.');
      } else {
        setErrorMessage(result.error);
      }
      return;
    }

    if (result.requiresEmailVerification) {
      setEmailVerificationPending(true);
      setSuccessMessage('Account created! A confirmation email has been dispatched. Please verify your email before logging in.');
    } else {
      setSuccessMessage('Account created and verified successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter the email address linked to your account.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage(result.message || 'Password reset link sent! Check your inbox.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#30152F]/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#30152F] rounded-3xl border border-[#30152F]/15 dark:border-[#D9A441]/25 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#30152F] border-b border-[#30152F]/10 dark:border-[#D9A441]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9A441] to-[#c79133] text-[#30152F] flex items-center justify-center font-black text-sm shadow-md">
              G
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8EDF2] font-display flex items-center gap-2">
                {mode === 'signin' && 'Sign In to GNIOT AI'}
                {mode === 'signup' && 'Create Student Account'}
                {mode === 'forgot' && 'Reset Account Password'}
              </h2>
              <p className="text-[11px] text-[#E8EDF2]/70">
                Official Campus Recovery &amp; Claims Identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-[#E8EDF2]/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Notice if Supabase keys missing */}
        {!isConfigured && (
          <div className="m-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Supabase Keys Pending</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Add your <code className="font-mono font-bold">VITE_SUPABASE_URL</code> and <code className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> to enable live Supabase Auth and database storage.
            </p>
          </div>
        )}

        {/* Mode Switch Tabs (for Sign In & Sign Up) */}
        {mode !== 'forgot' && (
          <div className="px-6 pt-5 pb-2">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#E8EDF2] dark:bg-[#240E23] border border-[#30152F]/10 dark:border-[#D9A441]/20 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-[#30152F] text-[#D9A441] shadow-xs'
                    : 'text-[#30152F]/70 dark:text-[#E8EDF2]/70 hover:text-[#30152F] dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-[#30152F] text-[#D9A441] shadow-xs'
                    : 'text-[#30152F]/70 dark:text-[#E8EDF2]/70 hover:text-[#30152F] dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>

              {isEmailUnverified && (
                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300">Didn't receive verification email?</span>
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#30152F] dark:text-[#E8EDF2] border border-[#30152F]/20 dark:border-white/20 font-semibold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  College or Personal Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gniot.net.in or personal email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-bold text-[#D9A441] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#30152F]/40 dark:text-[#E8EDF2]/40 hover:text-[#30152F] dark:hover:text-[#E8EDF2]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#30152F]/70 dark:text-[#E8EDF2]/70">
                <ShieldCheck className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>Protected by Supabase Auth with encrypted tokens.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#D9A441] hover:bg-[#c49233] text-[#30152F] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@gniot.net.in or gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                    Roll Number
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 240133010001"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-xs focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-xs focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  >
                    <option value="Computer Science & Engineering">CSE (Block B)</option>
                    <option value="AI & Machine Learning">AI &amp; ML</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Civil Engineering">Civil</option>
                    <option value="Pharmacy & Sciences">Pharmacy</option>
                    <option value="Management (MBA)">MBA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Create Password * (Min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#30152F]/40 dark:text-[#E8EDF2]/40 hover:text-[#30152F] dark:hover:text-[#E8EDF2]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${strength.color}`} 
                        style={{ width: `${strength.score}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#30152F]/70 dark:text-[#E8EDF2]/70 font-semibold">
                      <span>Password strength: {strength.label}</span>
                      <span>{password.length >= 6 ? '✓ Valid length' : 'Must be >= 6 characters'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#30152F]/40 dark:text-[#E8EDF2]/40 hover:text-[#30152F] dark:hover:text-[#E8EDF2]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#D9A441] hover:bg-[#c49233] text-[#30152F] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-[#30152F]/70 dark:text-[#E8EDF2]/70 leading-relaxed">
                Enter your registered college or personal email address. We will dispatch a secure Supabase password reset link.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#30152F]/40 dark:text-[#E8EDF2]/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gniot.net.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#30152F]/15 dark:border-[#D9A441]/25 bg-white dark:bg-[#240E23] text-[#30152F] dark:text-[#E8EDF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-1/3 py-2.5 rounded-2xl border border-[#30152F]/20 dark:border-[#D9A441]/30 text-xs font-bold text-[#30152F] dark:text-[#E8EDF2]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-2xl bg-[#D9A441] hover:bg-[#c49233] text-[#30152F] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
