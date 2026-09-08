import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  LayoutDashboard, 
  Flame,
  UtensilsCrossed, 
  QrCode, 
  ChefHat, 
  CreditCard,
  Users,
  TicketPercent,
  BarChart3,
  BellRing,
  Settings, 
  LogOut
} from 'lucide-react';

export default function Sidebar({ mode = 'admin' }) {
  const { currentUser, logout } = useAuth();
  const { orders } = useTableOrder();
  const navigate = useNavigate();

  // Active uncompleted orders count
  const activeOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  
  // Pending cash or bill requested count
  const pendingBillCount = orders.filter(o => 
    o.paymentStatus === 'Cash Payment Requested' || 
    o.paymentStatus === 'Bill Requested' ||
    (o.paymentStatus !== 'Paid' && !o.paidAt)
  ).length;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Live Orders', icon: Flame, badge: activeOrdersCount > 0 ? activeOrdersCount : null, badgeColor: 'bg-orange-500' },
    { to: '/admin/tables', label: 'Table Management', icon: QrCode },
    { to: '/admin/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { to: '/admin/payments', label: 'Payments & Bills', icon: CreditCard, badge: pendingBillCount > 0 ? pendingBillCount : null, badgeColor: 'bg-emerald-500' },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/coupons', label: 'Offers & Coupons', icon: TicketPercent },
    { to: '/admin/analytics', label: 'Analytics & Sales', icon: BarChart3 },
    { to: '/admin/notifications', label: 'Notifications', icon: BellRing },
    { to: '/admin/settings', label: 'Restaurant Settings', icon: Settings },
  ];

  const kitchenLinks = [
    { to: '/kitchen', label: 'Kitchen Orders Queue', icon: ChefHat, end: true },
    { to: '/admin', label: 'Return to Admin', icon: LayoutDashboard },
  ];

  const links = mode === 'admin' ? adminLinks : kitchenLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4 shadow-2xl z-20">
      <div className="space-y-5">
        
        {/* User / Staff Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white shadow">
            {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">
              {currentUser?.displayName || 'Admin Console'}
            </h4>
            <span className="inline-block text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {mode === 'admin' ? 'Restaurant Manager' : 'Kitchen Chef'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Operations Console
          </p>
          <div className="space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 custom-scrollbar">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow border border-orange-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-orange-400" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black text-white ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/30 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
}
