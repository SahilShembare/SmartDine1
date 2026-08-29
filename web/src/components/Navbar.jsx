import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import SmartDineLogo from './SmartDineLogo';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  User,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { currentTable, cartItemCount, clearTableSession } = useTableOrder();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isCustomerRoute = location.pathname === '/menu' || 
                          location.pathname === '/cart' || 
                          location.pathname.startsWith('/track');

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-emerald-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="group">
          <SmartDineLogo size="md" />
        </Link>

        {/* Center Table Indicator for customer */}
        {currentTable && isCustomerRoute && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium backdrop-blur-md shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Table <strong className="text-white font-bold">{currentTable}</strong></span>
            <button 
              onClick={() => {
                if (confirm('Change active table session?')) {
                  clearTableSession();
                  navigate('/menu');
                }
              }}
              className="ml-1 text-xs text-amber-300 hover:text-white underline cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Top Bar Action Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Home Button (Hidden on Home page, visible on other pages) */}
          {!isHomePage && (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          )}

          {/* If on Login Page: Show Customer, Kitchen & Admin Portal direct login options in Top Bar */}
          {isLoginPage ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login?role=customer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-extrabold border border-amber-400/40 transition cursor-pointer shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="inline">Customer</span>
              </Link>

              <Link
                to="/login?role=kitchen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-extrabold border border-emerald-500/40 transition cursor-pointer shadow-sm"
              >
                <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Kitchen</span>
              </Link>

              <Link
                to="/login?role=admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-extrabold border border-purple-500/40 transition cursor-pointer shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden xs:inline">Admin</span>
              </Link>
            </div>
          ) : (
            /* Regular navigation on Customer / Menu routes */
            !isHomePage && (
              <>
                {/* Digital Menu */}
                <Link
                  to="/menu"
                  className={`hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === '/menu' 
                      ? 'text-amber-300 bg-amber-400/15 border border-amber-400/30' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  Digital Menu
                </Link>

                {/* Cart button */}
                <Link
                  to="/cart"
                  className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.35)] transition active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-slate-950 text-amber-400 font-extrabold text-[11px]">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Staff / Profile */}
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    {currentUser.role === 'admin' ? (
                      <Link
                        to="/admin"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-500/40 transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin</span>
                      </Link>
                    ) : currentUser.role === 'kitchen' ? (
                      <Link
                        to="/kitchen"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kitchen</span>
                      </Link>
                    ) : null}

                    <button
                      onClick={logout}
                      title="Log out"
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-red-600/40 transition"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/login?role=kitchen"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Kitchen</span>
                    </Link>
                    <Link
                      to="/login?role=admin"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-xs font-bold border border-purple-500/30 transition"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  </div>
                )}
              </>
            )
          )}

        </div>

      </div>
    </header>
  );
}
