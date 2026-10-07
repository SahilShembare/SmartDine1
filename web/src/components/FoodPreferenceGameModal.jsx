import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Gamepad2,
  Dices,
  Flame,
  UtensilsCrossed,
  Check,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Crown,
  Heart,
  Star,
  X,
  Plus,
  ShoppingBag,
  Zap,
  Coffee,
  IceCream,
  Salad
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FoodPreferenceGameModal({
  isOpen,
  onClose,
  menuItems = [],
  addToCart,
  onOpenCart
}) {
  const [step, setStep] = useState(1); // 1: Vibe, 2: Diet, 3: Portion, 'thinking', 'result'
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [selectedPortion, setSelectedPortion] = useState('any');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningEmojiIndex, setSpinningEmojiIndex] = useState(0);

  // Recommendations state
  const [matchedDishes, setMatchedDishes] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [companionDish, setCompanionDish] = useState(null);
  const [matchScore, setMatchScore] = useState(98);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Emojis for roulette animation
  const rouletteEmojis = ['🔥', '🧀', '👑', '🧄', '🥗', '🍨', '🍕', '🍛', '🍔', '🥟', '🍜', '🥘'];

  useEffect(() => {
    let interval;
    if (isSpinning) {
      interval = setInterval(() => {
        setSpinningEmojiIndex((prev) => (prev + 1) % rouletteEmojis.length);
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isSpinning, rouletteEmojis.length]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedVibe(null);
      setSelectedDiet('all');
      setSelectedPortion('any');
      setAddedSuccess(false);
      setCurrentMatchIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Options
  const vibes = [
    {
      id: 'spicy',
      title: '🔥 Fiery & Spicy',
      desc: 'Bold masalas, sizzling aromatics & kick',
      keywords: ['biryani', 'schezwan', 'chilli', 'masala', 'kadai', 'spicy', 'tandoori', 'tikka']
    },
    {
      id: 'creamy',
      title: '🧀 Creamy & Cheesy',
      desc: 'Rich velvety gravies, butter & melted cheese',
      keywords: ['butter', 'paneer', 'cheese', 'creamy', 'makhani', 'malai', 'pizza', 'dal makhani']
    },
    {
      id: 'royal',
      title: '👑 Royal Feast',
      desc: 'Grand signature thalis, slow-cooked royal curries',
      keywords: ['thali', 'royal', 'shahi', 'special', 'bukhara', 'dum', 'maharaja']
    },
    {
      id: 'crispy',
      title: '🧄 Crispy & Crunchy',
      desc: 'Sizzling tandoor naans, rolls, wok-tossed starters',
      keywords: ['crispy', 'naan', 'manchurian', 'fries', 'garlic', 'roll', 'kebab', 'hakka']
    },
    {
      id: 'healthy',
      title: '🥗 Comfort & Light',
      desc: 'Wholesome dal khichdi, mild curries & soups',
      keywords: ['khichdi', 'salad', 'dal', 'soup', 'steamed', 'jeera', 'curd']
    },
    {
      id: 'sweet',
      title: '🍨 Sweet & Refreshing',
      desc: 'Mouthwatering sweets, royal desserts & cool sips',
      keywords: ['sweet', 'gulab', 'tukda', 'lassi', 'coffee', 'ice cream', 'dessert', 'mojito']
    }
  ];

  const diets = [
    { id: 'all', title: '🌟 Anything Delicious', subtitle: 'Show me whatever Chef AI recommends best' },
    { id: 'veg', title: '🟢 100% Pure Vegetarian', subtitle: 'Paneer, veggies, dals, lentils & dairy only' },
    { id: 'nonveg', title: '🔴 Non-Veg Delicacy', subtitle: 'Tender chicken, mutton, egg & meat curries' }
  ];

  const portions = [
    { id: 'main', icon: '🍛', title: 'Hearty Main Course', desc: 'Full-tummy curries, biryani, thalis & breads' },
    { id: 'starter', icon: '🥪', title: 'Quick Bites & Starters', desc: 'Appetizers, pizzas, burgers & noodles' },
    { id: 'sweet', icon: '🥤', title: 'Sweets & Refreshers', desc: 'Desserts, mocktails, shakes & beverages' },
    { id: 'any', icon: '🎲', title: 'Chef Choice Portion', desc: 'Open to any dish size or course' }
  ];

  // AI Matching Engine
  const computeRecommendations = (vibeObj, dietChoice, portionChoice) => {
    if (!menuItems || menuItems.length === 0) return [];

    let pool = [...menuItems];

    // 1. Dietary filter
    if (dietChoice === 'veg') {
      pool = pool.filter((item) => item.isVeg === true);
    } else if (dietChoice === 'nonveg') {
      const nonVegOnly = pool.filter((item) => item.isVeg === false);
      if (nonVegOnly.length > 0) pool = nonVegOnly;
    }

    // 2. Portion filter
    if (portionChoice === 'starter') {
      const starterPool = pool.filter((item) => {
        const cat = (item.category || item.categoryId || '').toLowerCase();
        return cat.includes('starter') || cat.includes('pizza') || cat.includes('burger') || cat.includes('noodle') || cat.includes('snack');
      });
      if (starterPool.length >= 2) pool = starterPool;
    } else if (portionChoice === 'main') {
      const mainPool = pool.filter((item) => {
        const cat = (item.category || item.categoryId || '').toLowerCase();
        return cat.includes('main') || cat.includes('curry') || cat.includes('thali') || cat.includes('biryani') || cat.includes('rice') || cat.includes('khichdi');
      });
      if (mainPool.length >= 2) pool = mainPool;
    } else if (portionChoice === 'sweet') {
      const sweetPool = pool.filter((item) => {
        const cat = (item.category || item.categoryId || '').toLowerCase();
        return cat.includes('dessert') || cat.includes('sweet') || cat.includes('beverage') || cat.includes('drink');
      });
      if (sweetPool.length >= 2) pool = sweetPool;
    }

    // 3. Vibe keyword scoring
    const scored = pool.map((item) => {
      let score = 0;
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      if (vibeObj?.keywords) {
        vibeObj.keywords.forEach((kw) => {
          if (name.includes(kw)) score += 5;
          if (desc.includes(kw)) score += 3;
          if (cat.includes(kw)) score += 2;
        });
      }

      // Bonus for rating and popular tags
      if (item.rating) score += Number(item.rating);
      if (name.includes('special') || name.includes('chef')) score += 2;

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.map((s) => s.item);

    return topMatches.length > 0 ? topMatches : menuItems.slice(0, 5);
  };

  // Find complementary companion dish
  const findCompanionDish = (primaryDish) => {
    if (!primaryDish || !menuItems || menuItems.length === 0) return null;
    const cat = (primaryDish.category || '').toLowerCase();
    const name = (primaryDish.name || '').toLowerCase();

    // If curry/gravy -> companion bread or rice
    if (cat.includes('main') || cat.includes('curry') || name.includes('masala') || name.includes('butter')) {
      const companion = menuItems.find(
        (m) =>
          m.id !== primaryDish.id &&
          ((m.category || '').toLowerCase().includes('bread') || (m.name || '').toLowerCase().includes('naan') || (m.name || '').toLowerCase().includes('roti'))
      );
      if (companion) return companion;
    }

    // If biryani -> companion raita / lassi
    if (name.includes('biryani') || cat.includes('rice')) {
      const companion = menuItems.find(
        (m) =>
          m.id !== primaryDish.id &&
          ((m.name || '').toLowerCase().includes('raita') || (m.name || '').toLowerCase().includes('lassi') || (m.name || '').toLowerCase().includes('gulab'))
      );
      if (companion) return companion;
    }

    // If starter/pizza -> companion beverage
    const beverage = menuItems.find(
      (m) =>
        m.id !== primaryDish.id &&
        ((m.category || '').toLowerCase().includes('beverage') || (m.name || '').toLowerCase().includes('mojito') || (m.name || '').toLowerCase().includes('coffee'))
    );
    return beverage || null;
  };

  // Launch thinking & celebration
  const runAiAnalysis = (vibeObj, dietVal, portionVal) => {
    setStep('thinking');
    setIsSpinning(true);

    setTimeout(() => {
      setIsSpinning(false);
      const matches = computeRecommendations(vibeObj, dietVal, portionVal);
      setMatchedDishes(matches);
      setCurrentMatchIndex(0);
      setCompanionDish(findCompanionDish(matches[0]));
      setMatchScore(Math.floor(Math.random() * 5) + 95); // 95% - 99%
      setStep('result');

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch {}
    }, 900);
  };

  // Surprise Me (Instant 1-Click Game)
  const handleInstantSurpriseMe = () => {
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    setSelectedVibe(randomVibe);
    setSelectedDiet('all');
    setSelectedPortion('any');
    runAiAnalysis(randomVibe, 'all', 'any');
  };

  const handleFinishQuiz = () => {
    runAiAnalysis(selectedVibe, selectedDiet, selectedPortion);
  };

  const handleNextMatch = () => {
    if (matchedDishes.length > 1) {
      const nextIdx = (currentMatchIndex + 1) % Math.min(matchedDishes.length, 5);
      setCurrentMatchIndex(nextIdx);
      setCompanionDish(findCompanionDish(matchedDishes[nextIdx]));
      setAddedSuccess(false);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const handleAddToCart = (dish) => {
    if (!dish) return;
    addToCart(dish, 1);
    setAddedSuccess(true);
    toast.success(`🎉 ${dish.name} added to your order!`, {
      icon: '🛒',
      duration: 3500
    });
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {}
  };

  const currentDish = matchedDishes[currentMatchIndex] || menuItems[0];

  // Dynamic explanation text based on selections
  const getAiReasonText = (dish) => {
    if (!dish) return 'Handcrafted chef special prepared with authentic kitchen ingredients.';
    const vibeName = selectedVibe?.title?.replace(/^[^\w\s]+/, '').trim() || 'Signature Taste';
    const dietStr = dish.isVeg ? 'pure vegetarian ingredients' : 'rich & savory spices';
    return `AI Chef matched this dish for your ${vibeName} craving with fresh ${dietStr}. Perfectly prepared for an unforgettable dining experience.`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        {/* Game Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white">AI Food Preference Game</h3>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
                  AI Matcher
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {step === 1 && 'Step 1 of 3: Pick your flavor craving'}
                {step === 2 && 'Step 2 of 3: Dietary preference'}
                {step === 3 && 'Step 3 of 3: Meal type & portion'}
                {step === 'thinking' && '🧠 AI Chef Analyzing Flavors...'}
                {step === 'result' && '🎉 Your 99% AI Dish Match is Ready!'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: PICK FLAVOR VIBE */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Question 1 / 3
              </span>
              <h4 className="text-base font-extrabold text-white">What flavor are you craving right now?</h4>
              <p className="text-xs text-slate-400">Tap your mood to start the taste profile calculation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {vibes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVibe(v)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedVibe?.id === v.id
                      ? 'bg-amber-400/15 border-amber-400 text-white shadow-glow'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">{v.title}</span>
                    {selectedVibe?.id === v.id && (
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{v.desc}</p>
                </button>
              ))}
            </div>

            {/* Quick Surprise Me Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={handleInstantSurpriseMe}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>🎰 Surprise Me (1-Click Lucky Dip)</span>
              </button>

              <button
                type="button"
                disabled={!selectedVibe}
                onClick={() => setStep(2)}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                  selectedVibe
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-glow cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: DIET PREFERENCE */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Question 2 / 3
              </span>
              <h4 className="text-base font-extrabold text-white">What is your dietary preference today?</h4>
              <p className="text-xs text-slate-400">We will strictly tailor dishes to your diet</p>
            </div>

            <div className="space-y-2.5 pt-1">
              {diets.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDiet(d.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedDiet === d.id
                      ? 'bg-amber-400/15 border-amber-400 text-white shadow-glow'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs block">{d.title}</span>
                    <span className="text-[10px] text-slate-400">{d.subtitle}</span>
                  </div>
                  {selectedDiet === d.id && (
                    <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow cursor-pointer active:scale-95"
              >
                <span>Final Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: PORTION & MEAL STYLE */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Question 3 / 3
              </span>
              <h4 className="text-base font-extrabold text-white">What meal size fits your appetite?</h4>
              <p className="text-xs text-slate-400">Select what course you want recommended</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {portions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPortion(p.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPortion === p.id
                      ? 'bg-amber-400/15 border-amber-400 text-white shadow-glow'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span className="font-extrabold text-xs">{p.title}</span>
                    </div>
                    {selectedPortion === p.id && (
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleFinishQuiz}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-glow cursor-pointer active:scale-95 animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Find My Match!</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 'thinking': ANIMATED AI CALCULATION */}
        {/* ======================================================== */}
        {step === 'thinking' && (
          <div className="p-8 text-center space-y-5 flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce">
                {rouletteEmojis[spinningEmojiIndex]}
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-extrabold text-white">AI Chef Is Matching Flavors...</h4>
              <p className="text-xs text-slate-400">
                Cross-referencing kitchen recipes, aromatic spices & {selectedVibe?.title || 'your vibe'}
              </p>
            </div>

            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 animate-[pulse_1s_infinite] w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 'result': AI RECOMMENDATION DISH CARD */}
        {/* ======================================================== */}
        {step === 'result' && currentDish && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Top Match Score Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                  ✨ {matchScore}% Taste Match Found
                </span>
              </div>

              {matchedDishes.length > 1 && (
                <button
                  onClick={handleNextMatch}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Next Match ({currentMatchIndex + 1}/{Math.min(matchedDishes.length, 5)})</span>
                </button>
              )}
            </div>

            {/* Dish Card Showcase */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-400/30 space-y-3.5 shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                <img
                  src={currentDish.imageUrl || '/dishes/paneer_butter_masala.jpg'}
                  alt={currentDish.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-amber-400/40 shrink-0 shadow-md"
                />

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                        currentDish.isVeg ? 'border-emerald-500' : 'border-rose-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentDish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {currentDish.category || 'Specialty'}
                    </span>
                    <span className="text-xs text-amber-300 font-bold ml-auto flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{currentDish.rating || 4.9}</span>
                    </span>
                  </div>

                  <h4 className="font-black text-base text-white">{currentDish.name}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{currentDish.description}</p>

                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-black text-amber-400">₹{currentDish.price}</span>
                    <span className="text-[10px] text-slate-400">• Ready in {currentDish.prepTime || '15–20 mins'}</span>
                  </div>
                </div>
              </div>

              {/* Why AI Picked This */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-300 text-[11px] space-y-0.5">
                <div className="font-extrabold text-amber-400 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Why Chef AI Picked This For You:</span>
                </div>
                <p className="leading-relaxed text-slate-300">{getAiReasonText(currentDish)}</p>
              </div>

              {/* Companion Pair Upsell (if available) */}
              {companionDish && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={companionDish.imageUrl || '/dishes/butter_naan.jpg'}
                      alt={companionDish.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 text-left">
                      <span className="text-[9px] font-bold text-amber-400 block uppercase">Perfect Companion:</span>
                      <span className="text-xs font-bold text-white truncate block">{companionDish.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(companionDish)}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold transition active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+₹{companionDish.price}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAddToCart(currentDish)}
                className={`w-full sm:flex-1 py-3 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-glow ${
                  addedSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Added To Cart! (Add Again)</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {currentDish.name} to Cart (₹{currentDish.price})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </div>

            {/* View Cart Shortcut */}
            {onOpenCart && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Go to Cart & Place Order →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
