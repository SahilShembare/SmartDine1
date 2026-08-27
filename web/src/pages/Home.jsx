import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  ArrowRight, 
  Sparkles, 
  User, 
  CheckCircle2,
  LogIn
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  
  // Single box role selection: 'customer', 'kitchen', 'admin'
  const [selectedRole, setSelectedRole] = useState('customer');

  const handleProceedToLogin = () => {
    navigate(`/login?role=${selectedRole}`);
  };

  const handleInstantDemoLogin = () => {
    demoLogin(selectedRole);
    if (selectedRole === 'customer') {
      navigate('/menu?table=01');
    } else if (selectedRole === 'kitchen') {
      navigate('/kitchen');
    } else if (selectedRole === 'admin') {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      
      {/* Centralized Single Box Card */}
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-glow">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SMART DINE
          </h1>
          <p className="text-xs text-slate-400">
            Select your role to sign in and enter your portal
          </p>
        </div>

        {/* 3 Roles Selector inside the single box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 text-center">
            Select Your Role
          </label>

          <div className="grid grid-cols-3 gap-3">
            
            {/* ROLE 1: CUSTOMER */}
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-gradient-to-b from-orange-950/60 to-slate-900 border-orange-500 text-white shadow-glow ring-2 ring-orange-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'customer' && (
                <CheckCircle2 className="w-4 h-4 text-orange-400 absolute top-2 right-2" />
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                selectedRole === 'customer' ? 'bg-orange-500 text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Customer</span>
                <span className="text-[10px] text-slate-400">Diner Menu</span>
              </div>
            </button>

            {/* ROLE 2: KITCHEN */}
            <button
              type="button"
              onClick={() => setSelectedRole('kitchen')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                selectedRole === 'kitchen'
                  ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-500 text-white shadow-lg ring-2 ring-amber-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'kitchen' && (
                <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-2 right-2" />
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                selectedRole === 'kitchen' ? 'bg-amber-500 text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}>
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Kitchen</span>
                <span className="text-[10px] text-slate-400">Chef Queue</span>
              </div>
            </button>

            {/* ROLE 3: ADMIN */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-b from-purple-950/60 to-slate-900 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'admin' && (
                <CheckCircle2 className="w-4 h-4 text-purple-400 absolute top-2 right-2" />
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                selectedRole === 'admin' ? 'bg-purple-500 text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Admin</span>
                <span className="text-[10px] text-slate-400">Management</span>
              </div>
            </button>

          </div>
        </div>

        {/* Selected Role Description Pill */}
        <div className="text-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          {selectedRole === 'customer' && '🍽️ Browse digital menu, place dine-in table orders, and watch live tracking.'}
          {selectedRole === 'kitchen' && '👨‍🍳 Live cooking queue, order sound chimes, and food preparation status.'}
          {selectedRole === 'admin' && '👑 Sales analytics, food dishes CRUD, categories, and table QR generator.'}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleProceedToLogin}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>
              Proceed to {selectedRole === 'customer' ? 'Customer Login' : selectedRole === 'kitchen' ? 'Kitchen Staff Login' : 'Administrator Login'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleInstantDemoLogin}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Fast 1-Click {selectedRole === 'customer' ? 'Customer' : selectedRole === 'kitchen' ? 'Kitchen' : 'Admin'} Access</span>
          </button>
        </div>

      </div>

    </div>
  );
}
