import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { getAiRecommendation } from '../utils/aiRecommender';
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
  Edit3
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
    <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] pb-32 font-sans">
      
      {/* Sticky Top Header / Table Status Banner */}
      <section className="bg-white/95 backdrop-blur-xl border-b border-[#F4B942]/30 px-4 pt-5 pb-4 sticky top-16 z-30 shadow-[0_2px_12px_rgba(59,33,21,0.06)]">
        <div className="max-w-4xl mx-auto space-y-3">
          
          {/* Table Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF8ED] border border-[#F4B942] flex items-center justify-center text-[#E8752A] shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#24140D] flex items-center gap-2">
                  <span>SmartDine Indian Cuisine</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFF8ED] text-[#E8752A] border border-[#F4B942]/60">
                    Live Menu
                  </span>
                </h1>
                <p className="text-[11px] text-[#6B5B50] font-medium">
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
                className="p-2 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 hover:border-[#E8752A] text-[#6B5B50] hover:text-[#E8752A] text-xs transition cursor-pointer flex items-center gap-1 active:rotate-180"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Customer Profile Quick Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8ED] hover:bg-white border border-[#F4B942]/60 text-[#3B2115] text-xs font-bold transition shadow-sm cursor-pointer"
                title="Customer Profile & Preferences"
              >
                <div className="w-5 h-5 rounded-full bg-[#E8752A] text-white flex items-center justify-center text-[10px] font-black shadow-sm overflow-hidden">
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
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#3B2115] text-[#FFF8ED] border border-[#F4B942]/60 font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#F4B942] animate-pulse" />
                    <span>Table <strong>{currentTable}</strong></span>
                  </div>

                  <Link
                    to={`/bill?table=${currentTable}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Pay Bill</span>
                  </Link>
                </div>
              ) : (
                <Link
                  to="/scan"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan Table QR</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B5B50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Butter Chicken, Paneer Tikka, Thali, Biryani, Naan)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FFF8ED] border border-[#F4B942]/40 text-sm text-[#24140D] placeholder-[#6B5B50]/70 focus:outline-none focus:border-[#E8752A] focus:bg-white transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5B50] hover:text-[#24140D] p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Carousel Pills: Default = White Card with Dark Brown text; Active = Warm Orange #E8752A with White text */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-[#E8752A] text-white shadow-[0_2px_10px_rgba(232,117,42,0.4)] font-black'
                  : 'bg-white text-[#24140D] hover:text-[#E8752A] hover:border-[#E8752A]/40 border border-[#6B5B50]/20'
              }`}
            >
              <span>🍽️ All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-white/25 text-white' : 'bg-[#FFF8ED] text-[#6B5B50]'}`}>
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
                      ? 'bg-[#E8752A] text-white shadow-[0_2px_10px_rgba(232,117,42,0.4)] font-black'
                      : isThaliCat
                        ? 'bg-white text-[#24140D] border-1.5 border-[#F4B942] hover:bg-[#FFF8ED]'
                        : 'bg-white text-[#24140D] hover:text-[#E8752A] hover:border-[#E8752A]/40 border border-[#6B5B50]/20'
                  }`}
                >
                  {isThaliCat && <Crown className="w-3 h-3 text-[#F4B942]" />}
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-[#FFF8ED] text-[#6B5B50]'}`}>
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
                    ? 'bg-emerald-50 border-[#198754] text-[#198754] shadow-sm ring-1 ring-[#198754]'
                    : 'bg-white border-[#6B5B50]/20 text-[#6B5B50] hover:text-[#24140D]'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  dietFilter === 'veg' ? 'border-[#198754] bg-emerald-100' : 'border-[#198754]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dietFilter === 'veg' ? 'bg-[#198754]' : 'bg-[#198754]'}`} />
                </span>
                <span>Veg</span>
              </button>

              {/* Non-Veg Button */}
              <button
                onClick={() => setDietFilter(dietFilter === 'nonveg' ? 'all' : 'nonveg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  dietFilter === 'nonveg'
                    ? 'bg-red-50 border-[#D32F2F] text-[#D32F2F] shadow-sm ring-1 ring-[#D32F2F]'
                    : 'bg-white border-[#6B5B50]/20 text-[#6B5B50] hover:text-[#24140D]'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  dietFilter === 'nonveg' ? 'border-[#D32F2F] bg-red-100' : 'border-[#D32F2F]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dietFilter === 'nonveg' ? 'bg-[#D32F2F]' : 'bg-[#D32F2F]'}`} />
                </span>
                <span>Non-Veg</span>
              </button>

              {/* Favorites Button */}
              <button
                onClick={() => setDietFilter(dietFilter === 'favorites' ? 'all' : 'favorites')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  dietFilter === 'favorites'
                    ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm ring-1 ring-rose-500'
                    : 'bg-white border-[#6B5B50]/20 text-[#6B5B50] hover:text-[#24140D]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${dietFilter === 'favorites' ? 'fill-rose-500 text-rose-500' : 'text-[#6B5B50]'}`} />
                <span>Favorites {favorites.length > 0 && `(${favorites.length})`}</span>
              </button>
            </div>

            <span className="text-[11px] font-medium text-[#6B5B50]">
              Showing <strong className="text-[#3B2115] font-bold">{filteredDishes.length}</strong> delicacies
            </span>
          </div>

        </div>
      </section>

      {/* Food Cards Grid */}
      <main className="max-w-4xl mx-auto px-4 py-5">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-[#F4B942]/30 rounded-3xl space-y-4 shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF8ED] border border-[#F4B942] flex items-center justify-center mx-auto text-[#E8752A]">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#24140D]">No Dishes Found</h3>
            <p className="text-xs text-[#6B5B50] max-w-sm mx-auto">
              No menu items matched your selected filter or search term. Try resetting your search or filters.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearch(''); setDietFilter('all'); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white text-xs font-bold transition cursor-pointer shadow-sm"
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
                  className={`rounded-2xl bg-white transition-all duration-200 shadow-[0_2px_12px_rgba(36,20,13,0.06)] hover:shadow-[0_6px_20px_rgba(36,20,13,0.12)] flex flex-col justify-between group overflow-hidden ${
                    thali 
                      ? 'border-2 border-[#F4B942] relative bg-gradient-to-b from-[#FFFDF9] to-white' 
                      : 'border border-[#6B5B50]/15 hover:border-[#E8752A]/40'
                  }`}
                >
                  {/* Special Thali Crown Banner */}
                  {thali && (
                    <div className="bg-[#F4B942] text-[#3B2115] text-[10px] font-black uppercase tracking-wider px-3 py-0.5 flex items-center justify-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 text-[#3B2115]" />
                      <span>Special Royal Thali</span>
                    </div>
                  )}

                  <div className="flex gap-3.5 p-3.5">
                    
                    {/* Left Info */}
                    <div className="flex-1 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {/* Veg / Non-Veg Indicator (#198754 / #D32F2F) */}
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            dish.isVeg ? 'border-[#198754]' : 'border-[#D32F2F]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-[#198754]' : 'bg-[#D32F2F]'}`} />
                          </span>

                          {dish.popular && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FFF8ED] text-[#E8752A] text-[10px] font-bold border border-[#E8752A]/30 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 text-[#E8752A]" />
                              Bestseller
                            </span>
                          )}

                          {dish.rating && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#FFF8ED] text-[#3B2115] text-[10px] font-bold flex items-center gap-0.5 border border-[#F4B942]/60">
                              <Star className="w-2.5 h-2.5 fill-[#F4B942] text-[#F4B942]" />
                              {dish.rating}
                            </span>
                          )}
                        </div>

                        {/* Dark Brown Item Name */}
                        <h3 
                          onClick={() => handleOpenFoodModal(dish)}
                          className="font-extrabold text-sm text-[#24140D] cursor-pointer group-hover:text-[#E8752A] transition leading-snug"
                        >
                          {dish.name}
                        </h3>

                        {/* Deep Brown Price */}
                        <div className="font-black text-base text-[#3B2115] mt-0.5">
                          ₹{dish.price}
                        </div>

                        {/* Warm Gray Description */}
                        <p className="text-[11px] text-[#6B5B50] line-clamp-2 leading-relaxed mt-1">
                          {dish.description}
                        </p>
                      </div>

                      {dish.prepTime && (
                        <div className="flex items-center gap-1 text-[10px] text-[#6B5B50] pt-1 font-medium">
                          <Clock className="w-3 h-3 text-[#6B5B50]" />
                          <span>{dish.prepTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Food Image & Orange Add to Cart Button */}
                    <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-[#FFF8ED] flex flex-col justify-end border border-[#6B5B50]/15">
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
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-xs transition z-10 cursor-pointer shadow-sm group/fav"
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
                          className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#3B2115] border border-[#F4B942]/60 rounded-lg flex items-center justify-between p-1 shadow-md text-white"
                        >
                          <button
                            onClick={(e) => handleDecrement(e, dish)}
                            className="p-1 hover:bg-white/20 text-[#F4B942] rounded transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs text-white">{inCart.quantity}</span>
                          <button
                            onClick={(e) => handleIncrement(e, dish)}
                            className="p-1 hover:bg-white/20 text-[#F4B942] rounded transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleQuickAdd(e, dish)}
                          className="absolute bottom-1.5 right-1.5 px-3 py-1 rounded-lg bg-[#E8752A] hover:bg-[#3B2115] active:bg-[#24140D] text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
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
          <div className="p-3.5 rounded-2xl bg-white border-2 border-[#F4B942] shadow-[0_8px_30px_rgba(59,33,21,0.15)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={aiRecommendation.dish.imageUrl}
                alt={aiRecommendation.dish.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#F4B942] shrink-0"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F4B942] text-[#3B2115] flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    Chef Recommends
                  </span>
                  <span className="text-[11px] font-black text-[#3B2115]">₹{aiRecommendation.dish.price}</span>
                </div>
                <h4 className="font-bold text-xs text-[#24140D] line-clamp-1">{aiRecommendation.dish.name}</h4>
                <p className="text-[10px] text-[#6B5B50] line-clamp-1">{aiRecommendation.reason}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAcceptAiRecommendation}
                className="px-3 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-xs shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
              <button
                onClick={() => setAiRecommendation(null)}
                className="p-1 rounded-lg text-[#6B5B50] hover:text-[#24140D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar in Warm Orange / Deep Brown */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <Link
            to="/cart"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#E8752A] via-[#d9681f] to-[#3B2115] hover:opacity-95 text-white shadow-[0_8px_30px_rgba(232,117,42,0.4)] flex items-center justify-between transition-all transform active:scale-98 border border-[#F4B942]/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm shadow-inner">
                {cartItemCount}
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>View Order Cart</span>
                  {currentTable && <span className="text-xs font-semibold text-[#F4B942]">• Table {currentTable}</span>}
                </div>
                <div className="text-xs text-[#FFF8ED]/90 font-medium">
                  Total: ₹{cartTotal.toFixed(0)} (incl. taxes)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 font-black text-xs bg-white text-[#3B2115] px-3.5 py-1.5 rounded-xl shadow-sm">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4 text-[#E8752A]" />
            </div>
          </Link>
        </div>
      )}

      {/* Food Details Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-[#F4B942]/40 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col justify-between">
            
            {/* Food Hero Image */}
            <div className="relative h-52 bg-[#FFF8ED] shrink-0">
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
                  className="p-1.5 rounded-full bg-white/90 text-[#24140D] hover:bg-white shadow-md cursor-pointer transition"
                  title={favorites.includes(selectedFood.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${favorites.includes(selectedFood.id) ? 'fill-red-500 text-red-500' : 'text-[#6B5B50]'}`} />
                </button>

                <button
                  onClick={() => setSelectedFood(null)}
                  className="p-1.5 rounded-full bg-white/90 text-[#24140D] hover:bg-white shadow-md cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-lg text-[#24140D]">
                    {selectedFood.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      selectedFood.isVeg ? 'border-[#198754]' : 'border-[#D32F2F]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFood.isVeg ? 'bg-[#198754]' : 'bg-[#D32F2F]'}`} />
                    </span>
                    <span className="text-xs font-semibold text-[#6B5B50]">
                      {selectedFood.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                    </span>
                    {selectedFood.category && (
                      <span className="text-xs text-[#6B5B50]/80">• {selectedFood.category}</span>
                    )}
                  </div>
                </div>

                <span className="text-xl font-black text-[#3B2115] whitespace-nowrap">
                  ₹{selectedFood.price}
                </span>
              </div>

              <p className="text-xs text-[#6B5B50] leading-relaxed">
                {selectedFood.description}
              </p>

              {/* Ingredients */}
              {selectedFood.ingredients && (
                <div>
                  <h4 className="text-xs font-bold text-[#3B2115] uppercase tracking-wider mb-1.5">
                    Authentic Spices & Ingredients
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedFood.ingredients) ? selectedFood.ingredients : [selectedFood.ingredients]).map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-[#FFF8ED] text-[#3B2115] border border-[#F4B942]/40">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#3B2115] mb-1">
                  Special cooking instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medium spicy, extra butter naan, no onion..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A] focus:bg-white"
                />
              </div>
            </div>

            {/* Bottom Quantity & Add to Cart Bar */}
            <div className="p-4 bg-[#FFF8ED] border-t border-[#F4B942]/30 flex items-center justify-between gap-3">
              {/* Stepper */}
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-[#6B5B50]/20">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-[#6B5B50] hover:text-[#3B2115] p-1 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-sm text-[#24140D] w-4 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="text-[#6B5B50] hover:text-[#3B2115] p-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add CTA: Warm Orange #E8752A hovering to Deep Brown #3B2115 */}
              <button
                onClick={handleAddAndClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
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
