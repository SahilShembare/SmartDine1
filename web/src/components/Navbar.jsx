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
  ChevronDown,
  Percent,
  Tag
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { currentTable, orders, getCombinedTableBill, cartItemCount = 0 } = useTableOrder();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [adminProfileOpen, setAdminProfileOpen] = useState(false);

  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isScanPage = location.pathname === '/scan';
  const isMenuPage = location.pathname === '/menu';
  const isCartPage = location.pathname === '/cart';
  const isProfilePage = location.pathname === '/profile';
  const isBillPage = location.pathname === '/bill';
  const isTrackPage = location.pathname.startsWith('/track');
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen');

  // Hide top navigation items on customer pages
  const hideTopNavItems = isHomePage || isLoginPage || isScanPage || isMenuPage || isCartPage || isProfilePage || isBillPage || isTrackPage;

  const guestName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || 'Guest';
  const avatarUrl = currentUser?.photoURL || localStorage.getItem('smartdine_guest_avatar') || '';

  // Notifications calculation for Admin Top Bar
  const billRequests = orders.filter(o => o.paymentStatus === 'Bill Requested' || o.paymentStatus === 'Cash Payment Requested');
  const kitchenPending = orders.filter(o => o.status === 'pending' || o.status === 'placed');
  const totalUnreadCount = billRequests.length + kitchenPending.length;

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Restaurant Name */}
          <div className="flex items-center gap-3">
            <Link to={isAdminPage ? "/admin" : "/"} className="group flex items-center gap-2">
              <SmartDineLogo size="md" />
            </Link>
            {isAdminPage ? (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  SmartDine Console
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Live" />
              </div>
            ) : !hideTopNavItems ? (
              /* Desktop Central Navigation Links for Customer Pages */
              <div className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isHomePage ? 'bg-slate-900 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <HomeIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Home</span>
                </Link>

                <Link
                  to={currentTable ? `/menu?table=${currentTable}` : "/menu"}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    location.pathname === '/menu' ? 'bg-slate-900 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                  <span>Menu</span>
                </Link>

                <Link
                  to="/cart"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    location.pathname === '/cart' ? 'bg-slate-900 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vouchers & Offers</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-black">50% OFF</span>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Top Bar Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop Cart Button with Item Counter */}
            {!isAdminPage && !isLoginPage && !hideTopNavItems && (
              <Link
                to="/cart"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-glow transition active:scale-95"
                title="View Dining Cart & Discounts"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[9px] font-black flex items-center justify-center ring-1 ring-white">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="font-extrabold">Cart</span>
                {cartItemCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-white text-[10px]">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Quick Admin Portal Switcher Button */}
            {!isAdminPage && !isLoginPage && !hideTopNavItems && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm"
                title="Switch to Admin Management Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Portal</span>
              </Link>
            )}

            {/* IF ON ADMIN / KITCHEN PAGES: Render Top SaaS Admin Controls */}
            {isAdminPage ? (
              <div className="flex items-center gap-2.5">
                
                {/* Search Quick Link */}
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
                >
                  <Search className="w-3.5 h-3.5 text-orange-400" />
                  <span>Search</span>
                </Link>

                {/* Notifications Bell Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition relative cursor-pointer"
                    title="Live Notifications"
                  >
                    <Bell className="w-4 h-4 text-orange-400" />
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                        {totalUnreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-slate-100 animate-in fade-in duration-150 space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5 text-orange-400" />
                          <span>Live Restaurant Alerts</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
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
                                className="block p-2.5 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/30 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-purple-300">Table {br.tableNumber}</span>
                                  <span className="text-[10px] text-purple-400 font-bold">₹{br.total}</span>
                                </div>
                                <p className="text-[11px] text-purple-200 font-medium mt-0.5">
                                  {br.paymentStatus === 'Cash Payment Requested' ? '💵 Cash Collection Request' : '🛎️ Final Bill Request'}
                                </p>
                              </Link>
                            ))}
                            {kitchenPending.map(kp => (
                              <Link
                                key={kp.id}
                                to="/admin/orders"
                                onClick={() => setNotifDropdownOpen(false)}
                                className="block p-2.5 rounded-xl bg-orange-950/30 hover:bg-orange-950/50 border border-orange-500/30 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-orange-300">New Order #{kp.id}</span>
                                  <span className="text-[10px] text-orange-400 font-bold">Table {kp.tableNumber}</span>
                                </div>
                                <p className="text-[11px] text-orange-200 font-medium truncate mt-0.5">
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
                        className="block w-full py-1.5 text-center text-[11px] font-bold text-orange-400 hover:underline pt-1 border-t border-slate-800"
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate font-bold text-slate-200">
                      {currentUser?.displayName || 'Admin'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {adminProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-slate-100 animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-xs font-black text-white">{currentUser?.displayName || 'Restaurant Admin'}</p>
                        <p className="text-[10px] text-slate-400">{currentUser?.email || 'admin@smartdine.com'}</p>
                      </div>

                      <Link
                        to="/admin/settings"
                        onClick={() => setAdminProfileOpen(false)}
                        className="block px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
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
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : isLoginPage ? null : isScanPage ? (
              /* SCAN PAGE MINI PROFILE */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScanDropdownOpen(!scanDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{guestName ? guestName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}</span>
                    )}
                  </div>
                  <span className="max-w-[110px] truncate font-bold text-slate-200">
                    {guestName}
                  </span>
                </button>

                {scanDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-slate-100 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{guestName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-xs font-black text-white truncate">{guestName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setScanDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (!isAdminPage && !isLoginPage && !isScanPage) ? (
              /* CUSTOMER PROFILE BUTTON */
              <Link
                to="/profile"
                title="Customer Profile & Dining Details"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}</span>
                  )}
                </div>
                <span className="hidden sm:inline max-w-[110px] truncate font-bold text-slate-200">
                  {currentUser?.displayName || guestName || 'Profile'}
                </span>
                <Crown className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
              </Link>
            ) : null}

          </div>

        </div>
      </header>
    </>
  );
}
