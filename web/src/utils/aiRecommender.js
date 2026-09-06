// Smart AI Dish Similarity & Same-Dish Pairing Engine
// Recommends companion dishes based directly on the customer's selected dish

const PAIRING_RULES = [
  {
    triggers: ['chicken', 'butter chicken', 'murg', 'kadhai chicken', 'tikka masala'],
    recommendCategory: 'breads',
    recommendItemNames: ['Garlic Naan', 'Butter Naan', 'Tandoori Roti', 'Jeera Rice'],
    reasonGenerator: (dishName) => `Pairs naturally with your ${dishName} gravy!`
  },
  {
    triggers: ['paneer', 'paneer butter masala', 'shahi paneer', 'kadhai paneer', 'dal makhani'],
    recommendCategory: 'breads',
    recommendItemNames: ['Garlic Naan', 'Butter Roti', 'Jeera Rice', 'Mango Lassi'],
    reasonGenerator: (dishName) => `Ideal staple accompaniment for your ${dishName}!`
  },
  {
    triggers: ['biryani', 'pulao', 'dum biryani', 'rice'],
    recommendCategory: 'desserts',
    recommendItemNames: ['Gulab Jamun', 'Royal Shahi Tukda', 'Raita', 'Cold Drink'],
    reasonGenerator: (dishName) => `Sweet indulgence to complete your ${dishName}!`
  },
  {
    triggers: ['tikka', 'kebab', 'starter', 'crispy', 'tandoori', 'manchurian'],
    recommendCategory: 'beverages',
    recommendItemNames: ['Mango Lassi', 'Cold Drink', 'Butter Naan', 'Mint Mojito'],
    reasonGenerator: (dishName) => `Refreshing beverage to accompany your ${dishName}!`
  },
  {
    triggers: ['naan', 'roti', 'paratha'],
    recommendCategory: 'curries',
    recommendItemNames: ['Butter Chicken Special', 'Paneer Butter Masala', 'Dal Makhani Bukhara'],
    reasonGenerator: (dishName) => `Signature rich gravy to enjoy with your freshly baked breads!`
  },
  {
    triggers: ['pizza', 'burger', 'sandwich'],
    recommendCategory: 'beverages',
    recommendItemNames: ['Cold Coffee', 'French Fries', 'Mint Mojito', 'Garlic Bread'],
    reasonGenerator: (dishName) => `Popular side & beverage match for your ${dishName}!`
  }
];

export function getAiRecommendation(addedItem, allMenuItems = [], currentCart = []) {
  if (!addedItem) return null;
  const itemNameLower = (addedItem.name || '').toLowerCase();
  const itemCategoryLower = (addedItem.category || '').toLowerCase();
  const cartIds = new Set(currentCart.map(c => c.id));

  // 1. Check for specific dish pairing rule
  const matchedRule = PAIRING_RULES.find(rule => 
    rule.triggers.some(t => itemNameLower.includes(t))
  );

  let candidate = null;
  let reason = `Recommended to match your ${addedItem.name}`;

  if (matchedRule) {
    reason = matchedRule.reasonGenerator(addedItem.name);
    // Look for matching dish in menu that is NOT already in cart
    candidate = allMenuItems.find(item => 
      !cartIds.has(item.id) &&
      matchedRule.recommendItemNames.some(rec => item.name.toLowerCase().includes(rec.toLowerCase()))
    );
  }

  // 2. Same-Dish / Same-Category Alternative (if not already paired)
  if (!candidate) {
    candidate = allMenuItems.find(item => 
      !cartIds.has(item.id) && 
      item.id !== addedItem.id &&
      (item.category || '').toLowerCase() === itemCategoryLower
    );
    if (candidate) {
      reason = `Similar delicacy from the same ${addedItem.category || 'dish'} category`;
    }
  }

  // 3. Same Core Ingredient Matching (e.g. paneer with paneer, chicken with chicken)
  if (!candidate) {
    const keywords = ['paneer', 'chicken', 'cheese', 'mushroom', 'tikka', 'biryani', 'masala', 'dal'];
    const matchedKw = keywords.find(kw => itemNameLower.includes(kw));
    if (matchedKw) {
      candidate = allMenuItems.find(item => 
        !cartIds.has(item.id) && 
        item.id !== addedItem.id &&
        item.name.toLowerCase().includes(matchedKw)
      );
      if (candidate) {
        reason = `Made with similar ingredients to your ${addedItem.name}`;
      }
    }
  }

  // 4. Fallback to any top-rated dish not in cart
  if (!candidate) {
    candidate = allMenuItems.find(item => !cartIds.has(item.id) && item.popular && item.id !== addedItem.id);
  }

  // 5. Final fallback to any dish not in cart
  if (!candidate && allMenuItems.length > 0) {
    candidate = allMenuItems.find(item => !cartIds.has(item.id) && item.id !== addedItem.id);
  }

  if (!candidate) return null;

  return {
    dish: candidate,
    reason: reason,
    aiBadge: '🎯 Similar Dish Pairing'
  };
}
