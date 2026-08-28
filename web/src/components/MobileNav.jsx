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
  LayoutDashboard
} from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();
  const { cartItemCount } = useTableOrder();
  const { currentUser } = useAuth();

  // Don't show on admin full-screen pages if sidebar is preferred or keep for quick switching
  const isAdminOrKitchen = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around">
        
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-sm">
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
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Live Order</span>
        </NavLink>

        {/* Tab 5: Account / Staff Portal */}
        {currentUser ? (
          currentUser.role === 'admin' ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Admin</span>
            </NavLink>
          ) : (
            <NavLink
              to="/kitchen"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <ChefHat className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Kitchen</span>
            </NavLink>
          )
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Login</span>
          </NavLink>
        )}

      </div>
    </nav>
  );
}
