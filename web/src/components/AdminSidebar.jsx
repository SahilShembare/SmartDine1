import React from 'react';
import { 
  LayoutDashboard, 
  ChefHat, 
  UtensilsCrossed, 
  Grid3X3, 
  Users, 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Bot, 
  Settings, 
  LogOut, 
  X, 
  Utensils,
  MessageSquareHeart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import { useNavigate } from 'react-router-dom';

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen 
}) {
  const { logout } = useAuth();
  const { orders = [], customerFeedbacks = [] } = useTableOrder();
  const navigate = useNavigate();

  const activeKitchenCount = orders.filter(o => {
    const s = String(o.status || '').toLowerCase();
    return s === 'pending' || s === 'preparing' || s === 'ready';
  }).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'kitchen', 
      label: '🍳 Kitchen Updates', 
      icon: ChefHat, 
      badge: activeKitchenCount > 0 ? `${activeKitchenCount} active` : null,
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables', icon: Grid3X3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { 
      id: 'feedback', 
      label: '⭐ Customer Feedback', 
      icon: MessageSquareHeart, 
      badge: customerFeedbacks.length > 0 ? `${customerFeedbacks.length}` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'sales-analysis', label: '📈 Sales Analysis', icon: TrendingUp },
    { 
      id: 'ai', 
      label: '🤖 AI Assistant', 
      icon: Bot,
      badge: 'AI',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white text-slate-700">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                Smart<span className="text-emerald-600">Dine</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Restaurant Admin
              </span>
            </div>
          </div>
          {setMobileOpen && (
            <button 
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-5 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-4 border-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Logout Button directly below Settings */}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="no-print hidden lg:block w-64 bg-white border-r border-slate-200 shrink-0 min-h-screen shadow-xs z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
