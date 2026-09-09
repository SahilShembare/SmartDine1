/**
 * SmartDine AI Intelligence Engine
 * 
 * Modular services for restaurant analytics, predictions, explainability,
 * and conversational Q&A based on realistic restaurant operational data.
 */

// ============================================================================
// 1. Sales Forecast Service
// ============================================================================
export const SalesForecastService = {
  getSummary: () => ({
    todayPredicted: { min: 24500, max: 27200, currentActual: 25450, confidence: 91 },
    tomorrowPredicted: { min: 28000, max: 31000, expectedOrders: '145–160', confidence: 89 },
    next7DaysRevenue: 204500,
    next30DaysRevenue: 890000,
    confidenceAvg: 89,
    busiestHours: '7:00 PM – 9:30 PM',
    dinnerRevenueGrowth: '+23%',
    weekendSpikeExpected: '+35%'
  }),

  getChartData: (filter = '7d') => {
    switch (filter) {
      case '30d':
        return [
          { label: 'Wk 1', actual: 185000, predicted: 180000, confidence: 92 },
          { label: 'Wk 2', actual: 198000, predicted: 194000, confidence: 90 },
          { label: 'Wk 3', actual: 215000, predicted: 210000, confidence: 88 },
          { label: 'Wk 4 (Current)', actual: 204500, predicted: 208000, confidence: 89 },
        ];
      case '3m':
        return [
          { label: 'June', actual: 780000, predicted: 760000, confidence: 94 },
          { label: 'July', actual: 825000, predicted: 810000, confidence: 91 },
          { label: 'August', actual: 890000, predicted: 885000, confidence: 89 },
        ];
      case '6m':
        return [
          { label: 'Mar', actual: 690000, predicted: 700000, confidence: 93 },
          { label: 'Apr', actual: 740000, predicted: 730000, confidence: 92 },
          { label: 'May', actual: 760000, predicted: 755000, confidence: 91 },
          { label: 'Jun', actual: 780000, predicted: 760000, confidence: 94 },
          { label: 'Jul', actual: 825000, predicted: 810000, confidence: 91 },
          { label: 'Aug', actual: 890000, predicted: 885000, confidence: 89 },
        ];
      case '7d':
      default:
        return [
          { label: 'Mon', actual: 21200, predicted: 20500, confidence: 92 },
          { label: 'Tue', actual: 22400, predicted: 22000, confidence: 90 },
          { label: 'Wed', actual: 23100, predicted: 23500, confidence: 88 },
          { label: 'Thu', actual: 24800, predicted: 24200, confidence: 91 },
          { label: 'Fri', actual: 31200, predicted: 30500, confidence: 94 },
          { label: 'Sat', actual: 36800, predicted: 35900, confidence: 93 },
          { label: 'Sun (Today)', actual: 25450, predicted: 26500, confidence: 89 },
          { label: 'Mon (Tomorrow)', actual: null, predicted: 29500, confidence: 89 }
        ];
    }
  }
};

// ============================================================================
// 2. Demand Prediction Service
// ============================================================================
export const DemandPredictionService = {
  getItems: (timeframe = 'today') => {
    const baseItems = [
      {
        id: 'dp-1',
        name: 'Paneer Pizza',
        category: 'Pizza',
        todayOrders: 42,
        predictedOrders: 58,
        demand: 'High',
        demandType: 'high', // 'high' | 'increasing' | 'stable' | 'decreasing'
        trend: '+28%',
        confidence: 93,
        primaryTime: 'Dinner (8:00 PM)',
        explainReason: 'High customer ratings (4.8⭐) + Friday/Saturday dinner surge + repeat orders.'
      },
      {
        id: 'dp-2',
        name: 'Butter Chicken',
        category: 'Main Course',
        todayOrders: 36,
        predictedOrders: 48,
        demand: 'Increasing',
        demandType: 'increasing',
        trend: '+19%',
        confidence: 91,
        primaryTime: 'Dinner (8:30 PM)',
        explainReason: 'Consistent 15% week-on-week demand growth with Garlic Naan combos.'
      },
      {
        id: 'dp-3',
        name: 'Dal Makhani',
        category: 'Main Course',
        todayOrders: 31,
        predictedOrders: 33,
        demand: 'Stable',
        demandType: 'stable',
        trend: '+4%',
        confidence: 95,
        primaryTime: 'Lunch & Dinner',
        explainReason: 'Steady staple demand across both lunch and dinner services.'
      },
      {
        id: 'dp-4',
        name: 'Garlic Naan',
        category: 'Breads',
        todayOrders: 68,
        predictedOrders: 86,
        demand: 'High',
        demandType: 'high',
        trend: '+26%',
        confidence: 94,
        primaryTime: 'Dinner',
        explainReason: 'Strong cross-sell attachment rate (78%) with gravies and curries.'
      },
      {
        id: 'dp-5',
        name: 'Cold Coffee with Ice Cream',
        category: 'Beverages',
        todayOrders: 28,
        predictedOrders: 38,
        demand: 'Increasing',
        demandType: 'increasing',
        trend: '+22%',
        confidence: 88,
        primaryTime: 'Afternoon & Evening',
        explainReason: 'Warm weather forecast + high popularity in companion orders with pizzas.'
      },
      {
        id: 'dp-6',
        name: 'Veg Hakka Noodles',
        category: 'Chinese',
        todayOrders: 22,
        predictedOrders: 18,
        demand: 'Decreasing',
        demandType: 'decreasing',
        trend: '-14%',
        confidence: 86,
        primaryTime: 'Lunch',
        explainReason: 'Slight seasonal shift towards warm soups and sizzlers in evening hours.'
      },
      {
        id: 'dp-7',
        name: 'Chicken Dum Biryani',
        category: 'Biryani',
        todayOrders: 44,
        predictedOrders: 54,
        demand: 'High',
        demandType: 'high',
        trend: '+21%',
        confidence: 92,
        primaryTime: 'Dinner (7:30 PM)',
        explainReason: 'High weekend dining intent + weekend family portions.'
      }
    ];

    if (timeframe === 'tomorrow') {
      return baseItems.map(item => ({
        ...item,
        predictedOrders: Math.round(item.predictedOrders * 1.15)
      }));
    } else if (timeframe === 'week') {
      return baseItems.map(item => ({
        ...item,
        predictedOrders: Math.round(item.predictedOrders * 6.8),
        todayOrders: Math.round(item.todayOrders * 6.2)
      }));
    }
    return baseItems;
  }
};

// ============================================================================
// 3. Inventory Intelligence Service
// ============================================================================
export const InventoryPredictionService = {
  getAlerts: () => [
    {
      id: 'inv-1',
      ingredient: 'Paneer (Fresh Cottage Cheese)',
      currentStock: '5.2 kg',
      predictedConsumption: '7.8 kg',
      stockStatus: 'critical',
      expectedStockOut: 'Tomorrow, 8:00 PM',
      recommendedPurchase: '8.0 kg',
      confidence: 92,
      impact: 'Paneer Pizza, Paneer Tikka, Shahi Paneer may face 45% outage during peak dinner.',
      reason: 'Predicted orders for Paneer Pizza (+28%) exceed current safe buffer stock.'
    },
    {
      id: 'inv-2',
      ingredient: 'Cooking Cream / Amul Cream',
      currentStock: '3.4 L',
      predictedConsumption: '5.2 L',
      stockStatus: 'warning',
      expectedStockOut: 'Day after tomorrow, 1:00 PM',
      recommendedPurchase: '6.0 L',
      confidence: 88,
      impact: 'Butter Chicken and Dal Makhani gravies require fresh cream replenishment.',
      reason: 'High butter chicken dinner demand projected over the next 48 hours.'
    },
    {
      id: 'inv-3',
      ingredient: 'Basmati Rice (Special Blend)',
      currentStock: '14.0 kg',
      predictedConsumption: '18.5 kg',
      stockStatus: 'warning',
      expectedStockOut: 'Wednesday, 2:00 PM',
      recommendedPurchase: '25.0 kg',
      confidence: 94,
      impact: 'Chicken Dum Biryani and Veg Pulao consumption running 18% higher.',
      reason: 'Mid-week bulk banqueting orders detected on Table 8 and Table 12.'
    },
    {
      id: 'inv-4',
      ingredient: 'Fresh Mozzarella Cheese',
      currentStock: '2.8 kg',
      predictedConsumption: '4.5 kg',
      stockStatus: 'critical',
      expectedStockOut: 'Tomorrow, 9:30 PM',
      recommendedPurchase: '5.0 kg',
      confidence: 91,
      impact: 'Pizza topping reserves will be depleted before dinner closing.',
      reason: 'Weekend pizza promotions have increased cheese consumption by 2.1x.'
    }
  ],

  getOverviewStats: () => ({
    totalTracked: 48,
    criticalStockouts: 2,
    warningStockouts: 4,
    healthScore: 84,
    estimatedSavingsFromAI: '₹14,200/mo',
    wasteReductionRate: '19.4%'
  })
};

// ============================================================================
// 4. AI Business Insights
// ============================================================================
export const BusinessInsightsService = {
  getInsights: () => [
    {
      id: 'ins-1',
      icon: '💡',
      title: 'Dinner Revenue Surge',
      shortExplanation: 'Dinner orders increased by 23% this week, generating 62% of total daily revenue.',
      impact: 'High',
      impactColor: 'text-rose-600 bg-rose-50 border-rose-200',
      recommendedAction: 'Allocate 2 extra floor servers and pre-prep signature gravies between 5:30 PM and 7:00 PM.',
      confidence: 94
    },
    {
      id: 'ins-2',
      icon: '💡',
      title: 'Peak Weekend Timing',
      shortExplanation: 'Friday and Saturday generate 44% of weekly revenue with peak orders between 7:30 PM and 9:45 PM.',
      impact: 'High',
      impactColor: 'text-rose-600 bg-rose-50 border-rose-200',
      recommendedAction: 'Enable fast-track table billing and encourage digital QR settlement to shorten turnover time.',
      confidence: 96
    },
    {
      id: 'ins-3',
      icon: '💡',
      title: 'Best-Selling Hero Dish',
      shortExplanation: 'Paneer Pizza is your #1 best-selling dish with 4.8⭐ average rating and 32% repeat orders.',
      impact: 'High',
      impactColor: 'text-rose-600 bg-rose-50 border-rose-200',
      recommendedAction: 'Feature Paneer Pizza as chef special on digital web menu header during evening hours.',
      confidence: 92
    },
    {
      id: 'ins-4',
      icon: '⚠️',
      title: 'Order Cancellation Rate Spike',
      shortExplanation: 'Cancellation rate increased by 8% during peak rush hours (8:30 PM – 9:15 PM) due to kitchen wait times.',
      impact: 'Medium',
      impactColor: 'text-amber-600 bg-amber-50 border-amber-200',
      recommendedAction: 'Improve kitchen order queue batching and notify customers of 20-min wait times during rush to set expectations.',
      confidence: 87
    },
    {
      id: 'ins-5',
      icon: '📈',
      title: 'Customer Retention Improvement',
      shortExplanation: 'Customer retention improved by 12% following the launch of the smart table QR digital loyalty program.',
      impact: 'Medium',
      impactColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      recommendedAction: 'Launch a personalized dessert discount for returning diners on their 3rd visit.',
      confidence: 90
    }
  ]
};

// ============================================================================
// 5. Menu Optimization Service
// ============================================================================
export const MenuOptimizationService = {
  getItems: () => [
    {
      id: 'menu-opt-1',
      name: 'Paneer Pizza',
      classification: '🏆 Best Performer',
      classType: 'best',
      salesVolume: 'High (380/mo)',
      revenue: '₹1,32,600',
      profitMargin: '68%',
      rating: 4.8,
      recommendation: 'Promote this item aggressively during dinner hours with high-margin pairings.',
      suggestedCombo: 'Paneer Pizza + Cold Coffee Combo (₹480)',
      confidence: 95,
      why: 'Top revenue generator + stellar 4.8 rating + 74% customer recommendation rate.'
    },
    {
      id: 'menu-opt-2',
      name: 'Butter Chicken & Garlic Naan',
      classification: '🔥 Promote',
      classType: 'promote',
      salesVolume: 'High (340/mo)',
      revenue: '₹1,56,400',
      profitMargin: '62%',
      rating: 4.7,
      recommendation: 'Bundle as "Chef Special Royal Platter" to increase Average Order Value by 18%.',
      suggestedCombo: 'Royal Butter Chicken + 2 Butter Garlic Naan (₹520)',
      confidence: 93,
      why: 'High order frequency with 81% cross-sell affinity to garlic naan.'
    },
    {
      id: 'menu-opt-3',
      name: 'Cold Coffee with Ice Cream',
      classification: '📈 Growing',
      classType: 'growing',
      salesVolume: 'Medium (240/mo)',
      revenue: '₹40,800',
      profitMargin: '76%',
      rating: 4.6,
      recommendation: 'Upsell as dessert companion during checkout to boost beverage margin.',
      suggestedCombo: 'Cold Coffee + Sizzling Brownie Combo (₹280)',
      confidence: 90,
      why: 'Fastest 30-day velocity growth (+22%) with lowest kitchen prep time (3 mins).'
    },
    {
      id: 'menu-opt-4',
      name: 'Dal Makhani',
      classification: '➡️ Stable',
      classType: 'stable',
      salesVolume: 'Medium (290/mo)',
      revenue: '₹75,400',
      profitMargin: '65%',
      rating: 4.5,
      recommendation: 'Maintain price point and use as standard vegetarian recommendation for new guests.',
      suggestedCombo: 'Dal Makhani + Jeera Rice Lunch Box (₹340)',
      confidence: 94,
      why: 'Low variance in monthly orders, solid customer retention pillar.'
    },
    {
      id: 'menu-opt-5',
      name: 'Mushroom Corn Quesadilla',
      classification: '⚠️ Low Performer',
      classType: 'low',
      salesVolume: 'Low (42/mo)',
      revenue: '₹12,600',
      profitMargin: '48%',
      rating: 3.9,
      recommendation: 'Revamp recipe or replace with Stuffed Garlic Bread to reduce raw inventory holding costs.',
      suggestedCombo: 'Replace or discount during Happy Hours 4 PM–6 PM (₹199)',
      confidence: 86,
      why: 'High ingredient spoilage rate (mushrooms) and below-average customer satisfaction.'
    }
  ]
};

// ============================================================================
// 6. Customer Insights Service
// ============================================================================
export const CustomerInsightsService = {
  getSegments: () => [
    {
      id: 'seg-1',
      title: 'Regular Customers',
      badge: 'Core Loyalists',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      count: '1,245',
      percentage: '42%',
      averageOrderValue: '₹485',
      visitFrequency: '2.6 visits / month',
      favoriteDishes: ['Paneer Pizza', 'Cold Coffee', 'Garlic Naan'],
      recommendedAction: 'Create automated loyalty tier offers (e.g. Free beverage on 4th visit).',
      potentialRevenueLift: '+₹42,000/mo',
      confidence: 93
    },
    {
      id: 'seg-2',
      title: 'High-Value Customers',
      badge: 'VIP Diners',
      badgeColor: 'bg-purple-100 text-purple-800',
      count: '318',
      percentage: '11%',
      averageOrderValue: '₹1,240',
      visitFrequency: '3.1 visits / month',
      favoriteDishes: ['Butter Chicken Platter', 'Dum Biryani', 'Sizzlers'],
      recommendedAction: 'Assign priority reservation slots, complimentary chef welcome dessert, and dedicated servers.',
      potentialRevenueLift: '+₹65,000/mo',
      confidence: 91
    },
    {
      id: 'seg-3',
      title: 'New Customers',
      badge: 'Acquisition',
      badgeColor: 'bg-blue-100 text-blue-800',
      count: '890',
      percentage: '30%',
      averageOrderValue: '₹390',
      visitFrequency: 'First visit this month',
      favoriteDishes: ['Veg Hakka Noodles', 'Paneer Tikka', 'Mocktails'],
      recommendedAction: 'Send a 15% return voucher valid within 14 days to convert first-timers to second-visit regulars.',
      potentialRevenueLift: '+₹28,500/mo',
      confidence: 89
    },
    {
      id: 'seg-4',
      title: 'Inactive Customers',
      badge: 'At Risk',
      badgeColor: 'bg-rose-100 text-rose-800',
      count: '512',
      percentage: '17%',
      averageOrderValue: '₹420',
      visitFrequency: 'No visit in 45+ days',
      favoriteDishes: ['Dal Makhani', 'Biryani'],
      recommendedAction: 'Trigger "We miss you" WhatsApp discount SMS with personalized favorite dish promo.',
      potentialRevenueLift: '+₹21,000/mo',
      confidence: 87
    }
  ]
};

// ============================================================================
// 7. Review Sentiment Intelligence Service
// ============================================================================
export const ReviewSentimentService = {
  getSummary: () => ({
    overallSentiment: 'Positive',
    positivePercentage: 72,
    neutralPercentage: 18,
    negativePercentage: 10,
    totalReviewsAnalyzed: 1420,
    averageRating: 4.4,
    mostPraised: 'Food Taste & Fresh Ingredients',
    mostCommonComplaint: 'Waiting Time during 8 PM Rush',
    recommendation: 'Reduce average dinner preparation time by improving kitchen order prioritization and pre-batching curries.'
  }),

  getTopics: () => [
    { name: 'Food Quality', score: 92, sentiment: 'Positive', mentionCount: 680 },
    { name: 'Taste & Flavor', score: 95, sentiment: 'Positive', mentionCount: 840 },
    { name: 'Service & Staff', score: 78, sentiment: 'Positive', mentionCount: 420 },
    { name: 'Value & Pricing', score: 81, sentiment: 'Positive', mentionCount: 390 },
    { name: 'Cleanliness & Ambiance', score: 89, sentiment: 'Positive', mentionCount: 510 },
    { name: 'Waiting Time & Kitchen Delay', score: 48, sentiment: 'Negative', mentionCount: 215 }
  ],

  getRecentReviews: () => [
    {
      id: 'rev-1',
      customer: 'Rahul Verma',
      rating: 5,
      sentiment: 'Positive',
      sentimentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      comment: 'Best Paneer Pizza in town! The crust was hot and crispy. Cold coffee was also spot on.',
      date: 'Today, 2:15 PM',
      extractedTopics: ['Taste & Flavor', 'Food Quality']
    },
    {
      id: 'rev-2',
      customer: 'Priya Sharma',
      rating: 3,
      sentiment: 'Neutral',
      sentimentColor: 'text-amber-700 bg-amber-50 border-amber-200',
      comment: 'Food was delicious especially Butter Chicken, but had to wait 28 minutes for food on Sunday night.',
      date: 'Yesterday, 9:20 PM',
      extractedTopics: ['Waiting Time', 'Taste & Flavor']
    },
    {
      id: 'rev-3',
      customer: 'Amit Deshmukh',
      rating: 5,
      sentiment: 'Positive',
      sentimentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      comment: 'Quick QR ordering from table was super smooth. Dal Makhani had an authentic creamy texture.',
      date: 'Yesterday, 8:45 PM',
      extractedTopics: ['Service & Staff', 'Food Quality']
    },
    {
      id: 'rev-4',
      customer: 'Neha Kapoor',
      rating: 2,
      sentiment: 'Negative',
      sentimentColor: 'text-rose-700 bg-rose-50 border-rose-200',
      comment: 'Garlic naan was slightly cold by the time it reached Table 14. Server apologized promptly though.',
      date: '2 days ago',
      extractedTopics: ['Food Quality', 'Service & Staff']
    }
  ]
};

// ============================================================================
// 8. Anomaly Detection Service
// ============================================================================
export const AnomalyDetectionService = {
  getAlerts: () => [
    {
      id: 'anom-1',
      type: 'Revenue Anomaly Detected',
      severity: 'high',
      metric: 'Revenue Deviation',
      title: '🚨 Revenue Anomaly Detected',
      description: "Today's revenue is 21% lower than the normal Monday average (₹18,400 actual vs. ₹23,300 benchmark).",
      timestamp: 'Today, 3:30 PM',
      rootCause: 'Heavy monsoon showers + road construction near West Gate caused 34% drop in dine-in footfall.',
      impactAssessment: 'Shortfall of approx. ₹4,900 in lunch revenue; dinner pre-bookings remain normal.',
      recommendedAction: 'Trigger a flash 15% "Rainy Day Dine-In Comfort Promo" via customer SMS/WhatsApp to boost evening occupancy.',
      confidence: 91
    },
    {
      id: 'anom-2',
      type: 'Cancellation Rate Spike',
      severity: 'medium',
      metric: 'Order Cancellations',
      title: '⚠️ Unusual Cancellation Rate',
      description: 'Order cancellations peaked to 7.4% between 1:15 PM and 2:00 PM (benchmark is 1.8%).',
      timestamp: 'Today, 2:15 PM',
      rootCause: 'Kitchen prep station 2 experienced delayed gas burner heating, resulting in wait times exceeding 30 minutes.',
      impactAssessment: '6 cancelled orders amounting to ₹2,850 lost gross value.',
      recommendedAction: 'Kitchen station backup burner checked and re-lit; alert kitchen lead during lunch surge.',
      confidence: 89
    },
    {
      id: 'anom-3',
      type: 'Demand Surge Alert',
      severity: 'info',
      metric: 'Item Velocity Spike',
      title: '📈 Unexpected Surge: Cold Coffee',
      description: 'Cold Coffee orders exceeded average velocity by +64% over the last 3 hours.',
      timestamp: 'Today, 4:45 PM',
      rootCause: 'College student group of 24 visited after semester exam completion.',
      impactAssessment: 'Milk and ice cream inventory depleted 2.4x faster than usual.',
      recommendedAction: 'Restock dairy supplies before 7:00 PM dinner shift.',
      confidence: 94
    }
  ]
};

// ============================================================================
// 9. AI Recommendation Engine (with Explainability)
// ============================================================================
export const RecommendationEngine = {
  getRecommendations: () => [
    {
      id: 'rec-1',
      title: 'Promote Paneer Pizza during Dinner Hours',
      category: 'Menu & Revenue',
      confidence: 94,
      priority: 'High',
      shortDescription: 'Feature Paneer Pizza on the customer QR digital menu banner from 7 PM to 10 PM.',
      expectedOutcome: 'Expected +18% increase in pizza orders, generating an additional ₹14,000–₹18,000 this week.',
      why: [
        '32% increase in orders over the last 14 days',
        '4.8 average customer rating across 380 reviews',
        'High dinner demand concentration (74% ordered after 7 PM)',
        'Strong repeat-customer purchase rate (1.8x repeat frequency)'
      ],
      applied: false
    },
    {
      id: 'rec-2',
      title: 'Increase Evening Floor Staff on Weekends',
      category: 'Operations & Staffing',
      confidence: 91,
      priority: 'High',
      shortDescription: 'Schedule 2 additional table attendants between 7:00 PM and 9:45 PM on Friday and Saturday.',
      expectedOutcome: 'Cut table turnaround time by 6 minutes and reduce customer wait complaints by 40%.',
      why: [
        'Orders between 7 PM–9 PM increased by 27% week-on-week',
        'Peak table occupancy hits 92% on Friday & Saturday nights',
        'Review analysis highlights "waiting time" as the only recurring negative theme',
        'Current server-to-table ratio during peak is 1:6 (recommended optimal is 1:4)'
      ],
      applied: false
    },
    {
      id: 'rec-3',
      title: 'Restock Paneer & Mozzarella Inventory Today',
      category: 'Inventory Intelligence',
      confidence: 92,
      priority: 'High',
      shortDescription: 'Place a purchase order of 8 kg fresh paneer and 5 kg mozzarella cheese before 6:00 PM.',
      expectedOutcome: 'Prevent stock-out during tomorrow evening peak service, protecting ~₹16,000 in orders.',
      why: [
        'Current paneer stock is 5.2 kg vs. projected consumption of 7.8 kg',
        'Expected stock-out timestamp is tomorrow at 8:00 PM',
        'Paneer is the core ingredient in your top 3 selling vegetarian dishes',
        'Supplier delivery lead time is 4 hours'
      ],
      applied: false
    },
    {
      id: 'rec-4',
      title: 'Launch "Paneer Pizza + Cold Coffee" Combo Discount',
      category: 'Upselling & Basket Size',
      confidence: 88,
      priority: 'Medium',
      shortDescription: 'Introduce a bundled digital coupon at ₹480 (individual total ₹540, saving 11%).',
      expectedOutcome: 'Increase beverage attachment to pizza orders from 38% to 58%, lifting AOV by ₹95.',
      why: [
        '46% of customers who order Paneer Pizza browse beverages but abandon the cart',
        'Cold Coffee has a high 76% gross profit margin',
        'Competitor benchmarking shows combo promotions drive +22% conversion'
      ],
      applied: false
    }
  ]
};

// ============================================================================
// 10. Natural Language AI Assistant Service ("Ask SmartDine AI")
// ============================================================================
export const AIAssistantService = {
  suggestedQuestions: [
    "How were today's sales?",
    "What is my best-selling food?",
    "Which items should I promote?",
    "What will tomorrow's sales be?",
    "Which ingredients need restocking?",
    "Why did sales decrease this week?",
    "Show me my busiest hours.",
    "Which customers are most valuable?",
    "Summarize this month's performance."
  ],

  answerQuestion: async (query) => {
    // Simulate brief AI processing delay
    await new Promise(r => setTimeout(r, 600));

    const q = (query || '').toLowerCase().trim();

    if (q.includes("today") && (q.includes("sale") || q.includes("revenue") || q.includes("how were"))) {
      return {
        text: "Today's revenue is ₹25,450 from 128 completed orders, which is 12.5% higher than yesterday. Paneer Pizza generated the highest sales (42 orders, ₹14,700). Your busiest period was 7:00 PM – 9:00 PM.",
        dataPoints: [
          { label: "Today's Revenue", value: "₹25,450" },
          { label: "Completed Orders", value: "128" },
          { label: "Growth vs Yesterday", value: "+12.5%" },
          { label: "Top Dish", value: "Paneer Pizza" }
        ],
        confidence: 94
      };
    }

    if (q.includes("best-selling") || q.includes("best selling") || q.includes("top food") || q.includes("popular")) {
      return {
        text: "Your best-selling dish is Paneer Pizza (380 monthly orders, ₹1,32,600 revenue, 4.8⭐ rating), followed closely by Butter Chicken & Garlic Naan combos (340 monthly orders, ₹1,56,400 revenue). Both items maintain high repeat order rates.",
        dataPoints: [
          { label: "#1 Best Seller", value: "Paneer Pizza (42 today / 380 mo)" },
          { label: "#2 Best Seller", value: "Butter Chicken (36 today / 340 mo)" },
          { label: "#3 Best Seller", value: "Garlic Naan (68 today)" }
        ],
        confidence: 96
      };
    }

    if (q.includes("promote") || q.includes("which items")) {
      return {
        text: "SmartDine AI recommends promoting: \n1. **Paneer Pizza + Cold Coffee Combo**: High margin (72%) with 46% natural affinity.\n2. **Royal Butter Chicken Platter**: Bundle with Garlic Naan to raise basket size from ₹390 to ₹520 during dinner.\n3. **Cold Coffee with Ice Cream**: Velocity is growing at +22% with 3-minute kitchen prep.",
        dataPoints: [
          { label: "Top Recommendation", value: "Paneer Pizza + Cold Coffee" },
          { label: "Recommended Time", value: "Dinner Hours (7 PM – 10 PM)" },
          { label: "Expected Basket Lift", value: "+18%" }
        ],
        confidence: 91
      };
    }

    if (q.includes("tomorrow") || (q.includes("sales") && q.includes("forecast"))) {
      return {
        text: "Tomorrow's sales are forecast between ₹28,000 and ₹31,000 with an expected volume of 145–160 orders. Confidence is 89%, supported by strong pre-dinner reservations and regular Tuesday dining patterns.",
        dataPoints: [
          { label: "Tomorrow's Forecast", value: "₹28,000 – ₹31,000" },
          { label: "Expected Orders", value: "145 – 160" },
          { label: "AI Confidence", value: "89%" }
        ],
        confidence: 89
      };
    }

    if (q.includes("restock") || q.includes("ingredient") || q.includes("inventory")) {
      return {
        text: "Critical stock alerts: \n⚠️ **Paneer**: Current stock 5.2 kg. Expected stock-out tomorrow at 8:00 PM. Recommended purchase: **8 kg**.\n⚠️ **Mozzarella Cheese**: Current stock 2.8 kg. Expected stock-out tomorrow at 9:30 PM. Recommended purchase: **5 kg**.\n⚠️ **Amul Fresh Cream**: Current stock 3.4 L. Recommended purchase: **6 L**.",
        dataPoints: [
          { label: "Critical Item 1", value: "Paneer (Restock 8 kg)" },
          { label: "Critical Item 2", value: "Mozzarella (Restock 5 kg)" },
          { label: "Stock-out Risk", value: "Tomorrow 8:00 PM" }
        ],
        confidence: 93
      };
    }

    if (q.includes("decrease") || q.includes("why did") || q.includes("lower") || q.includes("drop")) {
      return {
        text: "Sales experienced a 21% anomaly dip on Monday lunch due to heavy localized monsoon rain and West Gate road construction causing a 34% drop in footfall. However, dinner delivery and advance reservations compensated by +14% later in the evening.",
        dataPoints: [
          { label: "Anomaly Type", value: "Weather & Road Disruption" },
          { label: "Shortfall Impact", value: "₹4,900 lunch deficit" },
          { label: "Recovery Action", value: "Dinner Comfort Promo triggered" }
        ],
        confidence: 90
      };
    }

    if (q.includes("busiest") || q.includes("rush") || q.includes("peak") || q.includes("hours")) {
      return {
        text: "Your peak operational hours are **7:30 PM to 9:45 PM**, accounting for 64% of daily customer volume. The secondary peak is lunchtime between **1:00 PM and 2:15 PM** (22% volume).",
        dataPoints: [
          { label: "Primary Peak", value: "7:30 PM – 9:45 PM (64%)" },
          { label: "Secondary Peak", value: "1:00 PM – 2:15 PM (22%)" },
          { label: "Peak Occupancy", value: "88% – 94%" }
        ],
        confidence: 95
      };
    }

    if (q.includes("valuable") || q.includes("customer") || q.includes("segment") || q.includes("vip")) {
      return {
        text: "Your most valuable group is the **High-Value VIP Diners** (318 customers, ₹1,240 Average Order Value, 3.1 visits/month). They generate 31% of total restaurant profit despite representing only 11% of footfall.",
        dataPoints: [
          { label: "VIP Segment Size", value: "318 Customers" },
          { label: "VIP AOV", value: "₹1,240 (vs ₹485 regular)" },
          { label: "Recommendation", value: "VIP Welcome Dessert & Priority Seating" }
        ],
        confidence: 92
      };
    }

    if (q.includes("summarize") || q.includes("performance") || q.includes("month")) {
      return {
        text: "This month's performance summary: \n• Total Revenue: **₹8,90,000** (+14.2% MoM growth)\n• Total Completed Orders: **4,280**\n• Average Order Value: **₹485**\n• Customer Satisfaction: **4.4 / 5.0 ⭐** (72% positive sentiment)\n• Top Revenue Driver: **Paneer Pizza** and **Butter Chicken Platter**.",
        dataPoints: [
          { label: "Month Revenue", value: "₹8,90,000" },
          { label: "Total Orders", value: "4,280" },
          { label: "Overall Sentiment", value: "72% Positive" },
          { label: "MoM Growth", value: "+14.2%" }
        ],
        confidence: 95
      };
    }

    // Default intelligent fallback based on live context
    return {
      text: `SmartDine AI Intelligence Report for "${query}": Restaurant operations are healthy with ₹25,450 daily revenue across 128 orders. Key focus areas today are restocking 8 kg of Paneer before the 8:00 PM dinner rush and running the Paneer Pizza + Cold Coffee dinner combo.`,
      dataPoints: [
        { label: "Current Revenue", value: "₹25,450" },
        { label: "Dinner Growth", value: "+23%" },
        { label: "Stockout Alert", value: "Paneer (Tomorrow 8 PM)" }
      ],
      confidence: 88
    };
  }
};
