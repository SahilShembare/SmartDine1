// Smart AI Chef Dish Recommendation & Pairing Engine

const PAIRING_RULES = [
  {
    triggers: ['chicken', 'butter chicken', 'murg', 'kadhai chicken', 'tikka masala'],
    recommendCategory: 'breads',
    recommendItemNames: ['Garlic Naan', 'Butter Naan', 'Tandoori Roti', 'Jeera Rice'],
    reason: 'Chef Tip: Rich gravies pair exquisitely with warm Garlic Butter Naan!'
  },
  {
    triggers: ['paneer', 'paneer butter masala', 'shahi paneer', 'kadhai paneer', 'dal makhani'],
    recommendCategory: 'breads',
    recommendItemNames: ['Garlic Naan', 'Butter Roti', 'Jeera Rice', 'Mango Lassi'],
    reason: 'Chef Tip: Creamy paneer & dal taste magical with tandoor baked naans!'
  },
  {
    triggers: ['biryani', 'pulao', 'dum biryani', 'rice'],
    recommendCategory: 'desserts',
    recommendItemNames: ['Gulab Jamun', 'Royal Shahi Tukda', 'Raita', 'Cold Drink'],
    reason: 'Chef Tip: Complete your aromatic Dum Biryani with a sweet hot Gulab Jamun!'
  },
  {
    triggers: ['tikka', 'kebab', 'starter', 'crispy', 'tandoori', 'manchurian'],
    recommendCategory: 'beverages',
    recommendItemNames: ['Mango Lassi', 'Cold Drink', 'Butter Naan', 'Mint Mojito'],
    reason: 'Chef Tip: Sizzling starters go best with a chilled refreshing beverage!'
  },
  {
    triggers: ['naan', 'roti', 'paratha'],
    recommendCategory: 'curries',
    recommendItemNames: ['Butter Chicken Special', 'Paneer Butter Masala', 'Dal Makhani Bukhara'],
    reason: 'Chef Tip: Pick our bestselling signature curry for your freshly baked breads!'
  }
];

export function getAiRecommendation(addedItem, allMenuItems = [], currentCart = []) {
  if (!addedItem) return null;
  const itemNameLower = (addedItem.name || '').toLowerCase();
  const cartIds = new Set(currentCart.map(c => c.id));

  // Find best matching rule
  const matchedRule = PAIRING_RULES.find(rule => 
    rule.triggers.some(t => itemNameLower.includes(t))
  );

  let candidate = null;
  let reason = 'Chef Recommended Pairing for your selection';

  if (matchedRule) {
    reason = matchedRule.reason;
    // Look for matching dish in menu that is NOT already in cart
    candidate = allMenuItems.find(item => 
      !cartIds.has(item.id) &&
      matchedRule.recommendItemNames.some(rec => item.name.toLowerCase().includes(rec.toLowerCase()))
    );
  }

  // Fallback to any popular dish not in cart
  if (!candidate) {
    candidate = allMenuItems.find(item => !cartIds.has(item.id) && item.popular && item.id !== addedItem.id);
  }

  // Final fallback to any dish
  if (!candidate && allMenuItems.length > 0) {
    candidate = allMenuItems.find(item => item.id !== addedItem.id);
  }

  if (!candidate) return null;

  return {
    dish: candidate,
    reason: reason,
    aiBadge: '🤖 AI Chef Pairing'
  };
}
