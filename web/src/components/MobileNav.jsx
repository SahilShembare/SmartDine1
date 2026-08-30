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
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  // Hide bottom mobile nav on Admin and Kitchen pages (Admin uses full sidebar)
  if (isAdminPage) {
    return null;
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#3B2115] border-t border-[#F4B942]/30 px-2 py-1.5 shadow-[0_-4px_20px_rgba(36,20,13,0.25)]">
      <div className="flex items-center justify-around">
        
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-[#F4B942] font-black scale-105'
                : 'text-[#FFF8ED]/70 hover:text-white'
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
                ? 'text-[#F4B942] font-black scale-105'
                : 'text-[#FFF8ED]/70 hover:text-white'
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
                ? 'text-[#F4B942] font-black scale-105'
                : 'text-[#FFF8ED]/70 hover:text-white'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E8752A] text-white font-black text-[9px] flex items-center justify-center shadow-sm">
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
                ? 'text-[#F4B942] font-black scale-105'
                : 'text-[#FFF8ED]/70 hover:text-white'
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
                  ? 'text-[#F4B942] font-black scale-105'
                  : 'text-[#FFF8ED]/70 hover:text-white'
              }`
            }
          >
            <QrCode className="w-5 h-5 mb-0.5 text-[#F4B942]" />
            <span className="text-[10px]">Scan QR</span>
          </NavLink>
        ) : (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-[#F4B942] font-black scale-105'
                  : 'text-[#FFF8ED]/70 hover:text-white'
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
