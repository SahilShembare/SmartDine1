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
  MessageSquareCode
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, registerWithEmail, demoLogin } = useAuth();
  const { currentTable, setTableSession } = useTableOrder();
  
  // URL params
  const tableParam = searchParams.get('table');
  const roleParam = searchParams.get('role') || 'customer'; // 'customer', 'kitchen', 'admin'
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  // State
  const [activeTab, setActiveTab] = useState(initialMode); // 'login' or 'register'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(roleParam === 'customer' ? 'customer@smartdine.com' : roleParam === 'kitchen' ? 'kitchen@smartdine.com' : 'admin@smartdine.com');
  const [password, setPassword] = useState(roleParam === 'customer' ? 'customer123456' : roleParam === 'kitchen' ? 'kitchen123456' : 'admin123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state for Create Account
  const [otpStep, setOtpStep] = useState(false); // false: phone/details input, true: enter OTP
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpNotice, setOtpNotice] = useState('');

  if (tableParam && !currentTable) {
    setTableSession(tableParam);
  }

  const defaultDestination = roleParam === 'kitchen' 
    ? '/kitchen' 
    : roleParam === 'admin' 
    ? '/admin' 
    : (tableParam || currentTable ? `/menu?table=${tableParam || currentTable}` : '/menu');
  const from = location.state?.from?.pathname || defaultDestination;

  // OTP Countdown timer
  useEffect(() => {
    let interval;
    if (otpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Generate random 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpStep(true);
    setOtpTimer(60);
    setOtpNotice(`📱 SMS Sent! Your Smart Dine verification OTP is: ${code}`);
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (userEnteredOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code. Please enter the correct 6-digit code or click resend.');
      return;
    }

    setLoading(true);
    try {
      // Create user email from phone if email not explicitly given
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

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      if (user.role === 'kitchen') {
        navigate('/kitchen');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
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
              : 'Customer Dining Access'}
          </h1>
          <p className="text-xs text-slate-400">
            {isCustomer 
              ? 'Login or create a new account with mobile OTP verification to start ordering' 
              : 'Authorized personnel access only'}
          </p>
        </div>

        {/* Customer 2 Options: [Login] vs [Create Account with OTP] */}
        {isCustomer && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
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

        {/* OTP Notification Banner Simulation */}
        {otpNotice && otpStep && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <MessageSquareCode className="w-4 h-4 shrink-0" />
              <span>{otpNotice}</span>
            </div>
            <button
              onClick={() => setUserEnteredOtp(generatedOtp)}
              className="px-2 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-extrabold shrink-0"
            >
              Autofill
            </button>
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
          
          {/* OPTION A: CUSTOMER REGISTRATION WITH OTP */}
          {isCustomer && activeTab === 'register' ? (
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
            /* OPTION B: STANDARD LOGIN (FOR CUSTOMER / KITCHEN / ADMIN) */
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              
              {/* Quick Autofill Selector for Fast Testing */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Autofill Credentials:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('customer@smartdine.com');
                      setPassword('customer123456');
                    }}
                    className="py-1 px-2 rounded-lg bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 border border-orange-500/30 text-[11px] font-semibold transition"
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('kitchen@smartdine.com');
                      setPassword('kitchen123456');
                    }}
                    className="py-1 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
                  >
                    Kitchen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@smartdine.com');
                      setPassword('admin123456');
                    }}
                    className="py-1 px-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition"
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address / Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="name@smartdine.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
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
