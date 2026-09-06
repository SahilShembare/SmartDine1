import React, { useState } from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LayoutDashboard, ChefHat, ArrowRight, Sparkles, LogIn, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProtectedRoute({ children, allowedRoles = ['admin', 'kitchen'] }) {
  const { currentUser, loading, loginWithEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If user is already authenticated with the correct role, grant access
  if (currentUser && allowedRoles.includes(currentUser.role)) {
    return children;
  }

  // Fast 1-click Demo Admin login
  const handleQuickAdminLogin = async () => {
    setLoggingIn(true);
    try {
      await loginWithEmail('admin@smartdine.com', 'admin123456');
      toast.success('👑 Welcome to SmartDine Admin Dashboard!', { icon: '✨' });
    } catch (err) {
      toast.error('Quick login failed, redirecting to login form...');
      navigate('/login?role=admin');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleQuickKitchenLogin = async () => {
    setLoggingIn(true);
    try {
      await loginWithEmail('kitchen@smartdine.com', 'kitchen123456');
      toast.success('👨‍🍳 Welcome to Kitchen Display Console!');
    } catch (err) {
      toast.error('Kitchen login failed.');
      navigate('/login?role=kitchen');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('/restaurant-bg.jpg')`
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E8752A] to-[#F4B942] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin & Staff Access</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {allowedRoles.includes('admin') 
            ? 'Sign in to access restaurant analytics, orders, menu control & AI Command Center.' 
            : 'Authorized kitchen staff only.'}
        </p>

        {currentUser && (
          <div className="mb-6 p-3 rounded-xl bg-orange-50 border border-orange-200 text-left text-xs">
            <p className="text-slate-600 font-medium">
              Currently signed in as: <strong className="text-slate-900">{currentUser.displayName || currentUser.email}</strong>
            </p>
            <p className="text-orange-700 text-[11px] mt-0.5 font-bold">
              Role: {currentUser.role || 'customer'} (Requires: {allowedRoles.join(' or ')})
            </p>
          </div>
        )}

        <div className="space-y-3">
          {allowedRoles.includes('admin') && (
            <button
              onClick={handleQuickAdminLogin}
              disabled={loggingIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#E8752A] to-[#F4B942] hover:brightness-110 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{loggingIn ? 'Authenticating...' : '🚀 Enter Admin Dashboard (1-Click)'}</span>
            </button>
          )}

          {allowedRoles.includes('kitchen') && (
            <button
              onClick={handleQuickKitchenLogin}
              disabled={loggingIn}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-[#F4B942]" />
              <span>Enter Kitchen Monitor</span>
            </button>
          )}

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <Link 
              to="/login" 
              className="font-bold text-[#E8752A] hover:underline flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Standard Login</span>
            </Link>

            <Link 
              to="/menu" 
              className="font-medium text-slate-500 hover:text-slate-800"
            >
              Return to Menu →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
