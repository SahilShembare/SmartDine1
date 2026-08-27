import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, demoLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/admin';

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      if (user.role === 'kitchen') {
        navigate('/kitchen');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Check email/password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    demoLogin(role);
    if (role === 'kitchen') {
      navigate('/kitchen');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Card Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-glow">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Smart Dine Staff Portal
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access restaurant administrative controls and kitchen live queue
          </p>
        </div>

        {/* 1-Click Fast Login for Demo / Testing */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/40 border border-orange-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
            <Sparkles className="w-4 h-4" />
            <span>Instant Demo Access (1-Click)</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition group"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-white">Admin Portal</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Analytics, Menu, Tables</p>
            </button>

            <button
              onClick={() => handleQuickLogin('kitchen')}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition group"
            >
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-white">Kitchen Portal</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Real-time Cook Station</p>
            </button>
          </div>
        </div>

        {/* Email / Password Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Or Sign In with Firebase Credentials</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@smartdine.com / kitchen@smartdine.com"
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
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/menu" className="text-xs text-slate-400 hover:text-orange-400 transition">
            ← Return to Customer Digital Menu
          </Link>
        </div>

      </div>
    </div>
  );
}
