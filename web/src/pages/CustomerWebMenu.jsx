import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
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
  UserCheck
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
    cartTotal 
  } = useTableOrder();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
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

  const handleOpenFoodModal = (item) => {
    setSelectedFood(item);
    setQty(1);
    setNotes('');
  };

  const handleAddAndClose = () => {
    if (selectedFood) {
      addToCart(selectedFood, qty, notes);
      setSelectedFood(null);
    }
  };

  const handleSetManualTable = (e) => {
    e.preventDefault();
    if (manualTableInput.trim()) {
      setTableSession(manualTableInput.trim());
      setTableModalOpen(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Table QR Badge */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-glow">
            <QrCode className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>QR Verified: Table {currentTable || '01'}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Welcome to Smart Dine</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Table <strong>{currentTable || '01'}</strong> has been detected. Sign in to browse the digital menu and send orders directly to the chef.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              to={`/login?table=${currentTable || '01'}&role=customer&mode=login`}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-glow transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Order (Table {currentTable || '01'})</span>
            </Link>

            <Link
              to={`/login?table=${currentTable || '01'}&role=customer&mode=register`}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Account (Mobile OTP)</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-28">
      
      {/* Hero / Table Status Banner */}
      <section className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-b border-slate-800 px-4 pt-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Table Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white">Smart Dine Digital Menu</h1>
                <p className="text-xs text-slate-400">Scan Table QR • Order • Enjoy</p>
              </div>
            </div>

            {currentTable ? (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Table {currentTable}
                </div>
                <button
                  onClick={() => setTableModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-emerald-300 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setTableModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                Select Table
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for fresh salads, pasta, juices, rolls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-glow'
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
                    ? 'bg-emerald-600 text-white shadow-glow'
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
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/30">
                          <Flame className="w-2.5 h-2.5 text-emerald-400" />
                          Bestseller
                        </span>
                      )}
                    </div>

                    <h3 
                      onClick={() => handleOpenFoodModal(dish)}
                      className="font-bold text-sm text-slate-100 cursor-pointer hover:text-emerald-400 transition leading-snug"
                    >
                      {dish.name}
                    </h3>

                    <div className="font-extrabold text-sm text-emerald-400">
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
                      onClick={() => handleOpenFoodModal(dish)}
                      className="absolute bottom-1 right-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
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
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <Link
            to="/cart"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow-lg flex items-center justify-between transition-all transform active:scale-98"
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
                <div className="text-xs text-emerald-100">
                  Total: ₹{cartTotal.toFixed(0)} (incl. taxes)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs bg-white text-emerald-700 px-3 py-1.5 rounded-xl shadow">
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

                <span className="text-xl font-extrabold text-emerald-400">
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-glow transition active:scale-95"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-bold text-center focus:outline-none focus:border-emerald-500"
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
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    {t.tableNumber}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-glow transition"
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
