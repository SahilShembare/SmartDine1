import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  User,
  Home as HomeIcon,
  LogIn
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
    <header className="sticky top-0 z-50 bg-emerald-800 border-b border-emerald-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo (🍽️ SmartDine) */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-sans drop-shadow-sm">
            SmartDine
          </span>
        </Link>

        {/* Center Table Indicator for customer (Only on menu/cart/track) */}
        {currentTable && isCustomerRoute && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/20 border border-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span>Ordering for <strong>Table {currentTable}</strong></span>
            <button 
              onClick={() => {
                if (confirm('Change or disconnect active table?')) {
                  clearTableSession();
                  navigate('/menu');
                }
              }}
              className="ml-1 text-xs text-amber-200 hover:text-white underline cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Top Bar Action Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Home Button */}
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isHomePage 
                ? 'text-amber-300 bg-white/15 shadow-inner' 
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {/* If on Login Page: Show Kitchen & Admin Portal direct login options in Top Bar */}
          {isLoginPage ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login?role=kitchen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
              >
                <ChefHat className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xs:inline">Kitchen</span>
              </Link>

              <Link
                to="/login?role=admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/60 hover:bg-purple-600 text-white text-xs font-bold border border-purple-400/40 transition cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-200" />
                <span className="hidden xs:inline">Admin Portal</span>
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
                    location.pathname === '/menu' ? 'text-white bg-white/20 shadow-inner' : 'text-emerald-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Digital Menu
                </Link>

                {/* Cart button */}
                <Link
                  to="/cart"
                  className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                        <span>Admin</span>
                      </Link>
                    ) : currentUser.role === 'kitchen' ? (
                      <Link
                        to="/kitchen"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                        <span>Kitchen</span>
                      </Link>
                    ) : null}

                    <button
                      onClick={logout}
                      title="Log out"
                      className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-red-600/40 transition"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/login?role=kitchen"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">Kitchen</span>
                    </Link>
                    <Link
                      to="/login?role=admin"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/50 hover:bg-purple-600 text-white text-xs font-semibold border border-purple-400/30 transition"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-purple-200" />
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
