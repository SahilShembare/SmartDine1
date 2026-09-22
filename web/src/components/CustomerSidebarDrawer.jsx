import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import SmartDineLogo from './SmartDineLogo';
import { 
  User, 
  X, 
  ShoppingBag, 
  Clock, 
  Bell, 
  ChevronRight, 
  LogOut, 
  Edit3, 
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerSidebarDrawer({
  isOpen,
  onClose,
  onOpenProfileModal,
  onOpenWaiterModal
}) {
  const { currentUser, logout } = useAuth();
  const { currentTable, cartItemCount, clearTableSession } = useTableOrder();
  const navigate = useNavigate();

  const guestName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || 'Guest Diner';
  const guestPhone = currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '';



  const handleLogoutOrReset = () => {
    if (currentUser) {
      logout();
    } else {
      clearTableSession();
      toast('Table session cleared');
    }
    onClose();
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-950 border-r border-slate-800/80 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-300 text-slate-100">
        
        {/* Top Header & Profile Card */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Brand & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SmartDineLogo size="sm" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* DEDICATED CUSTOMER PROFILE CARD (Single place for Profile) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/90 shadow-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center font-black text-lg shadow-glow shrink-0">
                {guestName ? guestName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-white truncate">
                  {guestName}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {guestPhone ? `+91 ${guestPhone}` : 'Dine-in Customer'}
                </p>
                {currentTable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Table {currentTable}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">No table selected</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenProfileModal) onOpenProfileModal();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/20"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile & Preferences</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Menu & Dining Navigation
            </p>

            <Link
              to="/menu"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <span>Browse Menu</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <span>My Dining Cart</span>
              </div>
              {cartItemCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black">
                  {cartItemCount}
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </Link>


            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>My Past Orders</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenWaiterModal) onOpenWaiterModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Call Waiter Service</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold">Ring 🔔</span>
            </button>


          </div>


        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-2">
          <button
            type="button"
            onClick={handleLogoutOrReset}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/30 text-xs font-bold text-slate-300 hover:text-red-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>{currentUser ? 'Sign Out' : 'Leave Table & Reset'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
