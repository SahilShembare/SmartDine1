import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Layers, 
  QrCode, 
  ChefHat, 
  ShoppingBag, 
  TrendingUp, 
  Settings, 
  LogOut,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ mode = 'admin' }) {
  const { currentUser, logout } = useAuth();

  const adminLinks = [
    { to: '/admin', label: 'Overview & Analytics', icon: LayoutDashboard, end: true },
    { to: '/admin/menu', label: 'Food Menu Items', icon: UtensilsCrossed },
    { to: '/admin/categories', label: 'Categories', icon: Layers },
    { to: '/admin/tables', label: 'Tables & QR Codes', icon: QrCode },
    { to: '/kitchen', label: 'Kitchen Live View', icon: ChefHat },
  ];

  const kitchenLinks = [
    { to: '/kitchen', label: 'Active Kitchen Orders', icon: ChefHat, end: true },
    { to: '/admin', label: 'Admin Management', icon: LayoutDashboard },
    { to: '/menu', label: 'Digital Menu Preview', icon: UtensilsCrossed },
  ];

  const links = mode === 'admin' ? adminLinks : kitchenLinks;

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-white shadow">
            {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">
              {currentUser?.displayName || 'Smart Dine Staff'}
            </h4>
            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {mode === 'admin' ? 'Administrator' : 'Kitchen Chef'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Live Fallback Web Menu Link */}
        <div className="pt-2 border-t border-slate-800/80">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Customer Interface
          </p>
          <Link
            to="/menu?table=01"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 group transition"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Customer Web Menu
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
          </Link>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
