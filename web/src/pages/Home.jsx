import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import confetti from 'canvas-confetti';
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
  X,
  Bell,
  CheckCircle2,
  Droplets,
  Receipt,
  FileText,
  HelpCircle,
  Percent,
  Gift,
  Heart,
  Quote
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { menuItems, currentTable, addToCart } = useTableOrder();
  
  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Top Dishes Filter
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewDish, setPreviewDish] = useState(null);

  // Feature 1: Food Mood Matcher State
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodRecommendation, setMoodRecommendation] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Feature 2: Call Waiter State
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterRequestSent, setWaiterRequestSent] = useState(null);

  // Feature 4: Customer Reviews Carousel
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallSuccess(true);
        setTimeout(() => setShowInstallSuccess(false), 4000);
      }
      setDeferredPrompt(null);
    } else {
      const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert('To install SmartDine App on your device, open your browser menu (⋮) and tap "Install App" or "Add to Home Screen" 📲');
      }
    }
  };

  // Top Dishes (Strictly 5, No Price shown)
  const topDishes = (menuItems && menuItems.length > 0 ? menuItems : [
    {
      id: 'top-1',
      name: 'Butter Chicken Special',
      isVeg: false,
      popular: true,
      description: 'Tender chicken simmered in rich velvety makhani gravy with aromatic spices and butter.',
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Chicken, Cashew Paste, Butter, Cream, Kasturi Methi'
    },
    {
      id: 'top-2',
      name: 'Paneer Butter Masala',
      isVeg: true,
      popular: true,
      description: 'Fresh cottage cheese cubes in luscious tomato gravy with fresh cream and butter.',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Paneer, Butter, Cream, Rich Tomato Puree'
    },
    {
      id: 'top-3',
      name: 'Hyderabadi Dum Biryani',
      isVeg: false,
      popular: true,
      description: 'Fragrant basmati rice cooked on dum with marinated tender cuts, saffron, and fried onions.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Basmati Rice, Saffron, Spices, Mint, Fried Onions'
    },
    {
      id: 'top-4',
      name: 'Crispy Garlic Butter Naan',
      isVeg: true,
      popular: true,
      description: 'Clay tandoor baked leavened bread brushed with garlic butter and fresh coriander.',
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Wheat Flour, Garlic, Butter, Coriander'
    },
    {
      id: 'top-5',
      name: 'Dal Makhani Bukhara',
      isVeg: true,
      popular: true,
      description: 'Slow-simmered black lentils and kidney beans cooked overnight with white butter & cream.',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Black Urad, Rajma, White Butter, Fresh Cream'
    }
  ]).filter(item => {
    if (activeFilter === 'veg') return item.isVeg === true;
    if (activeFilter === 'non-veg') return item.isVeg === false;
    return true;
  }).slice(0, 5);

  // Food Mood Matcher Options
  const moods = [
    { key: 'spicy', label: '🔥 Spicy & Fiery', dishName: 'Hyderabadi Dum Biryani', tag: 'Aromatic & Spicy' },
    { key: 'cheesy', label: '🧀 Creamy & Cheesy', dishName: 'Paneer Butter Masala', tag: 'Velvety Rich' },
    { key: 'crispy', label: '🧄 Crispy & Fresh', dishName: 'Crispy Garlic Butter Naan', tag: 'Tandoor Sizzling' },
    { key: 'royal', label: '👑 Royal Feast', dishName: 'Butter Chicken Special', tag: 'Chef Signature' },
    { key: 'sweet', label: '🍨 Sweet Indulgence', dishName: 'Royal Shahi Tukda', tag: 'Mouthwatering Sweet' }
  ];

  const handlePickMood = (mood) => {
    setSelectedMood(mood);
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
      const foundDish = menuItems.find(m => m.name.toLowerCase().includes(mood.dishName.toLowerCase())) || topDishes[0];
      setMoodRecommendation({ ...foundDish, moodLabel: mood.label, tag: mood.tag });
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}
    }, 600);
  };

  // Call Waiter handler
  const handleCallWaiter = (serviceType) => {
    setWaiterRequestSent(serviceType);
    setTimeout(() => {
      setWaiterRequestSent(null);
      setIsWaiterModalOpen(false);
    }, 3000);
  };

  // Real Dining Reviews
  const reviews = [
    { name: 'Rohit Sharma', text: 'Loved the fast QR ordering! Butter Chicken was mindblowing and served in 12 minutes.', table: 'Table 04', stars: 5 },
    { name: 'Pooja Verma', text: 'No waiting for the waiter, order customization is so easy directly from the phone. 10/10 service.', table: 'Table 08', stars: 5 },
    { name: 'Amit Kulkarni', text: 'Crispy Garlic Naan with Dal Makhani is an absolute must-try! Seamless dining experience.', table: 'Table 02', stars: 5 }
  ];

  useEffect(() => {
    const reviewTimer = setInterval(() => {
      setReviewIndex(prev => (prev + 1) % reviews.length);
    }, 4500);
    return () => clearInterval(reviewTimer);
  }, [reviews.length]);

  return (
    <div className="relative min-h-screen bg-transparent text-slate-100 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6">
        
        {/* Background Image: User Uploaded Warm Cafe/Restaurant Interior */}
        <div className="absolute inset-0 z-0">
          <img
            src="/restaurant-bg.jpg"
            alt="SmartDine Restaurant Interior"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Cinematic dark overlay */}
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

          {/* 2 Main Action Option Buttons */}
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

          {/* 1-Click Install Mobile App Button */}
          <div className="pt-2">
            <button
              onClick={handleInstallApp}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-extrabold shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-base">📲</span>
              <span>Install SmartDine Mobile App</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto pt-4 text-[11px] sm:text-xs text-slate-300 font-semibold">
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

      {/* FEATURE 3: TODAY'S CHEF DAILY SPECIAL & LIMITED OFFER BANNER */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-5 sm:p-6 text-white shadow-glow-lg border-2 border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🎁
            </div>
            <div>
              <span className="inline-block text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-white text-orange-700 mb-1">
                TODAY'S CHEF OFFER
              </span>
              <h3 className="font-extrabold text-base sm:text-lg">
                Complimentary Hot Gulab Jamun on Orders Above ₹499!
              </h3>
              <p className="text-xs text-orange-100">
                Freshly fried & soaked in aromatic saffron syrup • Auto applied at table billing
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/login?mode=login')}
            className="px-5 py-2.5 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 font-black text-xs shadow-lg transition active:scale-95 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <span>Claim Offer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* FEATURE 1: 🎰 FOOD MOOD MATCHER / RECOMMENDATION PICKER */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-16 space-y-6">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              🎰 Confused What To Order?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Pick Your Mood — Chef Will Match Your Dish!
            </h2>
            <p className="text-xs text-slate-400">
              Tap a craving below to get an instant tailored recommendation with recipe secrets
            </p>
          </div>

          {/* Mood Selector Buttons */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {moods.map((m) => (
              <button
                key={m.key}
                onClick={() => handlePickMood(m)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all transform active:scale-95 cursor-pointer border ${
                  selectedMood?.key === m.key
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-105'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-400/50 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Result Card */}
          {moodRecommendation && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-900 border border-amber-400/40 animate-in zoom-in-95 duration-300 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={moodRecommendation.imageUrl}
                alt={moodRecommendation.name}
                className="w-24 h-24 rounded-2xl object-cover border border-amber-400/40 shrink-0 shadow-lg"
              />
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {moodRecommendation.moodLabel} Match!
                  </span>
                  <span className="text-xs text-amber-300 font-bold">⭐ 4.9 Rating</span>
                </div>
                <h4 className="font-extrabold text-lg text-white">{moodRecommendation.name}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{moodRecommendation.description}</p>
              </div>

              <button
                onClick={() => navigate('/login?mode=login')}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-glow transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <span>Order This Dish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. TOP SIGNATURE DISHES SHOWCASE (STRICTLY TOP 5, NO PRICES) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        
        {/* Section Header with Veg Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold tracking-wider uppercase border border-orange-500/30 mb-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Chef's Special Recommendations
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Top 5 Signature Dishes</span>
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
              All Top 5
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
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-sm text-amber-300 text-xs font-bold border border-white/10 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9 • Chef Special</span>
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

      {/* FEATURE 4: 💬 LIVE DINING GUEST REVIEWS CAROUSEL */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/95 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">What Diners Are Saying</h3>
                <p className="text-xs text-slate-400">Verified dining guest feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Star className="w-4 h-4 fill-current" />
              <span>4.9 / 5.0</span>
            </div>
          </div>

          <div className="py-2 space-y-3">
            <p className="text-base text-slate-200 italic leading-relaxed">
              "{reviews[reviewIndex].text}"
            </p>
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                {reviews[reviewIndex].name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold">
                {reviews[reviewIndex].table}
              </span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pt-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setReviewIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  reviewIndex === i ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE 2: 🛎️ FLOATING CALL WAITER BUTTON & MODAL */}
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-40">
        <button
          onClick={() => setIsWaiterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-glow-lg border-2 border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Call Waiter</span>
        </button>
      </div>

      {/* Call Waiter Modal */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Table Service Assistance</h3>
                  <p className="text-[11px] text-slate-400">Table {currentTable || '01'}</p>
                </div>
              </div>
              <button onClick={() => setIsWaiterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {waiterRequestSent ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-sm">Request Sent to Captain!</h4>
                <p className="text-xs text-slate-300">Staff is arriving at Table {currentTable || '01'} with {waiterRequestSent}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleCallWaiter('Drinking Water')}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 transition active:scale-95 cursor-pointer"
                >
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div className="font-extrabold text-xs text-white">Water</div>
                  <div className="text-[10px] text-slate-400">Regular / Chilled</div>
                </button>

                <button
                  onClick={() => handleCallWaiter('Extra Cutlery & Napkins')}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 transition active:scale-95 cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div className="font-extrabold text-xs text-white">Napkins</div>
                  <div className="text-[10px] text-slate-400">Tissues & Spoons</div>
                </button>

                <button
                  onClick={() => handleCallWaiter('Bill / Check Request')}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 transition active:scale-95 cursor-pointer"
                >
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <div className="font-extrabold text-xs text-white">Ask for Bill</div>
                  <div className="text-[10px] text-slate-400">Cash / UPI / Card</div>
                </button>

                <button
                  onClick={() => handleCallWaiter('Captain Table Assistance')}
                  className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 transition active:scale-95 cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <div className="font-extrabold text-xs text-white">Call Captain</div>
                  <div className="text-[10px] text-slate-400">General Support</div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISH PREVIEW POPUP MODAL */}
      {previewDish && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-60 w-full overflow-hidden bg-slate-950">
              <img
                src={previewDish.imageUrl}
                alt={previewDish.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button
                onClick={() => setPreviewDish(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-sm font-extrabold text-amber-300 drop-shadow flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>4.9 Customer Rating</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  previewDish.isVeg !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {previewDish.isVeg !== false ? '🌱 100% Pure Vegetarian' : '🍗 Non-Vegetarian'}
                </span>
              </div>
            </div>

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
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setPreviewDish(null);
                    navigate('/login?mode=login');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-glow transition flex items-center justify-center gap-1.5 cursor-pointer"
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
