import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  Info,
  LogIn,
  Lock,
  UserCheck,
  Bot,
  Zap,
  RotateCw
} from 'lucide-react';

export default function CustomerWebMenu() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, demoLogin } = useAuth();
  const { 
    currentTable, 
    setTableSession, 
    menuItems, 
    categories, 
    tables, 
    cart, 
    addToCart, 
    cartItemCount, 
    cartTotal,
    reloadLatestMenu
  } = useTableOrder();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  // AI Recommendation State
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [manualTableInput, setManualTableInput] = useState('');

  // Extract table parameter from QR scan URL e.g. /menu?table=01
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      setTableSession(tableParam);
    }
  }, [searchParams]);

  // Filter items
  const filteredDishes = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCategory && matchesSearch && matchesVeg;
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

  const handleAcceptAiRecommendation = () => {
    if (aiRecommendation?.dish) {
      addToCart(aiRecommendation.dish, 1);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      } catch {}
      setAiRecommendation(null);
    }
  };

  const handleSetManualTable = (e) => {
    e.preventDefault();
    if (manualTableInput.trim()) {
      setTableSession(manualTableInput.trim());
      setTableModalOpen(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-950 pb-28">
      
      {/* Hero / Table Status Banner */}
      <section className="bg-gradient-to-b from-orange-950/40 via-slate-900 to-slate-950 border-b border-slate-800 px-4 pt-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Table Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  Welcome to Table {currentTable || '01'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  reloadLatestMenu();
                }}
                title="Reload Latest Menu & Images"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-orange-400 text-xs transition cursor-pointer flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {currentTable ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Table {currentTable}
                  </div>
                  <button
                    onClick={() => setTableModalOpen(true)}
                    className="text-[11px] text-slate-400 hover:text-orange-300 underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setTableModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Select Table
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for butter chicken, pizza, biryani..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-inner"
            />
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white shadow-glow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Items
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                vegOnly
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                vegOnly ? 'border-emerald-400' : 'border-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${vegOnly ? 'bg-emerald-400' : 'bg-transparent'}`} />
              </span>
              <span>Pure Veg Only</span>
            </button>

            <span className="text-[11px] text-slate-400">
              {filteredDishes.length} dishes available
            </span>
          </div>

        </div>
      </section>

      {/* Food Cards Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Dishes in Menu</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The menu is currently empty. You can add new dishes from the Admin Panel.
            </p>
            <Link
              to="/admin/menu"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Admin Menu</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDishes.map((dish) => {
              const inCart = cart.find(i => i.id === dish.id);
              return (
                <div
                  key={dish.id}
                  className="rounded-2xl border border-slate-800/90 bg-slate-900/80 backdrop-blur-sm overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="flex gap-3 p-3.5">
                    
                    {/* Left Info */}
                    <div className="flex-1 space-y-1.5">
                      
                      <div className="flex items-center gap-2">
                        {/* Veg indicator */}
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          dish.isVeg ? 'border-emerald-500' : 'border-red-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </span>

                        {dish.popular && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" />
                            Bestseller
                          </span>
                        )}
                      </div>

                      <h3 
                        onClick={() => handleOpenFoodModal(dish)}
                        className="font-bold text-sm text-slate-100 cursor-pointer hover:text-orange-400 transition leading-snug"
                      >
                        {dish.name}
                      </h3>

                      <div className="font-extrabold text-sm text-white">
                        ₹{dish.price}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    {/* Right Image & Add Button */}
                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      
                      {/* Add button on card */}
                      <button
                        onClick={(e) => handleQuickAdd(e, dish)}
                        className="absolute bottom-1 right-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {inCart ? `${inCart.quantity}` : 'ADD'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING SMART AI CHEF RECOMMENDATION BANNER */}
      {aiRecommendation && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/90 border border-amber-500/50 shadow-[0_8px_30px_rgba(245,158,11,0.25)] backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={aiRecommendation.dish.imageUrl}
                alt={aiRecommendation.dish.name}
                className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shrink-0"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Chef Pairing
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-300">₹{aiRecommendation.dish.price}</span>
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-1">{aiRecommendation.dish.name}</h4>
                <p className="text-[10px] text-slate-300 line-clamp-1">{aiRecommendation.reason}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAcceptAiRecommendation}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Pair</span>
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
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <Link
            to="/cart"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-glow-lg flex items-center justify-between transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                {cartItemCount}
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>View Cart</span>
                  {currentTable && <span className="text-xs font-semibold opacity-90">• Table {currentTable}</span>}
                </div>
                <div className="text-xs text-orange-100">
                  Total: ₹{cartTotal.toFixed(0)} (incl. taxes)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs bg-white text-orange-600 px-3 py-1.5 rounded-xl">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* Food Details Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col justify-between">
            
            {/* Food Hero Image */}
            <div className="relative h-48 bg-slate-800">
              <img
                src={selectedFood.imageUrl}
                alt={selectedFood.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedFood(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {selectedFood.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      selectedFood.isVeg ? 'border-emerald-500' : 'border-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFood.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {selectedFood.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    </span>
                  </div>
                </div>

                <span className="text-xl font-extrabold text-orange-400">
                  ₹{selectedFood.price}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedFood.description}
              </p>

              {/* Ingredients */}
              {selectedFood.ingredients && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Ingredients & Flavors
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedFood.ingredients) ? selectedFood.ingredients : [selectedFood.ingredients]).map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Special cooking instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, no onion, extra crispy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Bottom Quantity & Add to Cart Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              {/* Stepper */}
              <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-sm text-white w-4 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add CTA */}
              <button
                onClick={handleAddAndClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-glow transition active:scale-95"
              >
                <span>Add to Cart</span>
                <span>•</span>
                <span>₹{(selectedFood.price * qty).toFixed(0)}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual Table Selector Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Select Your Table</h3>
              <button onClick={() => setTableModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Please enter your restaurant table number or choose from available tables below:
            </p>

            <form onSubmit={handleSetManualTable} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. 01, 02, 05"
                value={manualTableInput}
                onChange={(e) => setManualTableInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-bold text-center focus:outline-none focus:border-orange-500"
              />

              <div className="grid grid-cols-5 gap-2 pt-1">
                {tables.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTableSession(t.tableNumber);
                      setTableModalOpen(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-extrabold border transition ${
                      currentTable === t.tableNumber
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    {t.tableNumber}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs shadow-glow transition"
              >
                Confirm Table
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
