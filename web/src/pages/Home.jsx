import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  ArrowRight, 
  Sparkles, 
  User, 
  QrCode, 
  Lock, 
  CheckCircle2,
  ShieldCheck,
  LogIn
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { currentTable, setTableSession } = useTableOrder();
  const { currentUser, demoLogin } = useAuth();
  
  // Single box role selection: 'customer', 'kitchen', 'admin'
  const [selectedRole, setSelectedRole] = useState('customer');
  const [selectedTable, setSelectedTable] = useState(currentTable || '01');

  const handleProceed = () => {
    if (selectedRole === 'customer') {
      const formatted = String(selectedTable || '01').padStart(2, '0');
      setTableSession(formatted);
      navigate(`/login?role=customer&table=${formatted}`);
    } else if (selectedRole === 'kitchen') {
      navigate('/login?role=kitchen');
    } else if (selectedRole === 'admin') {
      navigate('/login?role=admin');
    }
  };

  const handleInstantDemoLogin = () => {
    if (selectedRole === 'customer') {
      const formatted = String(selectedTable || '01').padStart(2, '0');
      setTableSession(formatted);
      demoLogin('customer');
      navigate(`/menu?table=${formatted}`);
    } else if (selectedRole === 'kitchen') {
      demoLogin('kitchen');
      navigate('/kitchen');
    } else if (selectedRole === 'admin') {
      demoLogin('admin');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      
      {/* Centralized Single Box Card */}
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
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
            Select your role below to proceed to login and portal access
          </p>
        </div>

        {/* 3 Roles Selector inside the single box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Step 1: Choose Your Role
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            
            {/* ROLE 1: CUSTOMER */}
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
                selectedRole === 'customer'
                  ? 'bg-gradient-to-b from-orange-950/60 to-slate-900 border-orange-500 text-white shadow-glow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'customer' && (
                <CheckCircle2 className="w-4 h-4 text-orange-400 absolute top-2 right-2" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedRole === 'customer' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Customer</span>
                <span className="text-[10px] text-slate-400">Table QR & Menu</span>
              </div>
            </button>

            {/* ROLE 2: KITCHEN */}
            <button
              type="button"
              onClick={() => setSelectedRole('kitchen')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
                selectedRole === 'kitchen'
                  ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'kitchen' && (
                <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-2 right-2" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedRole === 'kitchen' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Kitchen</span>
                <span className="text-[10px] text-slate-400">Chef Orders Queue</span>
              </div>
            </button>

            {/* ROLE 3: ADMIN */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 relative ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-b from-purple-950/60 to-slate-900 border-purple-500 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {selectedRole === 'admin' && (
                <CheckCircle2 className="w-4 h-4 text-purple-400 absolute top-2 right-2" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedRole === 'admin' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold">Admin</span>
                <span className="text-[10px] text-slate-400">Full Controls</span>
              </div>
            </button>

          </div>
        </div>

        {/* Role Specific Configuration / Details */}
        {selectedRole === 'customer' && (
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-orange-400" />
                Select Dine-In Table Number:
              </span>
              <span className="text-orange-400 font-extrabold">Table {selectedTable}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => {
                    setSelectedTable(tbl);
                    setTableSession(tbl);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                    selectedTable === tbl 
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Scanning Table QR automatically selects this table and opens your digital menu.
            </p>
          </div>
        )}

        {selectedRole === 'kitchen' && (
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Kitchen Staff Live Station Access</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with your kitchen staff credentials to view live incoming orders, play bell alerts, and update dish cooking stages.
            </p>
          </div>
        )}

        {selectedRole === 'admin' && (
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Restaurant Master Administrator Access</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in as Administrator to access sales analytics, manage food dishes & categories, and generate high-res table QR standees.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleProceed}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>
              Proceed to {selectedRole === 'customer' ? `Customer Login (Table ${selectedTable})` : selectedRole === 'kitchen' ? 'Kitchen Login' : 'Admin Login'}
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
