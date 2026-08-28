import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  UtensilsCrossed, 
  QrCode, 
  ShoppingBag, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout, demoLogin } = useAuth();
  const { currentTable, cartItemCount, clearTableSession } = useTableOrder();
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerRoute = location.pathname === '/' || 
                          location.pathname === '/menu' || 
                          location.pathname === '/cart' || 
                          location.pathname.startsWith('/track');

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                SMART DINE
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">Smart Ordering. Faster Dining.</p>
          </div>
        </Link>

        {/* Center Table Indicator for customer */}
        {currentTable && isCustomerRoute && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Ordering for <strong>Table {currentTable}</strong></span>
            <button 
              onClick={() => {
                if (confirm('Change or disconnect active table?')) {
                  clearTableSession();
                  navigate('/menu');
                }
              }}
              className="ml-1 text-xs text-slate-400 hover:text-emerald-300 underline"
            >
              Change
            </button>
          </div>
        )}

        {/* Navigation & Action buttons */}
        <div className="flex items-center gap-3">
          {/* Fallback quick links */}
          <Link
            to="/menu"
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              location.pathname === '/menu' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Digital Menu
          </Link>

          {/* Cart button */}
          <Link
            to="/cart"
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium shadow-glow transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-white text-emerald-700 font-bold text-xs">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Admin / Kitchen shortcuts */}
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                  Admin
                </Link>
              ) : currentUser.role === 'kitchen' ? (
                <Link
                  to="/kitchen"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80"
                >
                  <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                  Kitchen
                </Link>
              ) : null}

              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Staff Login
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
