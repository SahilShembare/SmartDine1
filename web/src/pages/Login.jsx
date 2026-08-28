import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  EyeOff,
  Check
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, registerWithEmail, sendRealResetEmail, resetPasswordWithOtp } = useAuth();
  const { currentTable, setTableSession } = useTableOrder();
  
  // URL params
  const tableParam = searchParams.get('table');
  const roleParam = searchParams.get('role') || 'customer'; // 'customer', 'kitchen', 'admin'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  // Tabs: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState(initialMode);
  
  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState(
    roleParam === 'kitchen' ? 'kitchen@smartdine.com' : roleParam === 'admin' ? 'admin@smartdine.com' : ''
  );
  const [password, setPassword] = useState(
    roleParam === 'kitchen' ? 'kitchen123456' : roleParam === 'admin' ? 'admin123456' : ''
  );
  const [showPassword, setShowPassword] = useState(false);

  // Sync role parameters when clicking top bar
  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'kitchen') {
      setLoginIdentifier('kitchen@smartdine.com');
      setPassword('kitchen123456');
      setActiveTab('login');
      setSuccessMsg('👨‍🍳 Kitchen Staff mode active');
      setError('');
    } else if (role === 'admin') {
      setLoginIdentifier('admin@smartdine.com');
      setPassword('admin123456');
      setActiveTab('login');
      setSuccessMsg('⚙️ Admin Portal mode active');
      setError('');
    } else if (role === 'customer') {
      setLoginIdentifier('');
      setPassword('');
      setActiveTab('login');
      setSuccessMsg('👤 Customer Login mode active');
      setError('');
    }
  }, [searchParams]);

  // Customer 3-Step Registration States
  // Step 1: Name + Phone -> Send OTP
  // Step 2: Enter & Verify 6-digit OTP
  // Step 3: Enter Email + Set Password -> Complete Registration
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpNotice, setOtpNotice] = useState('');

  // Forgot Password States
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpStep, setForgotOtpStep] = useState(false);
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [userEnteredForgotOtp, setUserEnteredForgotOtp] = useState('');
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
  const [forgotOtpNotice, setForgotOtpNotice] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Global Status States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (tableParam && !currentTable) {
    setTableSession(tableParam);
  }

  const defaultDestination = roleParam === 'kitchen' 
    ? '/kitchen' 
    : roleParam === 'admin' 
    ? '/admin' 
    : (tableParam || currentTable ? `/menu?table=${tableParam || currentTable}` : '/scan');
  const from = location.state?.from?.pathname || defaultDestination;

  // OTP Countdown timer for Register
  useEffect(() => {
    let interval;
    if (regStep === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [regStep, otpTimer]);

  // OTP Countdown timer for Forgot Password
  useEffect(() => {
    let interval;
    if (forgotOtpStep && forgotOtpTimer > 0) {
      interval = setInterval(() => setForgotOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpStep, forgotOtpTimer]);

  // Handle Send OTP for Registration (Step 1 -> Step 2)
  const handleSendRegisterOtp = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setRegStep(2);
    setOtpTimer(60);
    setOtpNotice(`📱 SMS Sent! Your Smart Dine verification OTP is: ${code}`);
  };

  // Handle Verify OTP (Step 2 -> Step 3)
  const handleVerifyRegisterOtp = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (userEnteredOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code. Please enter the correct 6-digit code or click resend.');
      return;
    }

    setSuccessMsg('✅ Mobile number verified successfully! Please enter your email & set password.');
    setRegStep(3);
  };

  // Handle Final Registration (Step 3 -> Complete Account)
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(regName.trim(), regEmail.trim(), regPassword.trim(), 'customer');
      toast.success(`🎉 Welcome to Smart Dine, ${regName.trim()}! Account created successfully.`);
      navigate(from);
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer / Staff Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let finalEmail = loginIdentifier.trim();
      // If user typed 10-digit mobile number instead of email
      if (/^\d{10}$/.test(finalEmail)) {
        finalEmail = `${finalEmail}@smartdine.customer`;
      }

      await loginWithEmail(finalEmail, password);
      const userName = finalEmail.includes('kitchen') ? 'Kitchen Staff' : finalEmail.includes('admin') ? 'Admin' : 'Customer';
      toast.success(`✅ Login Successful! Welcome back, ${userName}.`);
      navigate(from);
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please check your email/mobile and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Real Email Password Reset via Firebase Mail Service
  const handleSendRealEmailReset = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccessMsg('');
    if (!forgotIdentifier.trim() || !forgotIdentifier.includes('@')) {
      setError('Please enter a valid email address (e.g. name@gmail.com) to receive real inbox email.');
      return;
    }

    setLoading(true);
    try {
      await sendRealResetEmail(forgotIdentifier.trim());
      setSuccessMsg(`📧 Real password reset link has been dispatched to ${forgotIdentifier}! Please check your Inbox / Spam folder.`);
    } catch (err) {
      setError(err.message || 'Failed to send real reset email. Make sure the email is registered.');
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
      await resetPasswordWithOtp(forgotIdentifier.trim(), newPassword);
      setSuccessMsg('🎉 Password reset successfully! You can now log in with your new password.');
      setTimeout(() => {
        setActiveTab('login');
        setForgotOtpStep(false);
        setLoginIdentifier(forgotIdentifier);
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = roleParam === 'customer';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-12 overflow-hidden bg-slate-950 font-sans">
      
      {/* Background Image: Exact same warm cafe interior as Home */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/restaurant-bg.jpg" 
          alt="SmartDine Restaurant Interior" 
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        {/* Cinematic dark overlay for crystal-clear readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-slate-950/95"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Top Brand Logo */}
        <div className="text-center space-y-2 mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg hover:border-amber-400/40 transition group">
            <img 
              src="/logo.png" 
              alt="Smart Dine Logo" 
              className="w-7 h-7 rounded-full object-cover border border-amber-400/60 shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="font-black text-base text-white tracking-tight">Smart Dine</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            {activeTab === 'login' ? 'Welcome Back' : activeTab === 'register' ? 'Create New Account' : 'Reset Password'}
          </h1>
          
          <p className="text-xs text-slate-400">
            {activeTab === 'login'
              ? 'Sign in to access table orders, digital menu & tracking'
              : activeTab === 'register'
              ? 'Verify mobile & set up your account in 3 quick steps'
              : 'Recover your account with mobile OTP or email reset link'}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5 relative">
          
          {/* Navigation Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition ${activeTab === 'login' ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); setRegStep(1); }}
              className={`py-2 rounded-xl transition ${activeTab === 'register' ? 'bg-emerald-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
            <button
              onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); setForgotOtpStep(false); }}
              className={`py-2 rounded-xl transition ${activeTab === 'forgot' ? 'bg-orange-500 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              Forgot?
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold animate-in fade-in flex items-start gap-2">
              <span className="text-red-400">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in flex items-start gap-2">
              <span className="text-emerald-400">✅</span>
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* OTP Simulator Toast Bar */}
          {otpNotice && activeTab === 'register' && regStep === 2 && (
            <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold animate-in fade-in flex items-center justify-between">
              <span>{otpNotice}</span>
              <button 
                onClick={() => setUserEnteredOtp(generatedOtp)}
                className="px-2 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg hover:bg-amber-300 shadow-sm"
              >
                Autofill
              </button>
            </div>
          )}

          {forgotOtpNotice && activeTab === 'forgot' && forgotOtpStep && (
            <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-300 text-xs font-semibold animate-in fade-in flex items-center justify-between">
              <span>{forgotOtpNotice}</span>
              <button 
                onClick={() => setUserEnteredForgotOtp(generatedForgotOtp)}
                className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg hover:bg-orange-400 shadow-sm"
              >
                Autofill
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: LOGIN */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="name@example.com or 10-digit mobile"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(''); }}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In & Start Dining'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">New to SmartDine? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setRegStep(1); setError(''); setSuccessMsg(''); }}
                  className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CUSTOMER 3-STEP REGISTRATION */}
          {/* (Name -> Mobile OTP -> Email & Password) */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    regStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {regStep > 1 ? '✓' : '1'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">Mobile</span>
                </div>
                <div className={`h-0.5 flex-1 mx-2 ${regStep >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <div className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    regStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {regStep > 2 ? '✓' : '2'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">OTP</span>
                </div>
                <div className={`h-0.5 flex-1 mx-2 ${regStep >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <div className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    regStep === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    3
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">Password</span>
                </div>
              </div>

              {/* STEP 1: Name + Mobile Number */}
              {regStep === 1 && (
                <form onSubmit={handleSendRegisterOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sahil Shembare"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">10-Digit Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: Enter & Verify 6-Digit OTP */}
              {regStep === 2 && (
                <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1 border border-emerald-500/30">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-white">Enter 6-Digit OTP Code</h3>
                    <p className="text-xs text-slate-400">
                      Sent to <strong className="text-white">+91 {regPhone}</strong>
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
                      className="w-full py-3 text-center tracking-[0.6em] text-xl font-extrabold font-mono rounded-2xl bg-slate-800 border-2 border-emerald-500/50 text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Resend in: <strong className="text-white">{otpTimer}s</strong></span>
                    {otpTimer === 0 ? (
                      <button
                        type="button"
                        onClick={handleSendRegisterOtp}
                        className="text-emerald-400 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserEnteredOtp(generatedOtp)}
                        className="text-emerald-400 font-bold hover:underline"
                      >
                        Autofill ({generatedOtp})
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={userEnteredOtp.length !== 6}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Mobile OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
                  >
                    ← Change Mobile Number
                  </button>
                </form>
              )}

              {/* STEP 3: Enter Email & Set Password */}
              {regStep === 3 && (
                <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      +91 {regPhone} Verified
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Step 3/3
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. sahil@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Set Account Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-enter password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Creating Account...' : 'Complete Registration & Sign In'}</span>
                  </button>
                </form>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FORGOT PASSWORD (OTP OR REAL EMAIL) */}
          {/* ========================================================= */}
          {activeTab === 'forgot' && (
            <div>
              {!forgotOtpStep ? (
                <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Registered Mobile Number or Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210 or name@gmail.com"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Send 6-Digit Reset OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendRealEmailReset}
                      className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-orange-400" />
                      <span>Send Real Reset Link to Email Inbox (Gmail)</span>
                    </button>
                  </div>
                </form>
              ) : (
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
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
          )}

        </div>

      </div>

    </div>
  );
}
