/**
 * SmartDine Customer AI Intelligence & Recommendation Engine
 * 
 * Multi-signal scoring based on:
 * - Past customer order history & re-order frequencies
 * - Explicit customer preferences (Spicy, Healthy, Fast Food, Indian, Desserts, Veg, Non-Veg)
 * - Customer feedback ratings & reviews (5⭐ boosts, 2⭐ lowers)
 * - Time-of-day contextual dining patterns
 * - Cart contents & affinity pairings
 * - Restaurant-wide item ratings and popularity
 */

// ============================================================================
// 1. Time-of-Day Context Detection
// ============================================================================
export function getTimeContext() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      badge: '☀️ Perfect for your morning breakfast',
      greeting: 'Good morning!',
      recommendedCategories: ['Beverages', 'Breakfast', 'Snacks', 'Light Meals'],
      flavorMood: 'Refreshing & Energizing'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      badge: '🍛 Perfect for your afternoon lunch',
      greeting: 'Good afternoon!',
      recommendedCategories: ['Main Course', 'Biryani', 'Thali', 'Beverages'],
      flavorMood: 'Hearty & Fulfilling'
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      period: 'evening',
      badge: '🌙 Perfect for your evening',
      greeting: 'Good evening!',
      recommendedCategories: ['Pizza', 'Snacks', 'Starters', 'Beverages', 'Chinese'],
      flavorMood: 'Crispy, Savory & Relaxing'
    };
  } else {
    return {
      period: 'night',
      badge: '🌙 Perfect for your dinner & night cravings',
      greeting: 'Good night!',
      recommendedCategories: ['Main Course', 'Biryani', 'Breads', 'Desserts'],
      flavorMood: 'Rich, Comforting & Sweet'
    };
  }
}

// ============================================================================
// 2. Customer Profile & Preference Storage
// ============================================================================
const PROFILE_KEY = 'smartdine_customer_profile';

export function getCustomerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading customer profile:', e);
  }

  // Default empty profile for new diners
  return {
    isNewUser: true,
    preferences: [], // ['spicy', 'healthy', 'fast_food', 'indian', 'desserts', 'beverages', 'veg', 'nonveg']
    orderedDishNames: {}, // { 'Paneer Pizza': 3, 'Cold Coffee': 2 }
    dishRatings: {}, // { 'Paneer Pizza': 5, 'Veg Hakka Noodles': 3 }
    favoriteCategories: ['Pizza', 'Main Course'],
    dietPreference: 'all', // 'all' | 'veg' | 'nonveg'
    priceTier: 'mid', // 'budget' | 'mid' | 'premium'
    feedbackTags: []
  };
}

export function saveCustomerProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving customer profile:', e);
  }
}

// ============================================================================
// 3. New Customer Preference Chips Definition
// ============================================================================
export const TASTE_PREFERENCE_CHIPS = [
  { id: 'spicy', label: '🌶️ Spicy', categoryHint: ['Main Course', 'Starters'] },
  { id: 'healthy', label: '🥗 Healthy', categoryHint: ['Soups', 'Salads', 'Main Course'] },
  { id: 'fast_food', label: '🍕 Fast Food', categoryHint: ['Pizza', 'Burger', 'Snacks'] },
  { id: 'indian', label: '🍛 Indian', categoryHint: ['Main Course', 'Biryani', 'Breads'] },
  { id: 'desserts', label: '🍰 Desserts', categoryHint: ['Desserts', 'Sweets'] },
  { id: 'beverages', label: '☕ Beverages', categoryHint: ['Beverages', 'Mocktails', 'Coffee'] },
  { id: 'veg', label: '🥬 Vegetarian', filterVeg: true },
  { id: 'nonveg', label: '🍗 Non-Vegetarian', filterVeg: false }
];

// ============================================================================
// 4. Personalized Recommendations Algorithm ("Recommended For You")
// ============================================================================
export function getPersonalizedRecommendations({
  menuItems = [],
  cart = [],
  customerProfile = null,
  limit = 4
}) {
  if (!menuItems || menuItems.length === 0) return [];

  const profile = customerProfile || getCustomerProfile();
  const timeContext = getTimeContext();
  const cartIds = new Set(cart.map(c => c.id));
  const cartNames = cart.map(c => (c.name || '').toLowerCase());

  // Score each menu item
  const scoredItems = menuItems
    .filter(item => !cartIds.has(item.id) && item.isAvailable !== false)
    .map(item => {
      let score = 50; // Base score
      let reasons = [];
      let whyFactors = [];

      const nameLower = (item.name || '').toLowerCase();
      const catLower = (item.category || '').toLowerCase();

      // 1. Dietary Preference Filter
      if (profile.preferences.includes('veg') && item.isVeg === false) {
        return { item, score: -100, reasons, whyFactors };
      }
      if (profile.preferences.includes('nonveg') && item.isVeg === true) {
        score -= 10;
      }

      // 2. SAME DISH / SIMILAR DISH MATCHING (Primary Signal)
      // When diner has dishes in cart or past orders, match dishes from the same category or with the same core ingredient
      let sameDishMatched = false;
      for (const c of cart) {
        const cNameLower = (c.name || '').toLowerCase();
        const cCatLower = (c.category || '').toLowerCase();

        // A) Exact same dish in cart is already filtered out, but if same category:
        if (catLower && cCatLower && (catLower === cCatLower || catLower.includes(cCatLower) || cCatLower.includes(catLower))) {
          score += 45;
          reasons.push(`Similar to ${c.name} (Same ${item.category || 'Category'})`);
          whyFactors.push(`Recommended because you selected ${c.name} from ${item.category || 'this category'}`);
          sameDishMatched = true;
          break;
        }

        // B) Same core ingredient matching (e.g. paneer with paneer, chicken with chicken, pizza with pizza)
        const commonIngredients = ['paneer', 'chicken', 'pizza', 'biryani', 'burger', 'naan', 'dosa', 'dal', 'tikka', 'pasta', 'sandwich', 'curry'];
        const matchedKw = commonIngredients.find(kw => cNameLower.includes(kw) && nameLower.includes(kw));
        if (matchedKw) {
          score += 42;
          reasons.push(`Similar dish with ${matchedKw} (like your ${c.name})`);
          whyFactors.push(`Shares the same key ingredient (${matchedKw}) with ${c.name}`);
          sameDishMatched = true;
          break;
        }
      }

      // 3. Customer Past Order & Repeat Preferences (Same dish history)
      const orderCount = profile.orderedDishNames[item.name] || 0;
      if (orderCount > 0) {
        score += Math.min(orderCount * 14, 42);
        reasons.push(`Because you previously ordered ${item.name} (${orderCount}x)`);
        whyFactors.push(`You ordered this ${orderCount} time${orderCount > 1 ? 's' : ''} in past visits`);
        sameDishMatched = true;
      }

      // 4. Customer Past Feedback Bonus / Penalty (Learning Loop)
      const pastRating = profile.dishRatings[item.name];
      if (pastRating === 5) {
        score += 25;
        reasons.push(`Rated 5⭐ by you`);
        whyFactors.push(`You gave this dish a 5-star rating on your last visit`);
      } else if (pastRating === 4) {
        score += 15;
      } else if (pastRating <= 2) {
        score -= 40; // Deprioritize
      }

      // 5. Explicit Taste Preferences Matching
      if (profile.preferences.includes('spicy') && (nameLower.includes('tikka') || nameLower.includes('peri') || nameLower.includes('spicy') || nameLower.includes('masala') || nameLower.includes('kadhai'))) {
        score += 20;
        reasons.push('Matches your spicy taste preference 🌶️');
        whyFactors.push('High match for your selected spicy flavor profile');
      }
      if (profile.preferences.includes('fast_food') && (catLower.includes('pizza') || catLower.includes('burger') || nameLower.includes('fries'))) {
        score += 22;
        reasons.push('Fast-food favorite 🍕');
        whyFactors.push('Top-rated item in fast-food category');
      }
      if (profile.preferences.includes('indian') && (catLower.includes('curry') || catLower.includes('main') || nameLower.includes('paneer') || nameLower.includes('butter') || nameLower.includes('dal') || nameLower.includes('biryani') || nameLower.includes('naan'))) {
        score += 20;
        reasons.push('Authentic Indian royal delicacy 🍛');
        whyFactors.push('Traditional favorite with rich flavors');
      }
      if (profile.preferences.includes('desserts') && (catLower.includes('dessert') || nameLower.includes('brownie') || nameLower.includes('jamun') || nameLower.includes('ice cream'))) {
        score += 24;
        reasons.push('Sweet treat 🍰');
        whyFactors.push('Delightful sweet pairing for your meal');
      }
      if (profile.preferences.includes('beverages') && (catLower.includes('beverage') || nameLower.includes('coffee') || nameLower.includes('mojito') || nameLower.includes('shake'))) {
        score += 20;
        reasons.push('Refreshing companion drink 🥤');
        whyFactors.push('Fast-prep beverage with high repeat ordering rate');
      }

      // 6. Time of Day Relevance
      if (timeContext.recommendedCategories.some(c => catLower.includes(c.toLowerCase()))) {
        score += 18;
        if (reasons.length === 0) {
          reasons.push(timeContext.badge);
        }
        whyFactors.push(`Trending dish during the ${timeContext.period} dining shift`);
      }

      // 7. Restaurant Popularity & Rating
      if (item.popular || item.isBestseller) {
        score += 15;
        whyFactors.push('SmartDine restaurant bestseller with 4.7+ customer rating');
      }

      // Default reason if empty
      if (reasons.length === 0) {
        reasons.push('Recommended to match your taste profile');
        whyFactors.push('Balanced dining recommendation based on dish ratings and popularity');
      }

      return {
        item,
        score,
        primaryReason: reasons[0],
        allReasons: reasons,
        whyFactors: whyFactors.length > 0 ? whyFactors : ['Popular with diners at this hour', 'Prepared fresh to order']
      };
    })
    .sort((a, b) => b.score - a.score);

  return scoredItems.slice(0, limit);
}

// ============================================================================
// 5. Smart Cart Complementary Recommendations ("Complete Your Meal")
// ============================================================================
export function getCartComplementaryItems({ cart = [], menuItems = [], limit = 3 }) {
  if (!menuItems || menuItems.length === 0 || !cart || cart.length === 0) return [];

  const cartIds = new Set(cart.map(c => c.id));
  const cartText = cart.map(c => `${c.name} ${c.category || ''}`).join(' ').toLowerCase();

  // Candidates that are NOT in cart
  const candidates = menuItems.filter(item => !cartIds.has(item.id) && item.isAvailable !== false);

  const scored = candidates.map(item => {
    let score = 10;
    let reason = 'Customers also enjoyed';
    const nameLower = (item.name || '').toLowerCase();
    const catLower = (item.category || '').toLowerCase();

    // 1. If cart has pizza/burger -> recommend cold coffee, garlic bread, fries
    if (cartText.includes('pizza') || cartText.includes('burger')) {
      if (nameLower.includes('garlic bread') || nameLower.includes('garlic')) {
        score += 45;
        reason = 'Crispy garlic crust pairing with your pizza';
      } else if (nameLower.includes('coffee') || nameLower.includes('shake') || nameLower.includes('beverage')) {
        score += 40;
        reason = 'Chilled beverage to complete your meal';
      } else if (nameLower.includes('fries') || nameLower.includes('peri')) {
        score += 35;
        reason = 'Crispy side accompaniment';
      }
    }

    // 2. If cart has curry -> recommend naan, roti, jeera rice
    if (cartText.includes('chicken') || cartText.includes('paneer') || cartText.includes('dal') || cartText.includes('curry')) {
      if (nameLower.includes('garlic naan') || nameLower.includes('butter naan') || nameLower.includes('roti')) {
        score += 50;
        reason = 'Warm freshly baked naan to dip in your gravy';
      } else if (nameLower.includes('rice') || nameLower.includes('jeera')) {
        score += 35;
        reason = 'Aromatic steamed rice accompaniment';
      } else if (nameLower.includes('lassi') || nameLower.includes('drink')) {
        score += 30;
        reason = 'Cool soothing beverage';
      }
    }

    // 3. If cart has biryani -> recommend raita, gulab jamun, cold drink
    if (cartText.includes('biryani') || cartText.includes('pulao')) {
      if (nameLower.includes('jamun') || nameLower.includes('dessert') || nameLower.includes('brownie')) {
        score += 40;
        reason = 'Sweet royal dessert finish after spices';
      } else if (nameLower.includes('raita') || nameLower.includes('mojito')) {
        score += 35;
        reason = 'Refreshing palate cleanser';
      }
    }

    // 4. Fallback to high margin beverages or desserts
    if (catLower.includes('beverage') || catLower.includes('dessert')) {
      score += 20;
    }

    return {
      dish: item,
      score,
      reason
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ============================================================================
// 6. AI Suggested Combo Builder
// ============================================================================
export function getAiSuggestedCombo({ cart = [], menuItems = [] }) {
  if (!menuItems || menuItems.length === 0) return null;

  // Identify anchor dish (either from cart or popular menu item)
  let mainDish = cart.length > 0
    ? cart[0]
    : menuItems.find(i => (i.name || '').toLowerCase().includes('pizza') || (i.name || '').toLowerCase().includes('chicken') || i.popular);

  if (!mainDish && menuItems.length > 0) {
    mainDish = menuItems[0];
  }

  const mainNameLower = (mainDish?.name || '').toLowerCase();

  let sideDish = null;
  let drinkDish = null;

  if (mainNameLower.includes('pizza') || mainNameLower.includes('burger')) {
    sideDish = menuItems.find(i => (i.name || '').toLowerCase().includes('garlic bread') || (i.name || '').toLowerCase().includes('fries'));
    drinkDish = menuItems.find(i => (i.name || '').toLowerCase().includes('cold coffee') || (i.name || '').toLowerCase().includes('mojito') || (i.category || '').toLowerCase().includes('beverage'));
  } else if (mainNameLower.includes('chicken') || mainNameLower.includes('paneer') || mainNameLower.includes('dal')) {
    sideDish = menuItems.find(i => (i.name || '').toLowerCase().includes('garlic naan') || (i.name || '').toLowerCase().includes('butter naan'));
    drinkDish = menuItems.find(i => (i.name || '').toLowerCase().includes('lassi') || (i.name || '').toLowerCase().includes('jamun') || (i.name || '').toLowerCase().includes('coffee'));
  } else {
    sideDish = menuItems.find(i => i.id !== mainDish.id && !i.name.includes('Cold') && i.price < 200);
    drinkDish = menuItems.find(i => i.id !== mainDish?.id && (i.category || '').toLowerCase().includes('beverage'));
  }

  // Fallback if not found
  if (!sideDish) {
    sideDish = menuItems.find(i => i.id !== mainDish?.id) || { name: 'Garlic Bread', price: 149 };
  }
  if (!drinkDish) {
    drinkDish = menuItems.find(i => i.id !== mainDish?.id && i.id !== sideDish?.id) || { name: 'Cold Coffee', price: 129 };
  }

  const items = [mainDish, sideDish, drinkDish].filter(Boolean);
  const individualPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const savings = Math.max(40, Math.round(individualPrice * 0.14)); // ~14% bundle discount
  const comboPrice = individualPrice - savings;

  return {
    id: `combo-${mainDish.id}`,
    title: `${mainDish.name} + ${sideDish.name} + ${drinkDish.name}`,
    items,
    individualPrice,
    comboPrice,
    savings,
    badge: '🍽️ AI Suggested Combo',
    why: 'Handcrafted algorithm pairing a signature main, crispy side, and chilled beverage with an exclusive ₹' + savings + ' diner saving.'
  };
}

// ============================================================================
// 7. Smart "You May Also Like" (Food Modal / Details)
// ============================================================================
export function getSimilarDishes({ currentItem, menuItems = [], limit = 3 }) {
  if (!currentItem || !menuItems || menuItems.length === 0) return [];

  const currentPrice = Number(currentItem.price) || 200;
  const currentCategory = currentItem.categoryId || currentItem.category || '';
  const currentName = (currentItem.name || '').toLowerCase();

  const candidates = menuItems
    .filter(item => item.id !== currentItem.id && item.isAvailable !== false)
    .map(item => {
      let score = 0;
      const itemNameLower = (item.name || '').toLowerCase();
      const itemCategory = item.categoryId || item.category || '';

      // 1. Same category
      if (itemCategory === currentCategory) {
        score += 40;
      }

      // 2. Similar Dietary Flag (Veg with Veg)
      if (item.isVeg === currentItem.isVeg) {
        score += 25;
      }

      // 3. Similar Price Range (+- 30%)
      const priceDiffRatio = Math.abs((Number(item.price) || 200) - currentPrice) / currentPrice;
      if (priceDiffRatio <= 0.3) {
        score += 20;
      }

      // 4. Keyword / Flavor overlap
      const keywords = ['paneer', 'chicken', 'cheese', 'burger', 'pizza', 'tikka', 'garlic', 'chocolate'];
      keywords.forEach(kw => {
        if (currentName.includes(kw) && itemNameLower.includes(kw)) {
          score += 25;
        }
      });

      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit).map(c => c.item);
}

// ============================================================================
// 8. AI Feedback Sentiment & Telemetry Analyzer
// ============================================================================
export function analyzeCustomerFeedback({
  overallRating = 5,
  itemRatings = {},
  selectedTags = [],
  writtenText = '',
  order = null
}) {
  const textLower = (writtenText || '').toLowerCase();

  // Sentiment Classification
  let sentiment = 'Positive';
  let sentimentIcon = '😊';
  if (overallRating <= 2 || textLower.includes('bad') || textLower.includes('terrible') || textLower.includes('cold') || textLower.includes('worst')) {
    sentiment = 'Negative';
    sentimentIcon = '😞';
  } else if (overallRating === 3 || textLower.includes('okay') || textLower.includes('average') || textLower.includes('slow') || textLower.includes('wait')) {
    sentiment = 'Mixed/Neutral';
    sentimentIcon = '😐';
  }

  // Service Speed Analysis
  let serviceStatus = 'Normal';
  if (selectedTags.includes('⚡ Fast Service')) {
    serviceStatus = '⚡ Exceptional Speed';
  } else if (selectedTags.includes('Long waiting time') || textLower.includes('wait') || textLower.includes('late') || textLower.includes('delay')) {
    serviceStatus = '⚠️ Needs Kitchen Improvement';
  }

  // Food Quality Score
  const itemRatingValues = Object.values(itemRatings);
  const avgFoodScore = itemRatingValues.length > 0
    ? (itemRatingValues.reduce((a, b) => a + b, 0) / itemRatingValues.length).toFixed(1)
    : overallRating;

  // Key issues or praise
  const praisePoints = selectedTags.filter(t => !['Too spicy', 'Too salty', 'Food was cold', 'Long waiting time', 'Portion too small', 'Service issue', 'Other'].includes(t));
  const complaintPoints = selectedTags.filter(t => ['Too spicy', 'Too salty', 'Food was cold', 'Long waiting time', 'Portion too small', 'Service issue', 'Other'].includes(t));

  return {
    sentiment,
    sentimentIcon,
    avgFoodScore,
    serviceStatus,
    praisePoints,
    complaintPoints,
    aiSummary: `Customer gave ${overallRating}⭐ rating. ${praisePoints.length > 0 ? 'Praised: ' + praisePoints.join(', ') + '. ' : ''}${complaintPoints.length > 0 ? 'Flagged: ' + complaintPoints.join(', ') + '.' : 'Overall delightful dining experience.'}`
  };
}

// ============================================================================
// 9. Feedback -> Recommendation Learning Loop
// ============================================================================
export function applyFeedbackToProfile({
  profile = null,
  overallRating = 5,
  itemRatings = {},
  selectedTags = [],
  orderItems = []
}) {
  const currentProfile = profile || getCustomerProfile();

  // 1. Record individual item ratings
  Object.entries(itemRatings).forEach(([dishName, rating]) => {
    currentProfile.dishRatings[dishName] = rating;

    // Track order frequency
    currentProfile.orderedDishNames[dishName] = (currentProfile.orderedDishNames[dishName] || 0) + 1;
  });

  // If itemRatings was empty, record from orderItems
  if (Object.keys(itemRatings).length === 0 && orderItems.length > 0) {
    orderItems.forEach(item => {
      const name = item.name;
      if (name) {
        currentProfile.dishRatings[name] = overallRating;
        currentProfile.orderedDishNames[name] = (currentProfile.orderedDishNames[name] || 0) + 1;
      }
    });
  }

  // 2. Incorporate explicit taste signals from tags
  if (selectedTags.includes('😋 Taste') && !currentProfile.preferences.includes('indian')) {
    currentProfile.preferences.push('indian');
  }
  if (selectedTags.includes('Too spicy')) {
    // Remove spicy if diner disliked excessive spice
    currentProfile.preferences = currentProfile.preferences.filter(p => p !== 'spicy');
  }

  currentProfile.isNewUser = false;
  saveCustomerProfile(currentProfile);
  return currentProfile;
}
