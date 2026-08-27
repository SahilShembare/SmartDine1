import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  QrCode, 
  ChefHat, 
  LayoutDashboard, 
  ArrowRight, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Lock,
  CheckCircle2,
  Table
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { currentTable, setTableSession, tables } = useTableOrder();
  const { currentUser, demoLogin } = useAuth();
  const [selectedTable, setSelectedTable] = useState(currentTable || '01');
  const [accessDeniedMsg, setAccessDeniedMsg] = useState('');

  const handleCustomerLaunch = (tableNum) => {
    const formatted = String(tableNum || selectedTable || '01').padStart(2, '0');
    setTableSession(formatted);
    if (!currentUser) {
      demoLogin('customer');
    }
    navigate(`/menu?table=${formatted}`);
  };

  const handleKitchenLaunch = () => {
    if (currentUser?.role === 'customer') {
      setAccessDeniedMsg('Access Denied: Customer accounts cannot access the Kitchen live queue. Please sign in as Kitchen Staff.');
      setTimeout(() => setAccessDeniedMsg(''), 4000);
      return;
    }
    if (!currentUser) {
      demoLogin('kitchen');
    }
    navigate('/kitchen');
  };

  const handleAdminLaunch = () => {
    if (currentUser?.role === 'customer' || currentUser?.role === 'kitchen') {
      setAccessDeniedMsg('Access Denied: Staff accounts cannot access the Admin Management. Please sign in as Administrator.');
      setTimeout(() => setAccessDeniedMsg(''), 4000);
      return;
    }
    if (!currentUser) {
      demoLogin('admin');
    }
    navigate('/admin');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      <div className="max-w-5xl mx-auto w-full space-y-8 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Your Portal to Proceed</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            SMART DINE{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Platform
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Choose your role below to access the contactless customer menu, live kitchen cooking queue, or restaurant administration.
          </p>
        </div>

        {/* Access Denied Toast Notice */}
        {accessDeniedMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-semibold text-center max-w-xl mx-auto flex items-center justify-center gap-2 animate-bounce">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{accessDeniedMsg}</span>
          </div>
        )}

        {/* 3 Main Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ROLE 1: CUSTOMER (DINER) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-orange-950/30 border-2 border-orange-500/50 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition"></div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-glow">
                  <User className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-extrabold border border-orange-500/30 uppercase">
                  Role 1: Customer
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">Dine-In Customer</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Scan table QR code to automatically connect your table, browse digital menu, order food, and track live cooking.
                </p>
              </div>

              {/* Table Auto Selector */}
              <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-orange-400" />
                    Table QR Detected:
                  </span>
                  <span className="text-orange-400 font-extrabold">Table {selectedTable}</span>
                </div>

                <div className="grid grid-cols-5 gap-1 pt-1">
                  {['01', '02', '03', '04', '05'].map((tbl) => (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => {
                        setSelectedTable(tbl);
                        setTableSession(tbl);
                      }}
                      className={`py-1 rounded-lg text-xs font-bold transition border ${
                        selectedTable === tbl 
                          ? 'bg-orange-500 text-white border-orange-400' 
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCustomerLaunch(selectedTable)}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Scan QR / Open Menu (Table {selectedTable})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ROLE 2: KITCHEN (CHEF) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 hover:border-amber-500/50 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white flex items-center justify-center shadow-lg">
                  <ChefHat className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-extrabold border border-amber-500/30 uppercase">
                  Role 2: Kitchen
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">Kitchen Chef Station</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time ticket queue for chefs. Receive incoming orders with audio bells, accept tickets, update cooking stages, and complete dishes.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protected Role Access</span>
                </div>
                <p className="text-[11px]">Customers cannot access kitchen controls.</p>
              </div>
            </div>

            <button
              onClick={handleKitchenLaunch}
              className="mt-6 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 group-hover:border-amber-500/50"
            >
              <span>Kitchen Live Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ROLE 3: ADMIN (MANAGER) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/30 border border-slate-800 hover:border-purple-500/50 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[11px] font-extrabold border border-purple-500/30 uppercase">
                  Role 3: Admin
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">Admin Management</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Full control over restaurant revenue metrics, food menu CRUD, category management, and high-resolution printable table QR standees.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Master Administrator</span>
                </div>
                <p className="text-[11px]">Customers and kitchen staff cannot modify dishes or tables.</p>
              </div>
            </div>

            <button
              onClick={handleAdminLaunch}
              className="mt-6 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 group-hover:border-purple-500/50"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pt-6">
        <p>SMART DINE • 3-Tier Role System (Customer, Kitchen, Admin)</p>
      </footer>

    </div>
  );
}
