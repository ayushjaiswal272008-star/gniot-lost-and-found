import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onGuestContinue: () => void;
  onLoginSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGuestContinue,
  onLoginSuccess,
  initialMode = 'signin',
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
      setSuccessMessage(res.message || 'Verification link resent! Please check your inbox and spam folder.');
    }
  };

  // Handle Login Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage('Authentication successful! Loading your dashboard...');
    setTimeout(() => {
      onLoginSuccess?.();
    }, 400);
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
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
      setErrorMessage(result.error);
      return;
    }

    if (result.requiresEmailVerification) {
      setEmailVerificationPending(true);
      setSuccessMessage('Account created! A confirmation email has been dispatched. Please verify your email before signing in.');
    } else {
      setSuccessMessage('Account created and verified successfully!');
      setTimeout(() => {
        onLoginSuccess?.();
      }, 500);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
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
    <div className="min-h-screen bg-[#190918] text-[#E8EDF2] flex flex-col items-center justify-center p-4 sm:p-6 relative selection:bg-[#D9A441] selection:text-[#30152F]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D9A441]/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#30152F]/80 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#D9A441] via-[#E5B558] to-[#30152F] p-0.5 shadow-2xl shadow-[#D9A441]/25 hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#30152F] rounded-[22px] flex items-center justify-center text-[#D9A441] font-extrabold text-2xl font-display">
              G
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              GNIOT <span className="text-[#D9A441]">AI Lost &amp; Found</span>
            </h1>
            <p className="text-xs text-[#E8EDF2]/70 mt-1 font-medium">
              Greater Noida Institute of Technology • Campus Recovery Portal
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl glass-panel border border-[#D9A441]/25 bg-[#30152F]/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Card Tabs (Sign In / Create Account) */}
          {mode !== 'forgot' && (
            <div className="p-3 border-b border-[#D9A441]/15 bg-[#240E23]/60">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#190918]/80 border border-[#D9A441]/20 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[#30152F] text-[#D9A441] shadow-md border border-[#D9A441]/30 font-bold'
                      : 'text-[#E8EDF2]/70 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[#30152F] text-[#D9A441] shadow-md border border-[#D9A441]/30 font-bold'
                      : 'text-[#E8EDF2]/70 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-7 space-y-4">
            {/* Status Messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>

                {errorMessage.toLowerCase().includes('not confirmed') && (
                  <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-rose-300">Need a fresh confirmation email?</span>
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={handleResendVerification}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend Email'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div className="flex-1 leading-relaxed">{successMessage}</div>
              </div>
            )}

            {/* Email Verification Pending Notice */}
            {emailVerificationPending && (
              <div className="p-4 rounded-2xl bg-[#240E23] border border-[#D9A441]/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#D9A441] font-bold">
                  <Mail className="w-4 h-4" />
                  <span>Check Your Email Inbox</span>
                </div>
                <p className="text-[#E8EDF2]/80 text-[11px] leading-relaxed">
                  Supabase has sent a verification link to <strong className="text-white">{email}</strong>. Once confirmed, you can sign in directly to manage your reports and claims.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 rounded-xl bg-[#D9A441]/20 hover:bg-[#D9A441]/30 text-[#D9A441] text-xs font-semibold border border-[#D9A441]/30 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Sending...' : 'Resend Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-xs text-[#E8EDF2]/70 hover:text-white underline ml-auto"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1.5">
                    College or Personal Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@gniot.net.in"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#E8EDF2]">
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
                    <Lock className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#E8EDF2]/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-black text-sm shadow-lg shadow-[#D9A441]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to GNIOT AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-[#E8EDF2]/70">New student? </span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-xs font-bold text-[#D9A441] hover:underline cursor-pointer"
                  >
                    Create a free account
                  </button>
                </div>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@gniot.net.in or gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                      Roll Number
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-[#D9A441]/70 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g. 240133010001"
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
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
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                    Password * (Min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#E8EDF2]/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${strength.color}`} 
                          style={{ width: `${strength.score}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#E8EDF2]/70 font-semibold">
                        <span>Strength: {strength.label}</span>
                        <span>{password.length >= 6 ? '✓ Valid length' : 'Min 6 chars'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-[#E8EDF2]/40 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-black text-sm shadow-lg shadow-[#D9A441]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Student Account</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-[#E8EDF2]/70">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-xs font-bold text-[#D9A441] hover:underline cursor-pointer"
                  >
                    Sign In instead
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-[#E8EDF2]/70 leading-relaxed">
                  Enter your registered college or personal email address. We will dispatch a password reset link to your email.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#E8EDF2] mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#D9A441]/70 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@gniot.net.in"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D9A441]/20 bg-[#240E23] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] placeholder:text-[#E8EDF2]/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 text-[#190918] font-black text-sm shadow-lg shadow-[#D9A441]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-xs font-bold text-[#D9A441] hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Guest Mode Navigation Button */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={onGuestContinue}
            className="w-full py-3 px-4 rounded-2xl bg-[#240E23]/80 hover:bg-[#30152F] text-[#E8EDF2] border border-[#D9A441]/30 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-[#D9A441] group-hover:rotate-45 transition-transform" />
            <span>Browse Campus Registry as Guest</span>
          </button>
          <p className="text-[11px] text-[#E8EDF2]/50">
            Guests can explore reported lost &amp; found items. Sign in is required to submit reports or claims.
          </p>
        </div>

        {/* Footer Security Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#E8EDF2]/60 pt-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D9A441]" />
            <span>Supabase Auth Protected</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Database Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
