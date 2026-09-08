import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  User,
  ChefHat,
  LayoutDashboard,
  QrCode
} from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();
  const { cartItemCount } = useTableOrder();
  const { currentUser } = useAuth();

  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isScanPage = location.pathname === '/scan';
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  // Hide bottom mobile nav on Admin, Kitchen, Home, Login, and Scan pages
  if (isAdminPage || isHomePage || isLoginPage || isScanPage) {
    return null;
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around">
        
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-amber-400 font-black scale-105'
                : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* Tab 2: Menu */}
        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-amber-400 font-black scale-105'
                : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </NavLink>

        {/* Tab 3: Cart with badge */}
        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              isActive
                ? 'text-amber-400 font-black scale-105'
                : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </NavLink>

        {/* Tab 4: Track Order */}
        <NavLink
          to="/track/demo"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-amber-400 font-black scale-105'
                : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Live Order</span>
        </NavLink>

        {/* Tab 5: On Home show "Scan QR" instead of profile, on menu/cart show Profile */}
        {isHomePage ? (
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <QrCode className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px]">Scan QR</span>
          </NavLink>
        ) : (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Profile</span>
          </NavLink>
        )}

      </div>
    </nav>
  );
}
