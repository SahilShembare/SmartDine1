import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  User, 
  Phone,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  MessageSquareCode,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, registerWithEmail, resetPasswordWithOtp } = useAuth();
  const { currentTable, setTableSession } = useTableOrder();
  
  // URL params
  const tableParam = searchParams.get('table');
  const roleParam = searchParams.get('role') || 'customer'; // 'customer', 'kitchen', 'admin'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  // Tabs: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(roleParam === 'kitchen' ? 'kitchen@smartdine.com' : roleParam === 'admin' ? 'admin@smartdine.com' : '');
  const [password, setPassword] = useState(roleParam === 'kitchen' ? 'kitchen123456' : roleParam === 'admin' ? 'admin123456' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state for Create Account
  const [otpStep, setOtpStep] = useState(false); // false: details input, true: enter OTP
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpNotice, setOtpNotice] = useState('');

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState(''); // phone or email
  const [forgotOtpStep, setForgotOtpStep] = useState(false);
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [userEnteredForgotOtp, setUserEnteredForgotOtp] = useState('');
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
  const [forgotOtpNotice, setForgotOtpNotice] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (tableParam && !currentTable) {
    setTableSession(tableParam);
  }

  const defaultDestination = roleParam === 'kitchen' 
    ? '/kitchen' 
    : roleParam === 'admin' 
    ? '/admin' 
    : (tableParam || currentTable ? `/menu?table=${tableParam || currentTable}` : '/menu');
  const from = location.state?.from?.pathname || defaultDestination;

  // OTP Countdown timer for Register
  useEffect(() => {
    let interval;
    if (otpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  // OTP Countdown timer for Forgot Password
  useEffect(() => {
    let interval;
    if (forgotOtpStep && forgotOtpTimer > 0) {
      interval = setInterval(() => setForgotOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpStep, forgotOtpTimer]);

  // Handle Send OTP for Registration
  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpStep(true);
    setOtpTimer(60);
    setOtpNotice(`📱 SMS Sent! Your Smart Dine verification OTP is: ${code}`);
  };

  // Handle Verify OTP & Complete Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (userEnteredOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code. Please enter the correct 6-digit code or click resend.');
      return;
    }

    setLoading(true);
    try {
      const customerEmail = email.trim() || `${phone.replace(/\D/g, '')}@smartdine.customer`;
      const customerPassword = password.trim() || 'customer123456';
      
      await registerWithEmail(name.trim(), customerEmail, customerPassword, 'customer');
      navigate(from);
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP for Forgot Password
  const handleSendForgotOtp = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered mobile number or email.');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedForgotOtp(code);
    setForgotOtpStep(true);
    setForgotOtpTimer(60);
    setForgotOtpNotice(`🔐 Password Reset OTP: ${code}`);
  };

  // Handle Verify OTP & Reset Password
  const handleVerifyForgotOtpAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (userEnteredForgotOtp.trim() !== generatedForgotOtp) {
      setError('Invalid OTP code. Please enter the correct 6-digit code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp(forgotIdentifier, newPassword);
      setSuccessMsg('🎉 Password reset successfully! Please sign in with your new password.');
      setEmail(forgotIdentifier);
      setPassword(newPassword);
      setActiveTab('login');
      setForgotOtpStep(false);
      setForgotOtpNotice('');
      setNewPassword('');
      setConfirmPassword('');
      setUserEnteredForgotOtp('');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const loginIdentifier = email.includes('@') ? email : `${email.replace(/\D/g, '')}@smartdine.customer`;
      const user = await loginWithEmail(loginIdentifier, password);
      if (user.role === 'kitchen') {
        navigate('/kitchen');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email/phone and password.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = roleParam === 'customer';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-glow">
            {roleParam === 'kitchen' ? (
              <ChefHat className="w-7 h-7 text-white" />
            ) : roleParam === 'admin' ? (
              <LayoutDashboard className="w-7 h-7 text-white" />
            ) : (
              <UtensilsCrossed className="w-7 h-7 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {roleParam === 'kitchen' 
              ? 'Kitchen Staff Sign In' 
              : roleParam === 'admin' 
              ? 'Administrator Sign In' 
              : activeTab === 'forgot'
              ? 'Reset Customer Password'
              : 'Customer Dining Access'}
          </h1>
          <p className="text-xs text-slate-400">
            {isCustomer 
              ? (activeTab === 'forgot' 
                  ? 'Verify your mobile OTP to set a new password'
                  : 'Login or create a new account with mobile OTP verification')
              : 'Authorized personnel access only'}
          </p>
        </div>

        {/* Customer Tabs: [Login] vs [Create Account with OTP] */}
        {isCustomer && activeTab !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccessMsg('');
                setOtpStep(false);
              }}
              className={`py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                activeTab === 'login'
                  ? 'bg-orange-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
                setSuccessMsg('');
                setOtpStep(false);
              }}
              className={`py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Create with OTP</span>
            </button>
          </div>
        )}

        {/* Register OTP Notification Banner Simulation */}
        {otpNotice && otpStep && activeTab === 'register' && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <MessageSquareCode className="w-4 h-4 shrink-0" />
              <span>{otpNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setUserEnteredOtp(generatedOtp)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-extrabold shrink-0"
            >
              Autofill
            </button>
          </div>
        )}

        {/* Forgot Password OTP Notification Banner Simulation */}
        {forgotOtpNotice && forgotOtpStep && activeTab === 'forgot' && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>{forgotOtpNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setUserEnteredForgotOtp(generatedForgotOtp)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-extrabold shrink-0"
            >
              Autofill
            </button>
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* FORM CONTAINER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          
          {/* VIEW 1: FORGOT PASSWORD WITH OTP (CUSTOMER) */}
          {isCustomer && activeTab === 'forgot' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-orange-400" />
                  Forgot Password OTP Reset
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                    setSuccessMsg('');
                    setForgotOtpStep(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </div>

              {!forgotOtpStep ? (
                /* Forgot Step 1: Input Mobile Number / Email */
                <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Registered Mobile Number or Email
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210 or name@example.com"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Send Reset OTP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Forgot Step 2: Enter 6-Digit OTP & Set New Password */
                <form onSubmit={handleVerifyForgotOtpAndReset} className="space-y-3.5">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-400">
                      OTP Sent to <strong className="text-white">{forgotIdentifier}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Verification OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={userEnteredForgotOtp}
                      onChange={(e) => setUserEnteredForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 text-center tracking-[0.5em] text-lg font-extrabold font-mono rounded-xl bg-slate-800 border-2 border-orange-500/50 text-orange-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Resend in: <strong className="text-white">{forgotOtpTimer}s</strong></span>
                    {forgotOtpTimer === 0 ? (
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserEnteredForgotOtp(generatedForgotOtp)}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        Autofill ({generatedForgotOtp})
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Create New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || userEnteredForgotOtp.length !== 6}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Updating Password...' : 'Verify OTP & Set New Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotOtpStep(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
                  >
                    ← Edit Mobile Number / Email
                  </button>
                </form>
              )}
            </div>
          ) : isCustomer && activeTab === 'register' ? (
            /* VIEW 2: CUSTOMER REGISTRATION WITH OTP */
            <div>
              {!otpStep ? (
                /* Step 1: Name & Phone number input */
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sahil Shembare"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (For OTP Verification)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number (e.g. 9876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Step 2: Enter 6-Digit OTP */
                <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-2 border border-orange-500/30">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-white">Enter 6-Digit OTP</h3>
                    <p className="text-xs text-slate-400">
                      Sent to <strong>+91 {phone}</strong>
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={userEnteredOtp}
                      onChange={(e) => setUserEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-3 text-center tracking-[0.6em] text-xl font-extrabold font-mono rounded-2xl bg-slate-800 border-2 border-orange-500/50 text-orange-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Resend in: <strong className="text-white">{otpTimer}s</strong></span>
                    {otpTimer === 0 ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserEnteredOtp(generatedOtp)}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        Autofill OTP ({generatedOtp})
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || userEnteredOtp.length !== 6}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Verifying...' : 'Verify OTP & Enter Menu'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
                  >
                    ← Edit Phone Number
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* VIEW 3: STANDARD LOGIN (CUSTOMER / KITCHEN / ADMIN) */
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              
              {/* Quick Autofill Selector (Only for Kitchen & Admin staff testing) */}
              {!isCustomer && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Staff Quick Autofill:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('kitchen@smartdine.com');
                        setPassword('kitchen123456');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                    >
                      👨‍🍳 Kitchen Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@smartdine.com');
                        setPassword('admin123456');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                    >
                      👑 Admin Manager
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isCustomer ? 'Mobile Number or Email' : 'Email Address / Username'}
                </label>
                <div className="relative">
                  {isCustomer ? (
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type="text"
                    required
                    placeholder={isCustomer ? 'e.g. 9876543210 or name@example.com' : 'name@smartdine.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  {isCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setError('');
                        setSuccessMsg('');
                        setForgotOtpStep(false);
                        setForgotIdentifier(email);
                      }}
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : `Sign In to ${roleParam === 'kitchen' ? 'Kitchen Station' : roleParam === 'admin' ? 'Admin Panel' : 'Customer Menu'}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
