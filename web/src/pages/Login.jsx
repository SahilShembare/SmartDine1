import React, { useState } from 'react';
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
  KeyRound,
  UserPlus
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithEmail, registerWithEmail, demoLogin } = useAuth();
  const { currentTable, setTableSession } = useTableOrder();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Preserve table & role query params
  const tableParam = searchParams.get('table');
  const roleParam = searchParams.get('role'); // 'customer', 'kitchen', 'admin'
  if (tableParam && !currentTable) {
    setTableSession(tableParam);
  }

  const defaultDestination = roleParam === 'kitchen' ? '/kitchen' : roleParam === 'admin' ? '/admin' : (tableParam || currentTable ? `/menu?table=${tableParam || currentTable}` : '/menu');
  const from = location.state?.from?.pathname || defaultDestination;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const user = await registerWithEmail(name, email, password, roleParam || 'customer');
        navigate(from);
      } else {
        const user = await loginWithEmail(email, password);
        if (user.role === 'kitchen') {
          navigate('/kitchen');
        } else if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(from);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    demoLogin(role);
    if (role === 'kitchen') {
      navigate('/kitchen');
    } else if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate(from);
    }
  };

  const portalTitle = roleParam === 'kitchen' 
    ? 'Kitchen Staff Sign In' 
    : roleParam === 'admin' 
    ? 'Administrator Sign In' 
    : isRegister 
    ? 'Create Smart Dine Account' 
    : 'Diner Sign In';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Card Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-glow">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {portalTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister 
              ? 'Register to browse the digital menu and place restaurant table orders' 
              : 'Login is required to view the digital menu and order food'}
          </p>
        </div>

        {/* 1-Click Fast Login / Autofill for Instant Testing */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/40 border border-orange-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Autofill Registered Account</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Password: 123456</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('customer@smartdine.com');
                setPassword('customer123456');
                setIsRegister(false);
              }}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-glow text-center transition"
            >
              <User className="w-4 h-4 mx-auto mb-1" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('kitchen@smartdine.com');
                setPassword('kitchen123456');
                setIsRegister(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition"
            >
              <ChefHat className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <span className="text-[11px] font-semibold">Kitchen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@smartdine.com');
                setPassword('admin123456');
                setIsRegister(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition"
            >
              <LayoutDashboard className="w-4 h-4 mx-auto mb-1 text-orange-400" />
              <span className="text-[11px] font-semibold">Admin</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isRegister ? 'New Customer Registration' : 'Email & Password Sign In'}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-bold text-orange-400 hover:underline"
            >
              {isRegister ? 'Have an account? Login' : 'Create an Account'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Register & Open Menu' : 'Sign In & Open Menu'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
