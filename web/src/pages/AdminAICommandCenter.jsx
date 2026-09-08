import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  IndianRupee,
  UtensilsCrossed,
  Layers,
  Users,
  MessageSquare,
  HelpCircle,
  Filter,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Info,
  Package,
  Activity,
  Award,
  Zap,
  ShoppingBag,
  SlidersHorizontal,
  ChevronLeft,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AskSmartDineAI from '../components/AskSmartDineAI';

import {
  SalesForecastService,
  DemandPredictionService,
  InventoryPredictionService,
  BusinessInsightsService,
  MenuOptimizationService,
  CustomerInsightsService,
  ReviewSentimentService,
  AnomalyDetectionService,
  RecommendationEngine
} from '../services/aiService';

export default function AdminAICommandCenter() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Active Navigation Tab
  // 'overview' | 'forecast' | 'demand' | 'inventory' | 'menu' | 'customers' | 'sentiment' | 'anomalies' | 'recommendations'
  const [activeTab, setActiveTab] = useState('overview');

  // Sales Forecast Chart Filter: '7d' | '30d' | '3m' | '6m'
  const [forecastFilter, setForecastFilter] = useState('7d');

  // Demand Prediction Timeframe Filter: 'today' | 'tomorrow' | 'week'
  const [demandFilter, setDemandFilter] = useState('today');

  // Selected Explainability Modal Data ("Why?" button)
  const [explainModal, setExplainModal] = useState(null);

  // Selected Anomaly Details Modal
  const [anomalyModal, setAnomalyModal] = useState(null);

  // Applied Recommendations Tracking
  const [appliedRecs, setAppliedRecs] = useState({});

  // Applied Menu Combo Recommendations
  const [appliedMenuRecs, setAppliedMenuRecs] = useState({});

  // Purchase Order Simulation
  const [purchaseOrders, setPurchaseOrders] = useState({});

  // Floating AI Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [drawerQuery, setDrawerQuery] = useState('');

  // Data Sources from AI Service
  const salesSummary = useMemo(() => SalesForecastService.getSummary(), []);
  const chartPoints = useMemo(() => SalesForecastService.getChartData(forecastFilter), [forecastFilter]);
  const demandItems = useMemo(() => DemandPredictionService.getItems(demandFilter), [demandFilter]);
  const inventoryAlerts = useMemo(() => InventoryPredictionService.getAlerts(), []);
  const inventoryStats = useMemo(() => InventoryPredictionService.getOverviewStats(), []);
  const businessInsights = useMemo(() => BusinessInsightsService.getInsights(), []);
  const menuOptimizations = useMemo(() => MenuOptimizationService.getItems(), []);
  const customerSegments = useMemo(() => CustomerInsightsService.getSegments(), []);
  const reviewSummary = useMemo(() => ReviewSentimentService.getSummary(), []);
  const reviewTopics = useMemo(() => ReviewSentimentService.getTopics(), []);
  const recentReviews = useMemo(() => ReviewSentimentService.getRecentReviews(), []);
  const anomalyAlerts = useMemo(() => AnomalyDetectionService.getAlerts(), []);
  const recommendations = useMemo(() => RecommendationEngine.getRecommendations(), []);

  // Handle Apply Recommendation
  const handleApplyRecommendation = (rec) => {
    setAppliedRecs(prev => ({ ...prev, [rec.id]: true }));
    toast.success(`Applied AI Recommendation: "${rec.title}"`, {
      icon: '✨',
      duration: 3500
    });
  };

  // Handle Apply Menu Combo
  const handleApplyMenuCombo = (item) => {
    setAppliedMenuRecs(prev => ({ ...prev, [item.id]: true }));
    toast.success(`Published Combo to Customer Menu: "${item.suggestedCombo}"`, {
      icon: '🍽️',
      duration: 3500
    });
  };

  // Handle Create Purchase Recommendation
  const handleCreatePurchase = (item) => {
    setPurchaseOrders(prev => ({ ...prev, [item.id]: true }));
    toast.success(`Generated Reorder PO for ${item.recommendedPurchase} of ${item.ingredient.split(' ')[0]}`, {
      icon: '📦',
      duration: 3500
    });
  };

  // Open Chat Assistant with pre-filled query
  const handleAskWithPrompt = (prompt) => {
    setDrawerQuery(prompt);
    setAiDrawerOpen(true);
  };

  // SVG Chart Maximum calculation
  const maxChartVal = useMemo(() => {
    let max = 0;
    chartPoints.forEach(p => {
      if (p.actual && p.actual > max) max = p.actual;
      if (p.predicted && p.predicted > max) max = p.predicted;
    });
    return max * 1.15;
  }, [chartPoints]);

  return (
    <div className="admin-dashboard-container min-h-screen text-slate-900 flex font-sans relative overflow-x-hidden">
      
      {/* Background Restaurant Image Layer */}
      <div 
        className="admin-dashboard-bg-layer"
        style={{
          backgroundImage: `url('${localStorage.getItem('smartdine_admin_bg') || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop&q=80'}')`
        }}
      />
      <div className="admin-dashboard-overlay" />

      {/* SaaS Admin Sidebar */}
      <Sidebar mode="admin" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        
        {/* Top Header Breadcrumb & Status */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 text-sm">
            <Link to="/admin" className="text-slate-500 hover:text-slate-800 font-medium">Admin</Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              <span>SmartDine AI Command Center</span>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#EA580C] border border-orange-200 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Live Telemetry Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDrawerQuery('');
                setAiDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#EA580C] text-white text-xs font-bold shadow-sm shadow-orange-500/20 hover:shadow-md transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Ask SmartDine AI</span>
            </button>
          </div>
        </header>

        {/* Page Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#020617] text-white px-4 sm:px-6 lg:px-8 py-7 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-400/30 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Intelligent Operations Suite
                </span>
                <span className="text-xs text-slate-400">• Confidence Baseline 91%</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Restaurant Intelligence & Forecasting
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Predictive order volume, automated inventory depletion warnings, menu profitability matrices, and explainable recommendations derived from historical restaurant traffic.
              </p>
            </div>

            {/* Quick KPI Snapshot in Hero */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="px-3 border-r border-white/10 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-300">Tomorrow's Forecast</p>
                <p className="text-base font-extrabold text-white mt-0.5">₹28K – ₹31K</p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> 89% Conf.
                </p>
              </div>
              <div className="px-3 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-300">Active Alert</p>
                <p className="text-base font-extrabold text-amber-300 mt-0.5">Paneer (Tomorrow)</p>
                <p className="text-[10px] text-slate-300 font-semibold">Restock 8 kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Command Center Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-20 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {[
              { id: 'overview', label: 'AI Overview', icon: Activity },
              { id: 'forecast', label: 'Sales Forecast', icon: TrendingUp },
              { id: 'demand', label: 'Demand Prediction', icon: Zap },
              { id: 'inventory', label: 'Inventory Intelligence', icon: Package, badge: '2 Critical' },
              { id: 'menu', label: 'Menu Optimization', icon: UtensilsCrossed },
              { id: 'customers', label: 'Customer Insights', icon: Users },
              { id: 'sentiment', label: 'Review Sentiment', icon: MessageSquare },
              { id: 'anomalies', label: 'Anomaly Alerts', icon: AlertTriangle, badge: '3 Alerts' },
              { id: 'recommendations', label: 'AI Recommendations', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#EA580C] text-white shadow-sm shadow-orange-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Tab Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* ============================================================ */}
          {/* TAB 1: AI OVERVIEW                                           */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Summary Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Sales Forecast Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Tomorrow's Forecast</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      89% Confidence
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black text-slate-900">₹28,000 – ₹31,000</span>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Expected Orders: 145–160</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Actual Today: ₹25,450</span>
                    <button
                      onClick={() => setActiveTab('forecast')}
                      className="font-bold text-[#EA580C] hover:underline flex items-center gap-0.5"
                    >
                      View Curve <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 2. Demand Velocity Alert */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Demand Prediction</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      🔥 High Demand
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black text-slate-900">Paneer Pizza</span>
                    <p className="text-xs text-emerald-600 mt-1 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> +28% surge tonight (58 orders)
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Butter Chicken: +19%</span>
                    <button
                      onClick={() => setActiveTab('demand')}
                      className="font-bold text-[#EA580C] hover:underline flex items-center gap-0.5"
                    >
                      Item Matrix <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 3. Inventory Stock-out Risk */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Stock-Out Warning</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      ⚠️ Critical
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black text-slate-900">Paneer Stock</span>
                    <p className="text-xs text-rose-600 mt-1 font-bold">
                      Depletes: Tomorrow 8:00 PM
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Order 8 kg to buffer</span>
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="font-bold text-[#EA580C] hover:underline flex items-center gap-0.5"
                    >
                      Restock Plan <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 4. Customer Sentiment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Review Intelligence</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      1,420 Reviews
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black text-slate-900">72% Positive</span>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      18% Neutral • 10% Negative
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Hero: Food Taste (95%)</span>
                    <button
                      onClick={() => setActiveTab('sentiment')}
                      className="font-bold text-[#EA580C] hover:underline flex items-center gap-0.5"
                    >
                      Sentiment Split <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Top Section: Quick Insights & Anomalies Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 7 Cols: Business Insights */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>🧠 SmartDine AI Business Insights</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Automated
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time operational correlations detected from order flow</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {businessInsights.slice(0, 4).map((ins) => (
                      <div key={ins.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="text-lg leading-none mt-0.5">{ins.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{ins.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${ins.impactColor}`}>
                                  {ins.impact} Impact
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.shortExplanation}</p>
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#EA580C] font-semibold">
                                <span>Action:</span>
                                <span className="text-slate-700 font-medium">{ins.recommendedAction}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {ins.confidence}% Conf.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 Cols: Top Recommendations with Explainability ("Why?") */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span>Actionable Recommendations</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Transparent explainable next steps</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('recommendations')}
                        className="text-xs font-bold text-[#EA580C] hover:underline"
                      >
                        View All (4)
                      </button>
                    </div>

                    <div className="space-y-3">
                      {recommendations.slice(0, 3).map((rec) => (
                        <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                              {rec.category}
                            </span>
                            <span className="font-semibold text-slate-400">{rec.confidence}% confidence</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.shortDescription}</p>
                          
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => setExplainModal(rec)}
                              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                            >
                              <HelpCircle className="w-3 h-3 text-orange-500" />
                              <span>Why this?</span>
                            </button>

                            <button
                              onClick={() => handleApplyRecommendation(rec)}
                              disabled={appliedRecs[rec.id]}
                              className={`text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                                appliedRecs[rec.id]
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-[#EA580C] text-white hover:bg-[#EA580C]'
                              }`}
                            >
                              {appliedRecs[rec.id] ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <span>Apply Action</span>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => handleAskWithPrompt("Summarize this month's performance.")}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>Ask AI: "Summarize this month's performance"</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SALES FORECASTING                                     */}
          {/* ============================================================ */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Forecast Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Today's Predicted Revenue</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹24,500 – ₹27,200</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Current Actual: ₹25,450</span>
                    <span className="text-emerald-600 font-bold">91% Conf.</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 shadow-sm">
                  <p className="text-xs text-orange-700 font-bold">Tomorrow's Forecast</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹28,000 – ₹31,000</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Orders: 145–160</span>
                    <span className="text-orange-600 font-bold">89% Conf.</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Next 7 Days Projected</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹2,04,500</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">+14.5% vs Prev Wk</span>
                    <span className="text-emerald-600 font-bold">92% Conf.</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Next 30 Days Projected</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹8,90,000</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Estimated 4,280 Orders</span>
                    <span className="text-emerald-600 font-bold">88% Conf.</span>
                  </div>
                </div>
              </div>

              {/* Main Interactive Chart: Actual Sales vs AI Predicted Sales */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Actual Sales vs AI Predicted Sales
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing verified register settlements against machine learning predictive curves
                    </p>
                  </div>

                  {/* Filters: 7 Days | 30 Days | 3 Months | 6 Months */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[
                      { id: '7d', label: '7 Days' },
                      { id: '30d', label: '30 Days' },
                      { id: '3m', label: '3 Months' },
                      { id: '6m', label: '6 Months' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setForecastFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          forecastFilter === f.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Chart Visualization */}
                <div className="h-64 sm:h-72 w-full pt-4">
                  <div className="relative h-full flex items-end justify-between gap-2 sm:gap-6 px-2 pb-6 border-b border-slate-200">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                      <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                      <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                      <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                      <div className="border-b border-dashed border-slate-200 w-full h-0"></div>
                    </div>

                    {chartPoints.map((pt, idx) => {
                      const actualHeightPct = pt.actual ? Math.min(100, Math.round((pt.actual / maxChartVal) * 100)) : 0;
                      const predHeightPct = Math.min(100, Math.round((pt.predicted / maxChartVal) * 100));

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                          {/* Tooltip Hover */}
                          <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl z-30 whitespace-nowrap">
                            <p className="font-bold">{pt.label}</p>
                            {pt.actual && <p className="text-emerald-400">Actual: ₹{pt.actual.toLocaleString()}</p>}
                            <p className="text-orange-300">Predicted: ₹{pt.predicted.toLocaleString()}</p>
                            <p className="text-slate-400 text-[9px]">Confidence: {pt.confidence}%</p>
                          </div>

                          {/* Bars Comparison */}
                          <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                            {/* Actual Bar (Solid Emerald) */}
                            {pt.actual !== null ? (
                              <div
                                style={{ height: `${actualHeightPct}%` }}
                                className="w-3 sm:w-6 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all duration-300"
                              />
                            ) : (
                              <div className="w-3 sm:w-6 border-2 border-dashed border-slate-300 rounded-t-md h-8 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                                TBD
                              </div>
                            )}

                            {/* Predicted Bar (Solid SmartDine Orange) */}
                            <div
                              style={{ height: `${predHeightPct}%` }}
                              className="w-3 sm:w-6 bg-gradient-to-t from-[#EA580C] to-orange-400 rounded-t-md hover:opacity-90 transition-all duration-300"
                            />
                          </div>

                          {/* Bottom Label */}
                          <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate w-full text-center">
                            {pt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart Legend & Telemetry Explanation */}
                <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                      <span className="font-semibold text-slate-700">Actual Realized Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-[#EA580C]"></span>
                      <span className="font-semibold text-slate-700">AI Predicted Sales</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Calculated with Exponential Smoothing & Seasonal Day-of-Week weighting</span>
                  </div>
                </div>
              </div>

              {/* Explainability & Confidence Note */}
              <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-orange-900">AI Confidence & Explainability Policy</h4>
                  <p className="text-xs text-orange-800 mt-0.5 leading-relaxed">
                    Predictions are strictly derived from historical restaurant POS datasets, table velocity patterns, day-of-week seasonality, and meteorological forecasts. They are statistical projections designed to assist kitchen preparation and ingredient procurement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: DEMAND PREDICTION                                     */}
          {/* ============================================================ */}
          {activeTab === 'demand' && (
            <div className="space-y-6">
              {/* Header with Filters: Today | Tomorrow | This Week */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Menu Item Demand Prediction</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Predicted order quantity for individual food items based on past consumption curves
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'tomorrow', label: 'Tomorrow' },
                    { id: 'week', label: 'This Week' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setDemandFilter(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        demandFilter === t.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demand Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Food Item</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-right">Today's Orders</th>
                        <th className="py-3.5 px-4 text-right">Predicted Orders</th>
                        <th className="py-3.5 px-4">Demand Level</th>
                        <th className="py-3.5 px-4">Trend</th>
                        <th className="py-3.5 px-4">Peak Window</th>
                        <th className="py-3.5 px-4 text-center">Explain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demandItems.map((item) => {
                        const getBadge = () => {
                          switch (item.demandType) {
                            case 'high':
                              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">🔥 High Demand</span>;
                            case 'increasing':
                              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">📈 Increasing</span>;
                            case 'stable':
                              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">➡️ Stable</span>;
                            case 'decreasing':
                              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">📉 Decreasing</span>;
                            default:
                              return null;
                          }
                        };

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                              {item.category}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                              {item.todayOrders}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-900">
                              {item.predictedOrders}
                            </td>
                            <td className="py-3.5 px-4">
                              {getBadge()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`font-bold ${
                                item.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {item.trend}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {item.primaryTime}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setExplainModal({
                                  title: `Demand Projection for ${item.name}`,
                                  confidence: item.confidence,
                                  why: [
                                    item.explainReason,
                                    `Current historical volume: ${item.todayOrders} units`,
                                    `Target forecasted volume: ${item.predictedOrders} units (${item.trend})`,
                                    `Optimal kitchen prep hour: ${item.primaryTime}`
                                  ]
                                })}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Why is this projected?"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: INVENTORY INTELLIGENCE                                */}
          {/* ============================================================ */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Inventory Health Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Tracked Raw Ingredients</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{inventoryStats.totalTracked} Items</p>
                  <p className="text-xs text-emerald-600 mt-1 font-semibold">100% active telemetry</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
                  <p className="text-xs text-rose-700 font-bold">Critical Stock-Out Risks</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">{inventoryStats.criticalStockouts} Ingredients</p>
                  <p className="text-xs text-rose-600 mt-1 font-medium">Outage expected &lt; 24 hrs</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Waste Reduction Rate</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{inventoryStats.wasteReductionRate}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Prevented over-prep</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Monthly AI Cost Savings</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{inventoryStats.estimatedSavingsFromAI}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Bulk purchase optimization</p>
                </div>
              </div>

              {/* Inventory Depletion Cards */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  AI Inventory Depletion & Purchase Recommendations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventoryAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl bg-white border shadow-sm ${
                        item.stockStatus === 'critical'
                          ? 'border-rose-300 ring-1 ring-rose-200'
                          : 'border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <h4 className="text-sm font-black text-slate-900">{item.ingredient}</h4>
                          </div>
                          <span className={`inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                            item.stockStatus === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.stockStatus === 'critical' ? 'Critical Depletion' : 'Warning Level'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {item.confidence}% Conf.
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Stock</p>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">{item.currentStock}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Projected Need</p>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">{item.predictedConsumption}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200/60">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Expected Stock-Out</p>
                          <p className="font-black text-rose-600 text-xs mt-0.5">{item.expectedStockOut}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-800">Impact: </span>
                        {item.impact}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            toast('Navigating to Live Ingredient Register...', { icon: '📋' });
                            navigate('/admin/menu');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          View Inventory
                        </button>

                        <button
                          onClick={() => handleCreatePurchase(item)}
                          disabled={purchaseOrders[item.id]}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                            purchaseOrders[item.id]
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#EA580C] text-white hover:bg-[#EA580C]'
                          }`}
                        >
                          {purchaseOrders[item.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>PO Created: {item.recommendedPurchase}</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-3.5 h-3.5" />
                              <span>Order {item.recommendedPurchase}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: MENU OPTIMIZATION                                     */}
          {/* ============================================================ */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Menu Performance Optimizer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Classifying dishes into 5 intelligence tiers based on volume, margin, and ratings
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">🏆 Best Performer</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900">🔥 Promote</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">📈 Growing</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-900">➡️ Stable</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900">⚠️ Low Performer</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {menuOptimizations.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {item.classification}
                        </span>
                        <span className="font-bold text-amber-500 flex items-center gap-0.5">
                          ⭐ {item.rating}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900">{item.name}</h4>

                      <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Sales Vol</p>
                          <p className="font-bold text-slate-800 mt-0.5">{item.salesVolume.split(' ')[0]}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Revenue</p>
                          <p className="font-bold text-slate-800 mt-0.5">{item.revenue}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Margin</p>
                          <p className="font-bold text-emerald-600 mt-0.5">{item.profitMargin}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs">
                        <p className="text-slate-500 font-medium leading-relaxed">{item.recommendation}</p>
                        <div className="mt-2.5 p-2 bg-orange-50/60 rounded-lg border border-orange-200/60">
                          <p className="text-[10px] font-bold text-orange-800 uppercase">Suggested AI Combo:</p>
                          <p className="text-xs font-bold text-orange-950 mt-0.5">{item.suggestedCombo}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setExplainModal({
                          title: `Menu Optimization for ${item.name}`,
                          confidence: item.confidence,
                          why: [
                            item.why,
                            `Sales velocity: ${item.salesVolume}`,
                            `Average monthly revenue contribution: ${item.revenue}`,
                            `Kitchen profitability margin: ${item.profitMargin}`
                          ]
                        })}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                        <span>Why?</span>
                      </button>

                      <button
                        onClick={() => handleApplyMenuCombo(item)}
                        disabled={appliedMenuRecs[item.id]}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          appliedMenuRecs[item.id]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#EA580C] text-white hover:bg-[#EA580C]'
                        }`}
                      >
                        {appliedMenuRecs[item.id] ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Combo Active</span>
                          </>
                        ) : (
                          <span>Apply Recommendation</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: CUSTOMER INSIGHTS                                     */}
          {/* ============================================================ */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">RFM Customer Segmentation & Loyalty Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated customer cohort grouping based on order frequency, recency, and ticket value
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {customerSegments.map((seg) => (
                  <div key={seg.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">{seg.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${seg.badgeColor}`}>
                              {seg.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{seg.percentage} of active guest database</p>
                        </div>
                        <span className="text-2xl font-black text-slate-900">{seg.count}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Avg Order Value</p>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">{seg.averageOrderValue}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Frequency</p>
                          <p className="font-bold text-slate-800 text-xs mt-0.5">{seg.visitFrequency}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase">Top Ordered Items:</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {seg.favoriteDishes.map((dish, i) => (
                            <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium">
                              {dish}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                        <p className="font-bold text-emerald-900">Recommended Action:</p>
                        <p className="text-emerald-800 mt-0.5">{seg.recommendedAction}</p>
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">
                          Potential Revenue Lift: {seg.potentialRevenueLift}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">{seg.confidence}% Confidence</span>
                      <button
                        onClick={() => {
                          toast.success(`Campaign triggered for ${seg.title}!`, { icon: '🎯' });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition"
                      >
                        Create Loyalty Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: REVIEW SENTIMENT                                      */}
          {/* ============================================================ */}
          {activeTab === 'sentiment' && (
            <div className="space-y-6">
              {/* Sentiment Overview Gauge Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Review Intelligence & Sentiment Engine</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Analyzed 1,420 customer table reviews using Natural Language Processing
                    </p>
                    <div className="mt-4 flex items-center gap-6">
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Overall Sentiment</p>
                        <p className="text-xl font-black text-emerald-600 mt-0.5">😊 {reviewSummary.overallSentiment}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Average Rating</p>
                        <p className="text-xl font-black text-amber-500 mt-0.5">⭐ {reviewSummary.averageRating} / 5.0</p>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Split Bar */}
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-emerald-700">Positive: {reviewSummary.positivePercentage}%</span>
                      <span className="text-amber-700">Neutral: {reviewSummary.neutralPercentage}%</span>
                      <span className="text-rose-700">Negative: {reviewSummary.negativePercentage}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                      <div style={{ width: `${reviewSummary.positivePercentage}%` }} className="bg-emerald-500"></div>
                      <div style={{ width: `${reviewSummary.neutralPercentage}%` }} className="bg-amber-400"></div>
                      <div style={{ width: `${reviewSummary.negativePercentage}%` }} className="bg-rose-500"></div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 flex justify-between">
                      <span>Most Praised: <strong className="text-slate-800">{reviewSummary.mostPraised}</strong></span>
                      <span>Complaint: <strong className="text-rose-700">{reviewSummary.mostCommonComplaint}</strong></span>
                    </div>
                  </div>
                </div>

                {/* AI Sentiment Action Recommendation */}
                <div className="mt-5 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-orange-950">AI Kitchen Priority Recommendation:</p>
                    <p className="text-orange-900 mt-0.5 leading-relaxed">{reviewSummary.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Aspect Scores Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Topic Sentiment Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviewTopics.map((topic, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{topic.name}</span>
                        <span className={topic.score >= 75 ? 'text-emerald-600' : 'text-rose-600'}>
                          {topic.score}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div
                          style={{ width: `${topic.score}%` }}
                          className={`h-full rounded-full ${topic.score >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {topic.mentionCount} guest mentions analyzed
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Verified Customer Feedbacks */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Recent Feedback Telemetry</h4>
                <div className="space-y-3">
                  {recentReviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.customer}</span>
                          <span className="text-[11px] text-amber-500">{'⭐'.repeat(rev.rating)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${rev.sentimentColor}`}>
                            {rev.sentiment}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 italic">"{rev.comment}"</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">{rev.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 8: ANOMALY ALERTS                                        */}
          {/* ============================================================ */}
          {activeTab === 'anomalies' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>AI Anomaly Detection System</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous monitoring of sudden revenue deviations, cancellation spikes, and demand outliers
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {anomalyAlerts.map((anom) => (
                  <div
                    key={anom.id}
                    className={`p-6 rounded-2xl bg-white border shadow-sm ${
                      anom.severity === 'high'
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : anom.severity === 'medium'
                        ? 'border-amber-300'
                        : 'border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">{anom.title}</h4>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            {anom.metric}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Detected: {anom.timestamp}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{anom.confidence}% Confidence</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 mt-3">{anom.description}</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Root Cause Identification</p>
                        <p className="font-medium text-slate-700 mt-1">{anom.rootCause}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Operational Impact</p>
                        <p className="font-medium text-slate-700 mt-1">{anom.impactAssessment}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-[#EA580C] flex items-center gap-1">
                        <span>Action: </span>
                        <span className="text-slate-700 font-medium">{anom.recommendedAction}</span>
                      </div>

                      <button
                        onClick={() => setAnomalyModal(anom)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shrink-0"
                      >
                        Analyze Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 9: AI RECOMMENDATIONS                                    */}
          {/* ============================================================ */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personalized AI Recommendation Engine</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data-driven action plans complete with full algorithmic transparency and academic explainability
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-black px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                          {rec.category}
                        </span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {rec.confidence}% AI Confidence
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900">{rec.title}</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{rec.shortDescription}</p>

                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Expected Outcome:</p>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">{rec.expectedOutcome}</p>
                      </div>

                      {/* Explicit "Why?" Factors */}
                      <div className="mt-4">
                        <p className="text-[11px] font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                          Why does the AI recommend this?
                        </p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {rec.why.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setExplainModal(rec)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Telemetry Detail</span>
                      </button>

                      <button
                        onClick={() => handleApplyRecommendation(rec)}
                        disabled={appliedRecs[rec.id]}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                          appliedRecs[rec.id]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#EA580C] text-white hover:bg-[#EA580C]'
                        }`}
                      >
                        {appliedRecs[rec.id] ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Action Applied</span>
                          </>
                        ) : (
                          <span>Apply Recommendation</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================ */}
      {/* EXPLAINABILITY MODAL ("Why?" Button Dialog)                   */}
      {/* ============================================================ */}
      {explainModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center font-black">
                  ?
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Explainability Breakdown</h3>
                  <p className="text-[11px] text-slate-400">Algorithmic rationale & transparency</p>
                </div>
              </div>
              <button
                onClick={() => setExplainModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Recommendation / Prediction</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{explainModal.title}</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Model Confidence:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {explainModal.confidence}%
                </span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-900 mb-2">Underlying Telemetry Factors:</p>
                <div className="space-y-2">
                  {explainModal.why && explainModal.why.map((factor, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <p className="font-semibold">Academic Project Note:</p>
                <p className="mt-0.5">
                  Predictions are calculated deterministically from transaction logs and do not rely on hallucinated figures, fulfilling transparency requirements for engineering viva examination.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setExplainModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ANOMALY DRILLDOWN MODAL                                      */}
      {/* ============================================================ */}
      {anomalyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Issue Diagnostic Report</h3>
              </div>
              <button
                onClick={() => setAnomalyModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Incident</p>
                <p className="text-sm font-black text-slate-900">{anomalyModal.title}</p>
                <p className="text-slate-600 mt-1">{anomalyModal.description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-500">Root Cause Diagnosis</p>
                <p className="font-semibold text-slate-800 mt-1">{anomalyModal.rootCause}</p>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                <p className="text-[10px] uppercase font-bold text-rose-700">Financial Impact</p>
                <p className="font-semibold mt-0.5">{anomalyModal.impactAssessment}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Mitigation Strategy</p>
                <p className="font-semibold mt-0.5">{anomalyModal.recommendedAction}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  toast.success('Dispatched corrective alert to restaurant staff', { icon: '📢' });
                  setAnomalyModal(null);
                }}
                className="px-4 py-2 bg-[#EA580C] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl transition"
              >
                Dispatch Staff Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Floating "Ask SmartDine AI" Button & Drawer */}
      <AskSmartDineAI
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        defaultQuery={drawerQuery}
      />
    </div>
  );
}
