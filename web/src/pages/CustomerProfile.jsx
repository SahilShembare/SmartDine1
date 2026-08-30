import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  User, 
  ShoppingBag, 
  Clock, 
  Heart, 
  Gift, 
  Sparkles, 
  Bell, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut, 
  Edit3, 
  Phone, 
  Mail, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Crown, 
  ShieldCheck, 
  AlertCircle, 
  UtensilsCrossed, 
  PhoneCall, 
  MessageCircle, 
  Flame, 
  Star, 
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
  Moon,
  Volume2,
  Camera,
  Upload
} from 'lucide-react';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, logout, updateProfile } = useAuth();
  const { 
    orders, 
    menuItems, 
    addToCart, 
    currentTable, 
    cart 
  } = useTableOrder();

  const avatarInputRef = React.useRef(null);

  // Active section tab
  const tabParam = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Profile Form States
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || 'Royal Guest'
  );
  const [phone, setPhone] = useState(
    currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || ''
  );
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.photoURL || localStorage.getItem('smartdine_guest_avatar') || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Handle Photo Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setAvatarUrl(result);
      localStorage.setItem('smartdine_guest_avatar', result);
      if (currentUser && updateProfile) {
        updateProfile({ photoURL: result }).catch(() => {});
      }
      toast.success('Profile picture updated!', { icon: '📸' });
    };
    reader.readAsDataURL(file);
  };

  // Favorites state (persisted in localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Coupons data
  const [coupons] = useState([
    {
      code: 'ROYAL50',
      title: '50% Off on Royal Dining',
      discount: '50% OFF',
      maxDiscount: '₹150',
      minOrder: 299,
      expiry: '31 Oct 2026',
      badge: 'Bestseller Offer',
      desc: 'Valid on all North Indian and Tandoori dishes.'
    },
    {
      code: 'FEAST100',
      title: 'Flat ₹100 Off Family Feast',
      discount: '₹100 FLAT',
      maxDiscount: '₹100',
      minOrder: 499,
      expiry: '15 Nov 2026',
      badge: 'Special Feast',
      desc: 'Applicable on dining bill above ₹499.'
    },
    {
      code: 'THALI30',
      title: '30% Off on Special Royal Thalis',
      discount: '30% OFF',
      maxDiscount: '₹120',
      minOrder: 199,
      expiry: '30 Nov 2026',
      badge: 'Thali Special',
      desc: 'Exclusive discount on Maharaja & Royal Thali items.'
    },
    {
      code: 'WELCOME20',
      title: 'Welcome 20% Discount',
      discount: '20% OFF',
      maxDiscount: '₹80',
      minOrder: 149,
      expiry: '31 Dec 2026',
      badge: 'New Guest',
      desc: 'Special welcoming discount for dine-in customers.'
    }
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    return [
      {
        id: 'n1',
        title: '🎉 Welcome to SmartDine!',
        desc: 'Enjoy authentic delicacies with instant digital ordering.',
        time: 'Just now',
        read: false,
        type: 'offer'
      },
      {
        id: 'n2',
        title: '👑 Royal Rewards Credited',
        desc: 'You earned 50 reward points on your visit.',
        time: '2 hours ago',
        read: false,
        type: 'reward'
      },
      {
        id: 'n3',
        title: '🔥 Weekend Special Offers Live',
        desc: 'Use code ROYAL50 for up to 50% discount on curries & biryanis.',
        time: '1 day ago',
        read: true,
        type: 'offer'
      }
    ];
  });

  // Settings State
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Filter orders for this customer / table
  const myOrders = orders.filter(o => 
    (currentUser?.uid && o.customerId === currentUser.uid) ||
    (currentTable && o.tableNumber === currentTable)
  );

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (currentUser && updateProfile) {
        await updateProfile({ 
          displayName: displayName.trim(),
          photoURL: avatarUrl 
        });
      }
      localStorage.setItem('smartdine_guest_name', displayName.trim());
      localStorage.setItem('smartdine_guest_phone', phone.trim());
      if (avatarUrl) localStorage.setItem('smartdine_guest_avatar', avatarUrl);
      toast.success('Profile details saved successfully!', { icon: '✨' });
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Reorder all items from previous order
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      toast.error('No items found in this order to reorder.');
      return;
    }

    order.items.forEach(item => {
      addToCart(item, item.quantity || 1, item.instructions || '');
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    toast.success(`🍽️ Reordered ${order.items.length} items to your Cart!`, {
      icon: '🛒',
      duration: 3000
    });
    navigate('/cart');
  };

  // Toggle Favorite
  const toggleFavorite = (dishId) => {
    let updated;
    if (favorites.includes(dishId)) {
      updated = favorites.filter(id => id !== dishId);
      toast('Removed from Favorites', { icon: '💔' });
    } else {
      updated = [...favorites, dishId];
      toast.success('Added to Favorites!', { icon: '❤️' });
    }
    setFavorites(updated);
    localStorage.setItem('smartdine_favorites', JSON.stringify(updated));
  };

  // Copy coupon
  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied!`, { icon: '🎁' });
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    setNotifications([]);
    toast.success('Notifications cleared');
  };

  // Calculate Reward Points (e.g. 50 base points + 10 points per ₹100 spent)
  const totalSpent = myOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const rewardPoints = 150 + Math.floor(totalSpent / 10);

  // Favorite Dishes List
  const favoriteDishes = menuItems.filter(item => favorites.includes(item.id));

  // Navigation tabs list
  const navTabs = [
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, count: myOrders.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favoriteDishes.length },
    { id: 'offers', label: 'Offers & Coupons', icon: Gift, count: coupons.length },
    { id: 'rewards', label: 'Reward Points', icon: Crown, count: rewardPoints },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.read).length },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Hidden file input for Photo Upload */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/*" 
        onChange={handleAvatarUpload} 
        className="hidden" 
      />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Profile Hero Card with Royal Deep Brown `#3B2115` & Golden Yellow `#F4B942` Styling */}
        <div className="rounded-3xl bg-[#3B2115] text-[#FFF8ED] border-2 border-[#F4B942] p-6 sm:p-8 shadow-[0_8px_30px_rgba(59,33,21,0.15)] relative overflow-hidden">
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              
              {/* Profile Avatar with Golden Crown Ring and Camera Button */}
              <div className="relative group/avatar">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  title="Tap to change profile photo"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#E8752A] via-[#F4B942] to-[#FFF8ED] p-1 shadow-xl flex items-center justify-center cursor-pointer overflow-hidden relative"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Customer Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#24140D] flex items-center justify-center text-[#F4B942] font-black text-3xl sm:text-4xl shadow-inner">
                      {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <Camera className="w-6 h-6 text-[#F4B942]" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Upload New Photo"
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#F4B942] text-[#3B2115] hover:bg-[#E8752A] hover:text-white shadow-lg transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Identity info */}
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {displayName || 'Royal Dining Guest'}
                  </h1>
                  <button
                    onClick={() => {
                      switchTab('settings');
                      setIsEditing(true);
                    }}
                    title="Edit Profile"
                    className="p-1 text-[#F4B942] hover:text-white transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-[#FFF8ED]/80 font-medium">
                  {currentUser?.email || (phone ? `+91 ${phone}` : 'SmartDine Food Ordering Member')}
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#24140D] border border-[#F4B942]/60 text-[#F4B942] text-xs font-bold shadow-sm">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Royal VIP Tier</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8752A] text-white text-xs font-bold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{rewardPoints} Reward Coins</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Action Button in Hero */}
            <div className="flex items-center gap-3">
              <Link
                to="/menu"
                className="px-5 py-2.5 rounded-2xl bg-[#E8752A] hover:bg-[#d9681f] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Browse Menu</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Main Profile Layout: Sidebar (Desktop) + Tab Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION (Desktop & Tablet) */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* Navigation Card */}
            <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-3 shadow-[0_2px_12px_rgba(36,20,13,0.06)] overflow-hidden space-y-1">
              {navTabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#E8752A] text-white shadow-md font-black'
                        : 'text-[#24140D] hover:bg-[#FFF8ED] hover:text-[#E8752A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#E8752A]'}`} />
                      <span>{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive
                            ? 'bg-white text-[#E8752A]'
                            : 'bg-[#FFF8ED] text-[#3B2115] border border-[#F4B942]/40'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#6B5B50]'}`} />
                    </div>
                  </button>
                );
              })}

              {/* Logout Button in Sidebar */}
              <div className="pt-2 border-t border-[#FFF8ED]">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT CONTENT DISPLAY PANEL */}
          <div className="lg:col-span-8">
            
            {/* 1. MY ORDERS & HISTORY TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#E8752A]" />
                        <span>My Orders & Dining History</span>
                      </h2>
                      <p className="text-xs text-[#6B5B50] mt-0.5">
                        Track live kitchen progression and reorder delicious dishes in 1-tap.
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#E8752A] bg-[#FFF8ED] px-3 py-1 rounded-xl border border-[#F4B942]/40">
                      {myOrders.length} Orders
                    </span>
                  </div>

                  {myOrders.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-[#FFF8ED]/50 rounded-2xl border border-dashed border-[#F4B942]/60 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#F4B942] flex items-center justify-center mx-auto text-[#E8752A] shadow-sm">
                        <ShoppingBag className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-[#24140D]">No Orders Placed Yet</h3>
                      <p className="text-xs text-[#6B5B50] max-w-sm mx-auto">
                        Your dining orders will appear here automatically when you place an order from the digital menu.
                      </p>
                      <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E8752A] text-white text-xs font-black shadow-md hover:bg-[#3B2115] transition"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Explore Menu</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {myOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#6B5B50]/15 hover:border-[#E8752A]/50 shadow-sm transition space-y-3"
                        >
                          {/* Order Header */}
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-xs text-[#24140D]">
                                  #{order.id}
                                </span>
                                {order.tableNumber && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#3B2115] text-[#F4B942] border border-[#F4B942]/40">
                                    Table {order.tableNumber}
                                  </span>
                                )}
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                  order.status === 'completed'
                                    ? 'bg-emerald-50 text-[#198754] border-[#198754]/40'
                                    : order.status === 'preparing'
                                    ? 'bg-amber-50 text-[#E8752A] border-[#E8752A]/40 animate-pulse'
                                    : 'bg-[#FFF8ED] text-[#3B2115] border-[#F4B942]/40'
                                }`}>
                                  {order.status || 'Received'}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#6B5B50] flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3 text-[#6B5B50]" />
                                <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent Dining'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-black text-[#E8752A]">
                                ₹{(order.total || 0).toFixed(0)}
                              </div>
                              <span className="text-[10px] text-[#6B5B50] font-medium">
                                {order.paymentMethod || 'Dine-In Billing'}
                              </span>
                            </div>
                          </div>

                          {/* Ordered items breakdown */}
                          <div className="p-3 rounded-xl bg-[#FFF8ED]/60 border border-[#F4B942]/30 space-y-1.5">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#E8752A]">{item.quantity || 1}x</span>
                                  <span className="font-semibold text-[#24140D]">{item.name}</span>
                                </div>
                                <span className="font-bold text-[#6B5B50]">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons: View Tracking & Reorder */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => navigate(`/track/${order.id}`)}
                              className="px-3.5 py-2 rounded-xl bg-[#FFF8ED] hover:bg-white text-[#3B2115] border border-[#F4B942]/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#E8752A]" />
                              <span>Live Tracker</span>
                            </button>

                            <button
                              onClick={() => handleReorder(order)}
                              className="px-4 py-2 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white text-xs font-black shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder Dish</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. FAVORITES TAB */}
            {activeTab === 'favorites' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                      <span>Saved Favorite Dishes</span>
                    </h2>
                    <p className="text-xs text-[#6B5B50] mt-0.5">
                      Your personally curated list of favorite food items. Add them to your cart instantly!
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#E8752A] bg-[#FFF8ED] px-3 py-1 rounded-xl border border-[#F4B942]/40">
                    {favoriteDishes.length} Items
                  </span>
                </div>

                {favoriteDishes.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-[#FFF8ED]/50 rounded-2xl border border-dashed border-[#F4B942]/60 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#F4B942] flex items-center justify-center mx-auto text-red-500 shadow-sm">
                      <Heart className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-[#24140D]">No Favorite Dishes Yet</h3>
                    <p className="text-xs text-[#6B5B50] max-w-sm mx-auto">
                      Click the heart icon on any dish in the digital menu to save it here for fast reordering.
                    </p>
                    <Link
                      to="/menu"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E8752A] text-white text-xs font-black shadow-md hover:bg-[#3B2115] transition"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Browse Menu & Add Favorites</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {favoriteDishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="rounded-2xl border border-[#6B5B50]/15 bg-white hover:border-[#E8752A] p-3.5 flex gap-3 justify-between shadow-sm transition"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              dish.isVeg ? 'border-[#198754]' : 'border-[#D32F2F]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-[#198754]' : 'bg-[#D32F2F]'}`} />
                            </span>
                            <h4 className="font-extrabold text-sm text-[#24140D] line-clamp-1">{dish.name}</h4>
                          </div>
                          <div className="text-xs font-black text-[#E8752A]">₹{dish.price}</div>
                          <p className="text-[11px] text-[#6B5B50] line-clamp-2">{dish.description}</p>
                          
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                addToCart(dish, 1);
                                toast.success(`Added ${dish.name} to cart!`, { icon: '🛒' });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add to Cart</span>
                            </button>

                            <button
                              onClick={() => toggleFavorite(dish.id)}
                              className="p-1.5 rounded-xl bg-[#FFF8ED] text-red-500 hover:bg-red-50 transition cursor-pointer"
                              title="Remove from favorites"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-20 h-20 rounded-xl object-cover bg-[#FFF8ED] shrink-0 border border-[#6B5B50]/20"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. OFFERS & COUPONS TAB */}
            {activeTab === 'offers' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#E8752A]" />
                    <span>Exclusive Dining Coupons & Offers</span>
                  </h2>
                  <p className="text-xs text-[#6B5B50] mt-0.5">
                    Apply discount promo codes during dining checkout to save on your orders.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {coupons.map((coupon, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border-2 border-dashed border-[#F4B942] hover:border-[#E8752A] shadow-sm space-y-3 relative transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFF8ED] text-[#E8752A] border border-[#F4B942]/60">
                            {coupon.badge}
                          </span>
                          <h4 className="font-extrabold text-sm text-[#24140D] mt-1.5">
                            {coupon.title}
                          </h4>
                          <p className="text-[11px] text-[#6B5B50] mt-0.5">{coupon.desc}</p>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-base text-[#E8752A] block">{coupon.discount}</span>
                          <span className="text-[10px] text-[#6B5B50]">Max {coupon.maxDiscount}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FFF8ED]/70 border border-[#F4B942]/30 flex items-center justify-between text-xs">
                        <div className="font-mono font-black text-[#3B2115] tracking-wider">
                          {coupon.code}
                        </div>
                        <button
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className="px-2.5 py-1 rounded-lg bg-[#E8752A] hover:bg-[#3B2115] text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#6B5B50] font-medium pt-0.5">
                        <span>Min Order: ₹{coupon.minOrder}</span>
                        <span>Valid till: {coupon.expiry}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. REWARD POINTS TAB */}
            {activeTab === 'rewards' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#F4B942]" />
                    <span>Royal Dining Reward Coins</span>
                  </h2>
                  <p className="text-xs text-[#6B5B50] mt-0.5">
                    Earn coins on every delicious order and redeem them for instant discounts.
                  </p>
                </div>

                {/* Balance Card with Golden Glow */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#3B2115] via-[#24140D] to-[#3B2115] text-[#FFF8ED] border-2 border-[#F4B942] shadow-[0_8px_25px_rgba(244,185,66,0.25)] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs uppercase font-bold text-[#F4B942] tracking-wider">
                      Available Reward Balance
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-7 h-7 text-[#F4B942]" />
                      <span>{rewardPoints} Coins</span>
                    </div>
                    <p className="text-xs text-[#FFF8ED]/80">
                      1 Reward Coin = ₹1 Discount on your food bill
                    </p>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#F4B942] text-[#3B2115] shadow-sm">
                      ★ Royal Gold Member
                    </span>
                  </div>
                </div>

                {/* How it works */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/40 text-center space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#E8752A] flex items-center justify-center mx-auto border border-[#F4B942]/60 font-black">
                      1
                    </div>
                    <h4 className="font-bold text-xs text-[#24140D]">Dine & Order</h4>
                    <p className="text-[11px] text-[#6B5B50]">Order dishes from your table menu.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/40 text-center space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#F4B942] flex items-center justify-center mx-auto border border-[#F4B942]/60 font-black">
                      2
                    </div>
                    <h4 className="font-bold text-xs text-[#24140D]">Earn Coins</h4>
                    <p className="text-[11px] text-[#6B5B50]">Earn 10 coins for every ₹100 spent.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/40 text-center space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#198754] flex items-center justify-center mx-auto border border-[#F4B942]/60 font-black">
                      3
                    </div>
                    <h4 className="font-bold text-xs text-[#24140D]">Redeem & Save</h4>
                    <p className="text-[11px] text-[#6B5B50]">Get instant discount on next orders.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#E8752A]" />
                      <span>Notifications & Dining Alerts</span>
                    </h2>
                    <p className="text-xs text-[#6B5B50] mt-0.5">
                      Live status updates on your table orders, exclusive deals and perks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllRead}
                      className="px-3 py-1 rounded-xl bg-[#FFF8ED] hover:bg-white text-[#3B2115] border border-[#F4B942]/60 text-xs font-bold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={handleClearNotifications}
                      className="px-3 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-[#FFF8ED]/50 rounded-2xl border border-dashed border-[#F4B942]/60 space-y-2">
                    <Bell className="w-8 h-8 text-[#6B5B50] mx-auto opacity-50" />
                    <h3 className="text-sm font-bold text-[#24140D]">No Notifications</h3>
                    <p className="text-xs text-[#6B5B50]">You're all caught up with your latest dining updates.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                          notif.read
                            ? 'bg-white border-[#6B5B50]/15'
                            : 'bg-[#FFF8ED]/80 border-[#F4B942] shadow-sm'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#E8752A]/10 text-[#E8752A] flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-xs text-[#24140D]">{notif.title}</h4>
                            <span className="text-[10px] text-[#6B5B50]">{notif.time}</span>
                          </div>
                          <p className="text-xs text-[#6B5B50]">{notif.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-[#E8752A]" />
                    <span>Customer & Account Settings</span>
                  </h2>
                  <p className="text-xs text-[#6B5B50] mt-0.5">
                    Manage your profile details, notification preferences and ordering experience.
                  </p>
                </div>

                {/* Edit Profile Details Form */}
                <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-[#FFF8ED]/50 border border-[#F4B942]/40 space-y-4">
                  <h3 className="text-xs font-black text-[#3B2115] uppercase tracking-wider">
                    Edit Profile Information
                  </h3>

                  {/* Avatar & Profile Photo Section */}
                  <div className="p-4 rounded-2xl bg-white border border-[#F4B942]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#24140D]">Customer Profile Photo</div>
                        <div className="text-[11px] text-[#6B5B50]">Upload from device or select a preset royal avatar.</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FFF8ED] hover:bg-[#E8752A] hover:text-white text-[#3B2115] border border-[#F4B942] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#E8752A]" />
                        <span>Upload Photo</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-1 overflow-x-auto pb-1">
                      {/* Current Preview */}
                      <div className="w-12 h-12 rounded-full border-2 border-[#E8752A] p-0.5 shrink-0 shadow-sm">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#24140D] flex items-center justify-center text-[#F4B942] font-black text-sm">
                            {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                          </div>
                        )}
                      </div>

                      {/* Preset Royal Avatars */}
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset);
                            localStorage.setItem('smartdine_guest_avatar', preset);
                            if (currentUser && updateProfile) updateProfile({ photoURL: preset }).catch(() => {});
                            toast.success('Avatar selected!', { icon: '✨' });
                          }}
                          className={`w-11 h-11 rounded-full p-0.5 shrink-0 transition cursor-pointer border-2 ${
                            avatarUrl === preset ? 'border-[#E8752A] scale-110 shadow-md ring-2 ring-[#F4B942]' : 'border-[#6B5B50]/20 hover:border-[#E8752A]'
                          }`}
                        >
                          <img src={preset} alt="Preset Avatar" className="w-full h-full rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#6B5B50] mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-bold text-[#24140D] focus:outline-none focus:border-[#E8752A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B5B50] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-bold text-[#24140D] focus:outline-none focus:border-[#E8752A]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-xs shadow-sm transition cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </form>

                {/* App Preferences */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-[#3B2115] uppercase tracking-wider">
                    App & Ordering Preferences
                  </h3>

                  {/* Toggle Notifications */}
                  <div className="p-4 rounded-2xl bg-white border border-[#6B5B50]/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-[#E8752A]" />
                      <div>
                        <div className="text-xs font-bold text-[#24140D]">Order Alert Sound & Notifications</div>
                        <div className="text-[11px] text-[#6B5B50]">Receive chimes when food is being prepared.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationEnabled(!notificationEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                        notificationEnabled ? 'bg-[#E8752A] justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div className="p-4 rounded-2xl bg-white border border-[#6B5B50]/15 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#E8752A]" />
                      <div>
                        <div className="text-xs font-bold text-[#24140D]">Language</div>
                        <div className="text-[11px] text-[#6B5B50]">Select preferred language for menu.</div>
                      </div>
                    </div>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/60 text-xs font-bold text-[#24140D] focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. HELP & SUPPORT TAB */}
            {activeTab === 'support' && (
              <div className="bg-white border border-[#F4B942]/40 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#24140D] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#E8752A]" />
                    <span>Help & Guest Support</span>
                  </h2>
                  <p className="text-xs text-[#6B5B50] mt-0.5">
                    Have a question or need assistance with your dining table? We are here to help.
                  </p>
                </div>

                {/* Instant Contact Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="tel:+919876543210"
                    className="p-4 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/60 hover:border-[#E8752A] flex items-center gap-3.5 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#3B2115] text-[#F4B942] flex items-center justify-center">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#24140D]">Call Restaurant Captain</div>
                      <div className="text-[11px] text-[#6B5B50]">+91 98765 43210</div>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/60 hover:border-[#E8752A] flex items-center gap-3.5 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#198754] text-white flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#24140D]">WhatsApp Support</div>
                      <div className="text-[11px] text-[#6B5B50]">Instant chat assistance</div>
                    </div>
                  </a>
                </div>

                {/* Frequently Asked Questions */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-[#3B2115] uppercase tracking-wider">
                    Frequently Asked Questions (FAQs)
                  </h3>

                  {[
                    {
                      q: 'How does table ordering work on SmartDine?',
                      a: 'Simply scan the QR code standee placed on your dining table. Your table number connects automatically. Browse the live menu, select your favorite dishes, customize spice levels, and tap "Send Order to Kitchen".'
                    },
                    {
                      q: 'How do I track when my food will arrive?',
                      a: 'Once your order is placed, you can watch real-time kitchen progress (Order Received → Chef Accepted → Preparing → Ready to Serve) right from your live tracking screen.'
                    },
                    {
                      q: 'What payment methods are supported?',
                      a: 'You can pay comfortably after dining via Cash, UPI (Google Pay, PhonePe, Paytm), or Cards at your table / counter.'
                    },
                    {
                      q: 'Can I reorder or add more dishes during my meal?',
                      a: 'Yes! You can re-open the digital menu or go to "My Orders" in your profile and add extra items anytime without resetting your table.'
                    }
                  ].map((faq, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#6B5B50]/15 overflow-hidden transition"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
                        className="w-full p-3.5 text-left bg-white hover:bg-[#FFF8ED]/50 flex items-center justify-between text-xs font-bold text-[#24140D] cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {openFaqIndex === i ? (
                          <ChevronUp className="w-4 h-4 text-[#E8752A]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6B5B50]" />
                        )}
                      </button>
                      {openFaqIndex === i && (
                        <div className="p-3.5 bg-[#FFF8ED]/40 text-xs text-[#6B5B50] border-t border-[#6B5B50]/10 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#F4B942] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-[#24140D]">Confirm Log Out?</h3>
              <p className="text-xs text-[#6B5B50]">
                Are you sure you want to sign out from your SmartDine session?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#FFF8ED] text-xs font-bold text-[#6B5B50] hover:text-[#24140D] border border-[#6B5B50]/20 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  toast.success('Logged out successfully');
                  navigate('/');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-md transition cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
