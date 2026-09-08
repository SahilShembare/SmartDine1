import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { getAiRecommendation } from '../utils/aiRecommender';
import { 
  getTimeContext, 
  getCustomerProfile, 
  saveCustomerProfile, 
  TASTE_PREFERENCE_CHIPS, 
  getPersonalizedRecommendations,
  getSimilarDishes 
} from '../services/customerAiService';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Flame, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Check, 
  UtensilsCrossed, 
  QrCode, 
  Sparkles, 
  X,
  Clock,
  Star,
  ChevronRight,
  Info,
  RotateCw,
  Crown,
  Heart,
  Receipt,
  User,
  Edit3,
  HelpCircle,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import CustomerProfileModal from '../components/CustomerProfileModal';

export default function CustomerWebMenu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const guestName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || '';
  const avatarUrl = currentUser?.photoURL || localStorage.getItem('smartdine_guest_avatar') || '';
  const { 
    currentTable, 
    setTableSession, 
    menuItems, 
    categories, 
    tables, 
    cart, 
    addToCart, 
    updateQuantity,
    cartItemCount, 
    cartTotal,
    reloadLatestMenu
  } = useTableOrder();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'nonveg' | 'favorites'
  const [selectedFood, setSelectedFood] = useState(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  // Favorites state (synced with localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (e, dishId) => {
    if (e) e.stopPropagation();
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

  // AI Recommendation State
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(() => getCustomerProfile());
  const [showTasteChips, setShowTasteChips] = useState(() => customerProfile.isNewUser || (customerProfile.preferences && customerProfile.preferences.length === 0));
  const [whyModalItem, setWhyModalItem] = useState(null);
  const [showAllRecs, setShowAllRecs] = useState(false);

  // Time-of-day Context
  const timeContext = useMemo(() => getTimeContext(), []);

  // Multi-signal AI Recommendations
  const personalizedRecs = useMemo(() => {
    return getPersonalizedRecommendations({
      menuItems,
      cart,
      customerProfile,
      limit: showAllRecs ? 8 : 4
    });
  }, [menuItems, cart, customerProfile, showAllRecs]);

  // Handle Toggle Taste Chip
  const handleTogglePreference = (chipId) => {
    const prev = customerProfile.preferences || [];
    let updated;
    if (prev.includes(chipId)) {
      updated = prev.filter(p => p !== chipId);
    } else {
      updated = [...prev, chipId];
    }
    const updatedProfile = { ...customerProfile, preferences: updated, isNewUser: false };
    setCustomerProfile(updatedProfile);
    saveCustomerProfile(updatedProfile);
  };

  // Extract table parameter from QR scan URL e.g. /menu?table=01
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const formatted = String(tableParam).padStart(2, '0');
      setTableSession(formatted);
      const lastWelcomed = sessionStorage.getItem('smartdine_welcomed_table');
      if (lastWelcomed !== formatted) {
        toast.success(`🍽️ Welcome to Table ${formatted}! Browse menu & order.`, {
          duration: 3000,
          icon: '✨'
        });
        sessionStorage.setItem('smartdine_welcomed_table', formatted);
      }
    }
  }, [searchParams]);

  // Filter items
  const filteredDishes = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(search.toLowerCase()) ||
                          item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesDiet = dietFilter === 'all' ? true :
                        dietFilter === 'veg' ? item.isVeg === true :
                        dietFilter === 'nonveg' ? item.isVeg === false :
                        dietFilter === 'favorites' ? favorites.includes(item.id) : true;
    return matchesCategory && matchesSearch && matchesDiet;
  });

  const triggerAiRecommendation = (addedDish) => {
    const rec = getAiRecommendation(addedDish, menuItems, cart);
    if (rec) {
      setAiRecommendation(rec);
    }
  };

  const handleOpenFoodModal = (item) => {
    setSelectedFood(item);
    setQty(1);
    setNotes('');
  };

  const handleAddAndClose = () => {
    if (selectedFood) {
      addToCart(selectedFood, qty, notes);
      triggerAiRecommendation(selectedFood);
      setSelectedFood(null);
    }
  };

  const handleQuickAdd = (e, dish) => {
    e.stopPropagation();
    addToCart(dish, 1);
    triggerAiRecommendation(dish);
  };

  const handleIncrement = (e, dish) => {
    e.stopPropagation();
    addToCart(dish, 1);
    triggerAiRecommendation(dish);
  };

  const handleDecrement = (e, dish) => {
    e.stopPropagation();
    updateQuantity(dish.id, -1);
  };

  const handleAcceptAiRecommendation = () => {
    if (aiRecommendation?.dish) {
      addToCart(aiRecommendation.dish, 1);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      } catch {}
      setAiRecommendation(null);
    }
  };

  // Helper to check if item or category is "Special Thali"
  const isSpecialThali = (dish) => {
    const name = (dish.name || '').toLowerCase();
    const cat = (dish.category || '').toLowerCase();
    return name.includes('thali') || cat.includes('thali') || name.includes('royal') || name.includes('maharaja');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 font-sans">
      
      {/* Sticky Top Header / Table Status Banner */}
      <section className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pt-5 pb-4 sticky top-16 z-30 shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>SmartDine Indian Cuisine</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
                    Live Menu
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  {currentTable ? `Dining on Table ${currentTable}` : 'Select table to order'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  reloadLatestMenu();
                }}
                title="Reload Latest Menu & Dishes"
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/40 text-slate-400 hover:text-amber-400 text-xs transition cursor-pointer flex items-center gap-1 active:rotate-180"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Customer Profile Quick Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/40 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer"
                title="Customer Profile & Preferences"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{guestName ? guestName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}</span>
                  )}
                </div>
                <span className="max-w-[85px] sm:max-w-[120px] truncate">
                  {guestName || 'My Profile'}
                </span>
              </button>

              {currentTable ? (
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/30 font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Table <strong>{currentTable}</strong></span>
                  </div>

                  <Link
                    to={`/bill?table=${currentTable}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-glow cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pay Bill</span>
                  </Link>
                </div>
              ) : (
                <Link
                  to="/scan"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-glow"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan Table QR</span>
                </Link>
              )}

              {/* Cart Button in Menu Header */}
              <Link
                to="/cart"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-glow transition active:scale-95 cursor-pointer relative"
                title="View Dining Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden xs:inline">Cart</span>
                {cartItemCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black ring-1 ring-amber-400/30">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Butter Chicken, Paneer Tikka, Thali, Biryani, Naan)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow font-black border border-orange-400/40'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <span>🍽️ All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-white/25 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {menuItems.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = menuItems.filter(i => i.categoryId === cat.id).length;
              const isThaliCat = cat.name.toLowerCase().includes('thali');
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow font-black border border-orange-400/40'
                      : isThaliCat
                        ? 'bg-slate-900/90 text-amber-300 border border-amber-500/40 hover:bg-slate-800'
                        : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  {isThaliCat && <Crown className="w-3 h-3 text-amber-400" />}
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Filters: Veg, Non-Veg & Favorites buttons */}
          <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Veg Button */}
              <button
                onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  dietFilter === 'veg'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  dietFilter === 'veg' ? 'border-emerald-500 bg-emerald-950' : 'border-emerald-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>Veg</span>
              </button>

              {/* Non-Veg Button */}
              <button
                onClick={() => setDietFilter(dietFilter === 'nonveg' ? 'all' : 'nonveg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  dietFilter === 'nonveg'
                    ? 'bg-red-950/80 border-red-500 text-red-400 shadow-sm ring-1 ring-red-500/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  dietFilter === 'nonveg' ? 'border-red-500 bg-red-950' : 'border-red-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                <span>Non-Veg</span>
              </button>

              {/* Favorites Button */}
              <button
                onClick={() => setDietFilter(dietFilter === 'favorites' ? 'all' : 'favorites')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  dietFilter === 'favorites'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-sm ring-1 ring-rose-500/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${dietFilter === 'favorites' ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                <span>Favorites {favorites.length > 0 && `(${favorites.length})`}</span>
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Showing <strong className="text-amber-400 font-bold">{filteredDishes.length}</strong> delicacies
            </span>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">

        {/* ============================================================ */}
        {/* 1. NEW CUSTOMER EXPERIENCE: TASTE PREFERENCES ONBOARDING     */}
        {/* ============================================================ */}
        {showTasteChips ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border border-amber-500/40 shadow-xl relative overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">👋</span>
                  <h3 className="text-sm sm:text-base font-black text-white">Welcome to SmartDine!</h3>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white">
                    AI Personalization
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Tell us what you like and our recommendation engine will curate the menu to your taste.
                </p>
              </div>

              <button
                onClick={() => setShowTasteChips(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs transition cursor-pointer shrink-0"
                title="Dismiss or skip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preference Chips */}
            <div className="flex flex-wrap gap-2 mt-3.5">
              {TASTE_PREFERENCE_CHIPS.map((chip) => {
                const isSelected = customerProfile.preferences && customerProfile.preferences.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleTogglePreference(chip.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-amber-400 shadow-sm scale-105'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>{chip.label}</span>
                    {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-amber-400 font-medium">
                ✨ Suggestions update dynamically in real-time
              </span>
              <button
                onClick={() => setShowTasteChips(false)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition cursor-pointer"
              >
                Save & View My Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">AI Recommendations Active:</span>
              <span className="text-slate-400 truncate max-w-xs">
                {customerProfile.preferences && customerProfile.preferences.length > 0
                  ? customerProfile.preferences.join(', ')
                  : 'Time & Popularity Based'}
              </span>
            </div>
            <button
              onClick={() => setShowTasteChips(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer shrink-0"
            >
              Edit Preferences ⚙️
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. PERSONALIZED HOME SECTION: RECOMMENDED FOR YOU            */}
        {/* ============================================================ */}
        {personalizedRecs.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Recommended For You</span>
                  </h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    AI Picked
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block">{timeContext.badge}</span>
                  <span>•</span>
                  <span>Curated to your taste</span>
                </p>
              </div>

              <button
                onClick={() => setShowAllRecs(!showAllRecs)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition self-start sm:self-auto"
              >
                <span>{showAllRecs ? 'Show Less' : 'View More Recommendations'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {personalizedRecs.map(({ item, primaryReason, whyFactors, score }) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenFoodModal(item)}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-orange-500/50 shadow-sm hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Reason Badge */}
                      <div className="mb-2">
                        <span className="inline-block text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md truncate max-w-full">
                          {primaryReason}
                        </span>
                      </div>

                      <div className="relative h-28 rounded-xl overflow-hidden mb-2 bg-slate-900">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300'; }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-amber-400 text-[10px] font-bold flex items-center gap-0.5 border border-amber-400/20">
                            ⭐ {item.rating || '4.8'}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description || item.category}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-amber-400">₹{item.price}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhyModalItem({ item, whyFactors, primaryReason, score });
                          }}
                          className="block text-[9px] font-bold text-slate-400 hover:text-amber-400 mt-0.5"
                        >
                          Why this?
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, item)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                          inCart
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-glow'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explainability "Why this?" Modal */}
        {whyModalItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150 space-y-3 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Why AI Recommended This</span>
                </div>
                <button
                  onClick={() => setWhyModalItem(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs font-black text-white">{whyModalItem.item.name}</p>
                <p className="text-[11px] text-amber-400 font-bold mt-0.5">{whyModalItem.primaryReason}</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Signals Evaluated:</p>
                {whyModalItem.whyFactors.map((factor, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setWhyModalItem(null)}
                  className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-glow"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regular Menu Filter Dishes */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Dishes Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No menu items matched your selected filter or search term. Try resetting your search or filters.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearch(''); setDietFilter('all'); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-glow"
            >
              <span>View All Menu Items</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDishes.map((dish) => {
              const inCart = cart.find(i => i.id === dish.id);
              const thali = isSpecialThali(dish);
              const isFav = favorites.includes(dish.id);

              return (
                <div
                  key={dish.id}
                  className={`rounded-2xl bg-slate-900/90 transition-all duration-200 shadow-xl hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] flex flex-col justify-between group overflow-hidden ${
                    thali 
                      ? 'border-2 border-amber-500/60 relative bg-gradient-to-b from-slate-900 to-slate-950' 
                      : 'border border-slate-800/80 hover:border-orange-500/50'
                  }`}
                >
                  {/* Special Thali Crown Banner */}
                  {thali && (
                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 flex items-center justify-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 text-amber-200" />
                      <span>Special Royal Thali</span>
                    </div>
                  )}

                  <div className="flex gap-3.5 p-3.5">
                    
                    {/* Left Info */}
                    <div className="flex-1 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {/* Veg / Non-Veg Indicator */}
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            dish.isVeg ? 'border-emerald-500 bg-emerald-950/60' : 'border-red-500 bg-red-950/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </span>

                          {dish.popular && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 text-orange-400" />
                              Bestseller
                            </span>
                          )}

                          {dish.rating && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-800/90 text-amber-400 text-[10px] font-bold flex items-center gap-0.5 border border-amber-400/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {dish.rating}
                            </span>
                          )}
                        </div>

                        {/* White Item Name */}
                        <h3 
                          onClick={() => handleOpenFoodModal(dish)}
                          className="font-extrabold text-sm text-white cursor-pointer group-hover:text-amber-400 transition leading-snug"
                        >
                          {dish.name}
                        </h3>

                        {/* Amber Price */}
                        <div className="font-black text-base text-amber-400 mt-0.5">
                          ₹{dish.price}
                        </div>

                        {/* Slate-400 Description */}
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                          {dish.description}
                        </p>
                      </div>

                      {dish.prepTime && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{dish.prepTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Food Image & Orange Add to Cart Button */}
                    <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-950 flex flex-col justify-end border border-slate-800">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        onClick={() => handleOpenFoodModal(dish)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Favorite Button on Image */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, dish.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition z-10 cursor-pointer shadow-sm group/fav"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-transform group-hover/fav:scale-115 ${
                          isFav ? 'fill-red-500 text-red-500' : 'text-white'
                        }`} />
                      </button>
                      
                      {/* Add / Stepper Button */}
                      {inCart ? (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/95 border border-amber-500/50 rounded-lg flex items-center justify-between p-1 shadow-md text-white backdrop-blur-xs"
                        >
                          <button
                            onClick={(e) => handleDecrement(e, dish)}
                            className="p-1 hover:bg-slate-800 text-amber-400 rounded transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs text-white">{inCart.quantity}</span>
                          <button
                            onClick={(e) => handleIncrement(e, dish)}
                            className="p-1 hover:bg-slate-800 text-amber-400 rounded transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleQuickAdd(e, dish)}
                          className="absolute bottom-1.5 right-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>ADD</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating AI Recommendation Banner */}
      {aiRecommendation && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <img
                src={aiRecommendation.dish.imageUrl}
                alt={aiRecommendation.dish.name}
                className="w-12 h-12 rounded-xl object-cover border border-amber-500/50 shrink-0"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    {aiRecommendation.aiBadge || 'Similar Dish Match'}
                  </span>
                  <span className="text-[11px] font-black text-amber-400">₹{aiRecommendation.dish.price}</span>
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{aiRecommendation.dish.name}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-1">{aiRecommendation.reason}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAcceptAiRecommendation}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
              <button
                onClick={() => setAiRecommendation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-lg mx-auto z-50">
          <Link
            to="/cart"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:opacity-95 text-white shadow-glow flex items-center justify-between transition-all transform active:scale-98 border border-orange-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm shadow-inner">
                {cartItemCount}
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>View Order Cart</span>
                  {currentTable && <span className="text-xs font-semibold text-amber-200">• Table {currentTable}</span>}
                </div>
                <div className="text-xs text-white/90 font-medium">
                  Total: ₹{cartTotal.toFixed(0)} (incl. taxes)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 font-black text-xs bg-slate-950 text-amber-400 px-3.5 py-1.5 rounded-xl shadow-sm border border-amber-400/30">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </Link>
        </div>
      )}

      {/* Food Details Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col justify-between text-white">
            
            {/* Food Hero Image */}
            <div className="relative h-52 bg-slate-950 shrink-0">
              <img
                src={selectedFood.imageUrl}
                alt={selectedFood.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, selectedFood.id)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 shadow-md cursor-pointer transition"
                  title={favorites.includes(selectedFood.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${favorites.includes(selectedFood.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedFood(null)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 shadow-md cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-lg text-white">
                    {selectedFood.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      selectedFood.isVeg ? 'border-emerald-500 bg-emerald-950/60' : 'border-red-500 bg-red-950/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFood.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {selectedFood.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                    </span>
                    {selectedFood.category && (
                      <span className="text-xs text-slate-400">• {selectedFood.category}</span>
                    )}
                  </div>
                </div>

                <span className="text-xl font-black text-amber-400 whitespace-nowrap">
                  ₹{selectedFood.price}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedFood.description}
              </p>

              {/* Ingredients */}
              {selectedFood.ingredients && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                    Authentic Spices & Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedFood.ingredients) ? selectedFood.ingredients : [selectedFood.ingredients]).map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special cooking instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medium spicy, extra butter naan, no onion..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Smart "You May Also Like" */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>You May Also Like</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Similar flavor profile</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {getSimilarDishes({ currentItem: selectedFood, menuItems, limit: 3 }).map(dish => (
                    <div
                      key={dish.id}
                      onClick={() => handleOpenFoodModal(dish)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-full h-14 object-cover rounded-lg mb-1 group-hover:scale-105 transition duration-200"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300'; }}
                        />
                        <p className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-amber-400 transition">{dish.name}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800">
                        <span className="text-[10px] font-black text-amber-400">₹{dish.price}</span>
                        <span className="text-[9px] font-bold text-orange-400">View</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Quantity & Add to Cart Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              {/* Stepper */}
              <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-sm text-white w-4 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add CTA */}
              <button
                onClick={handleAddAndClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-glow transition active:scale-95 cursor-pointer"
              >
                <span>Add to Cart</span>
                <span>•</span>
                <span>₹{(selectedFood.price * qty).toFixed(0)}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customer Profile Modal inside Menu */}
      <CustomerProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

    </div>
  );
}
