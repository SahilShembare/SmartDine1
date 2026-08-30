import React, { useState } from 'react';
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
  Home as HomeIcon,
  Sparkles,
  QrCode,
  User,
  Crown,
  Bell,
  BellRing,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { currentTable, orders, getCombinedTableBill } = useTableOrder();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [adminProfileOpen, setAdminProfileOpen] = useState(false);

  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isScanPage = location.pathname === '/scan';
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  const guestName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || 'Guest';
  const avatarUrl = currentUser?.photoURL || localStorage.getItem('smartdine_guest_avatar') || '';

  // Notifications calculation for Admin Top Bar
  const billRequests = orders.filter(o => o.paymentStatus === 'Bill Requested' || o.paymentStatus === 'Cash Payment Requested');
  const kitchenPending = orders.filter(o => o.status === 'pending' || o.status === 'placed');
  const totalUnreadCount = billRequests.length + kitchenPending.length;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#3B2115] border-b border-[#F4B942]/30 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Restaurant Name */}
          <div className="flex items-center gap-3">
            <Link to={isAdminPage ? "/admin" : "/"} className="group flex items-center gap-2">
              <SmartDineLogo size="md" />
            </Link>
            {isAdminPage && (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#F4B942]/30">
                <span className="text-xs font-black text-[#FFF8ED] uppercase tracking-wider">
                  Royal Palace Operations
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Live" />
              </div>
            )}
          </div>

          {/* Top Bar Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Home Button (Only on Customer Pages) */}
            {!isHomePage && !isAdminPage && (
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#FFF8ED]/90 hover:text-white hover:bg-[#24140D] transition"
              >
                <HomeIcon className="w-3.5 h-3.5 text-[#F4B942]" />
                <span>Home</span>
              </Link>
            )}

            {/* IF ON ADMIN / KITCHEN PAGES: Render Top SaaS Admin Controls */}
            {isAdminPage ? (
              <div className="flex items-center gap-2.5">
                
                {/* Search Quick Link */}
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24140D] text-[#FFF8ED]/70 hover:text-[#FFF8ED] border border-[#F4B942]/20 text-xs font-semibold transition"
                >
                  <Search className="w-3.5 h-3.5 text-[#F4B942]" />
                  <span>Search</span>
                </Link>

                {/* Notifications Bell Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 rounded-xl bg-[#24140D] hover:bg-[#3B2115] border border-[#F4B942]/30 text-[#FFF8ED] transition relative cursor-pointer"
                    title="Live Notifications"
                  >
                    <Bell className="w-4 h-4 text-[#F4B942]" />
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                        {totalUnreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#F4B942] shadow-2xl p-3 z-50 text-[#24140D] animate-in fade-in duration-150 space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-black text-[#24140D] flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5 text-[#E8752A]" />
                          <span>Live Restaurant Alerts</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {totalUnreadCount} New
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {billRequests.length === 0 && kitchenPending.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-xs">
                            No active alerts. Everything running smoothly! 👑
                          </div>
                        ) : (
                          <>
                            {billRequests.map(br => (
                              <Link
                                key={br.id}
                                to="/admin/payments"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="block p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-amber-800">Table {br.tableNumber}</span>
                                  <span className="text-[10px] text-amber-600 font-bold">₹{br.total}</span>
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                                  {br.paymentStatus === 'Cash Payment Requested' ? '💵 Cash Collection Request' : '🛎️ Final Bill Request'}
                                </p>
                              </Link>
                            ))}
                            {kitchenPending.map(kp => (
                              <Link
                                key={kp.id}
                                to="/admin/orders"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="block p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-orange-900">New Order #{kp.id}</span>
                                  <span className="text-[10px] text-orange-700 font-bold">Table {kp.tableNumber}</span>
                                </div>
                                <p className="text-[11px] text-orange-800 font-medium truncate mt-0.5">
                                  {kp.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </p>
                              </Link>
                            ))}
                          </>
                        )}
                      </div>

                      <Link
                        to="/admin/notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="block w-full py-1.5 text-center text-[11px] font-bold text-[#E8752A] hover:underline pt-1 border-t border-slate-100"
                      >
                        View Notification Center →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Admin Profile & Logout Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAdminProfileOpen(!adminProfileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#24140D] hover:bg-[#24140D]/80 border border-[#F4B942]/40 text-[#FFF8ED] text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#E8752A] to-[#F4B942] text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate font-bold text-[#FFF8ED]">
                      {currentUser?.displayName || 'Admin'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#F4B942]" />
                  </button>

                  {adminProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#F4B942] shadow-2xl py-2 z-50 text-[#24140D] animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-black text-[#24140D]">{currentUser?.displayName || 'Restaurant Admin'}</p>
                        <p className="text-[10px] text-slate-500">{currentUser?.email || 'admin@smartdine.com'}</p>
                      </div>

                      <Link
                        to="/admin/settings"
                        onClick={() => setAdminProfileOpen(false)}
                        className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        ⚙️ Settings
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : isLoginPage ? (
              /* LOGIN PAGE BUTTONS */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login?role=kitchen"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24140D] hover:bg-[#E8752A] text-[#FFF8ED] text-xs font-bold border border-[#F4B942]/30 transition cursor-pointer shadow-sm"
                >
                  <ChefHat className="w-3.5 h-3.5 text-[#F4B942]" />
                  <span className="hidden xs:inline">Kitchen</span>
                </Link>

                <Link
                  to="/login?role=admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24140D] hover:bg-[#E8752A] text-[#FFF8ED] text-xs font-bold border border-[#F4B942]/30 transition cursor-pointer shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#F4B942]" />
                  <span className="hidden xs:inline">Admin</span>
                </Link>
              </div>
            ) : isScanPage ? (
              /* SCAN PAGE MINI PROFILE */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScanDropdownOpen(!scanDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#24140D] hover:bg-[#24140D]/80 border border-[#F4B942]/50 text-[#FFF8ED] text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E8752A] text-white flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{guestName ? guestName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}</span>
                    )}
                  </div>
                  <span className="max-w-[110px] truncate font-bold text-[#FFF8ED]">
                    {guestName}
                  </span>
                </button>

                {scanDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#F4B942] shadow-2xl py-2 z-50 text-[#24140D] animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-[#FFF8ED] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E8752A] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{guestName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-xs font-black text-[#24140D] truncate">{guestName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setScanDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (!isHomePage && !isAdminPage && !isLoginPage && !isScanPage) ? (
              /* CUSTOMER WEB MENU & CART PROFILE (Hidden on Home, Login, Scan & Admin) */
              <Link
                to="/profile"
                title="Customer Profile & Dining Details"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#24140D] hover:bg-[#24140D]/80 border border-[#F4B942]/50 text-[#FFF8ED] text-xs font-bold transition shadow-sm cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-full bg-[#E8752A] text-white flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}</span>
                  )}
                </div>
                <span className="hidden sm:inline max-w-[110px] truncate font-bold text-[#FFF8ED]">
                  {currentUser?.displayName || guestName || 'Profile'}
                </span>
                <Crown className="w-3 h-3 text-[#F4B942] group-hover:scale-110 transition-transform" />
              </Link>
            ) : null}

          </div>

        </div>
      </header>
    </>
  );
}
