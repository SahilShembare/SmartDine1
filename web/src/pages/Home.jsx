import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  LogIn, 
  UserPlus, 
  Flame, 
  Star, 
  QrCode, 
  ChefHat, 
  Clock, 
  Sparkles, 
  ArrowRight,
  UtensilsCrossed,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { menuItems } = useTableOrder();
  
  // Filter top dishes (bestsellers / popular or top 6)
  const [activeFilter, setActiveFilter] = useState('all'); // all, veg, non-veg
  const [previewDish, setPreviewDish] = useState(null);

  const topDishes = (menuItems && menuItems.length > 0 ? menuItems : [
    {
      id: 'top-1',
      name: 'Butter Chicken Special',
      price: 340,
      isVeg: false,
      popular: true,
      description: 'Tender chicken simmered in rich velvety makhani gravy with aromatic spices and butter.',
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Chicken, Cashew Paste, Butter, Cream, Kasturi Methi'
    },
    {
      id: 'top-2',
      name: 'Paneer Butter Masala',
      price: 290,
      isVeg: true,
      popular: true,
      description: 'Fresh cottage cheese cubes in luscious tomato gravy with fresh cream and butter.',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Paneer, Butter, Cream, Rich Tomato Puree'
    },
    {
      id: 'top-3',
      name: 'Hyderabadi Dum Biryani',
      price: 320,
      isVeg: false,
      popular: true,
      description: 'Fragrant basmati rice cooked on dum with marinated tender cuts, saffron, and fried onions.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Basmati Rice, Saffron, Spices, Mint, Fried Onions'
    },
    {
      id: 'top-4',
      name: 'Crispy Garlic Butter Naan',
      price: 65,
      isVeg: true,
      popular: true,
      description: 'Clay tandoor baked leavened bread brushed with garlic butter and fresh coriander.',
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Wheat Flour, Garlic, Butter, Coriander'
    },
    {
      id: 'top-5',
      name: 'Dal Makhani Bukhara',
      price: 240,
      isVeg: true,
      popular: true,
      description: 'Slow-simmered black lentils and kidney beans cooked overnight with white butter & cream.',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Black Urad, Rajma, White Butter, Fresh Cream'
    },
    {
      id: 'top-6',
      name: 'Royal Shahi Tukda',
      price: 180,
      isVeg: true,
      popular: true,
      description: 'Crispy golden bread soaked in saffron cardamom syrup topped with rabri and silver vark.',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Bread, Rabri, Saffron, Pistachios, Cardamom'
    }
  ]).filter(item => {
    if (activeFilter === 'veg') return item.isVeg === true;
    if (activeFilter === 'non-veg') return item.isVeg === false;
    return true;
  }).slice(0, 6);

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6">
        
        {/* Background Image: Cozy Warm Restaurant Interior */}
        <div className="absolute inset-0 z-0">
          <img
            src="/restaurant-bg.jpg"
            alt="SmartDine Restaurant Interior"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Cinematic dark overlay for crystal-clear readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-slate-950/95"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 py-12">
          
          {/* Live Kitchen Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur-md animate-in fade-in duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Live Kitchen Active • Instant Contactless Table Orders</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] font-sans">
            Welcome To SmartDine
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-100/90 font-medium tracking-wide drop-shadow-md max-w-2xl mx-auto">
            QR Based Smart Restaurant Ordering System
          </p>

          {/* 2 Main Action Option Buttons (Matching exact requested design) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            
            {/* Option 1: Login (Amber / Yellow button) */}
            <button
              onClick={() => navigate('/login?mode=login')}
              className="w-full sm:w-auto min-w-[150px] px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_4px_25px_rgba(251,191,36,0.45)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Login</span>
            </button>

            {/* Option 2: Create New Account (Emerald Green button) */}
            <button
              onClick={() => navigate('/login?mode=register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-[0_4px_25px_rgba(16,185,129,0.45)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Account</span>
            </button>

          </div>

          {/* Feature Badge Highlights */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-6 text-[11px] sm:text-xs text-slate-300 font-semibold">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>No App Download</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>~15 Min Fast Prep</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>100% Contactless</span>
            </div>
          </div>

        </div>

      </section>

      {/* 2. TOP SIGNATURE DISHES SHOWCASE */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        
        {/* Section Header with Veg Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold tracking-wider uppercase border border-orange-500/30 mb-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Chef's Special Recommendations
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Top Popular Dishes</span>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Handcrafted with authentic spices and fresh ingredients for your table
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === 'all' 
                  ? 'bg-orange-500 text-white shadow-glow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Bestsellers
            </button>
            <button
              onClick={() => setActiveFilter('veg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'veg' 
                  ? 'bg-emerald-600 text-white shadow-glow' 
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Pure Veg
            </button>
            <button
              onClick={() => setActiveFilter('non-veg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'non-veg' 
                  ? 'bg-red-600 text-white shadow-glow' 
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Dish Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topDishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => setPreviewDish(dish)}
              className="group rounded-3xl bg-slate-900/85 backdrop-blur-md border border-slate-800/80 overflow-hidden flex flex-col justify-between hover:border-orange-500/50 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
              
              {/* Dish Image */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Veg/Non-Veg Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    dish.isVeg !== false ? 'border-emerald-500' : 'border-red-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dish.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-200 uppercase">
                    {dish.isVeg !== false ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>

                {/* Bestseller Badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-glow">
                  <Flame className="w-3 h-3 text-white" />
                  <span>Top Choice</span>
                </div>

                {/* Rating overlay at bottom left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-amber-300 text-xs font-bold border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                </div>

                {/* Price Pill at bottom right */}
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-orange-500 text-white font-extrabold text-sm shadow-md">
                  ₹{dish.price}
                </div>
              </div>

              {/* Dish Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white group-hover:text-orange-400 transition-colors">
                    {dish.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {dish.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Freshly Cooked To Order
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/login?mode=login');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white border border-orange-500/40 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 3. UNIQUE 3-STEP "HOW SMARTDINE WORKS" */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Effortless Dining Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              How SmartDine Works in 3 Quick Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 relative group hover:border-orange-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">1. Scan Table QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the standee QR code placed at your dining table with any mobile camera. No registration or app download required!
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 relative group hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">2. Select & Customize</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore mouth-watering signature dishes with photos, customize spice levels, and send directly to the live kitchen station.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 relative group hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">3. Track & Savor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch real-time live cooking updates as chefs prepare your food, served freshly sizzling right to your table number!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. DISH PREVIEW POPUP MODAL */}
      {previewDish && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Image */}
            <div className="relative h-60 w-full overflow-hidden bg-slate-950">
              <img
                src={previewDish.imageUrl}
                alt={previewDish.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button
                onClick={() => setPreviewDish(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-2xl font-extrabold text-white drop-shadow">₹{previewDish.price}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  previewDish.isVeg !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {previewDish.isVeg !== false ? '🌱 100% Pure Vegetarian' : '🍗 Non-Vegetarian'}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">{previewDish.name}</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{previewDish.description}</p>
              </div>

              {previewDish.ingredients && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  <span className="font-bold text-slate-200">Key Ingredients: </span>
                  <span>{previewDish.ingredients}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setPreviewDish(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setPreviewDish(null);
                    navigate('/login?mode=login');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-glow transition flex items-center justify-center gap-1.5"
                >
                  <span>Sign In to Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
