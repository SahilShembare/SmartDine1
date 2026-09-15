import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  User, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';

export default function AdminHeader({ 
  activeTab, 
  setMobileOpen,
  setActiveTab 
}) {
  const { currentUser } = useAuth();
  const { orders = [] } = useTableOrder();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'kitchen':
      case 'orders': 
        return 'Kitchen Live Updates';
      case 'menu': return 'Menu Management';
      case 'tables': return 'Table Management';
      case 'customers': return 'Customer Directory';
      case 'payments': return 'Payments & Transactions';
      case 'reports': return 'Sales & Performance Reports';
      case 'sales-analysis': return 'Sales Analysis (Monthly & Yearly)';
      case 'ai': return 'AI Assistant';
      case 'settings': return 'Restaurant Settings';
      case 'dashboard':
      default:
        return 'Admin Dashboard';
    }
  };

  const pendingOrders = orders.filter(o => String(o.status || '').toLowerCase() === 'pending');
  const recentAlerts = orders.slice(0, 5).map(o => ({
    id: o.id,
    title: `Order ${o.id} (${o.tableNumber ? `Table ${o.tableNumber}` : 'Online'})`,
    time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: o.status,
    amount: o.amount || o.total
  }));

  return (
    <header className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Section: Mobile Menu Toggle + Logo & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo visible on mobile or compact screens */}
          <div className="flex lg:hidden items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Smart<span className="text-emerald-600">Dine</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Console
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">
              SmartDine Restaurant Management System
            </p>
          </div>
        </div>

        {/* Right Section: Notifications & Admin Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notification Icon */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingOrders.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live Notifications
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pendingOrders.length} pending
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {recentAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No recent notifications
                    </div>
                  ) : (
                    recentAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          if (setActiveTab) setActiveTab('kitchen');
                          setShowNotifications(false);
                        }}
                        className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold text-slate-800 truncate">
                              {alert.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {alert.time}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-slate-500 capitalize">
                              Status: <strong className="text-slate-700">{alert.status}</strong>
                            </span>
                            <span className="font-bold text-emerald-600">
                              ₹{alert.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (setActiveTab) setActiveTab('kitchen');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 py-1 cursor-pointer"
                  >
                    View Kitchen Updates →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Icon & Details */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {currentUser?.displayName || 'Admin Sahil'}
                </span>
                <span className="text-[10px] font-medium text-slate-400 block">
                  Manager
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">
                    {currentUser?.displayName || 'Sahil Shembare'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser?.email || 'admin@smartdine.com'}
                  </p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Admin Role
                  </span>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (setActiveTab) setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    Restaurant Settings
                  </button>
                  <a
                    href="/menu"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span>Customer Web Menu</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
