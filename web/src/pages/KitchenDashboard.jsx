import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import OrderCard from '../components/OrderCard';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  playOrderBellSound, 
  showOrderNotification, 
  requestNotificationPermission 
} from '../utils/notificationSound';
import { 
  ChefHat, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  ShoppingBag,
  BellRing,
  Eye,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  RotateCw,
  SlidersHorizontal,
  AlertTriangle,
  Timer,
  Utensils,
  Layers,
  Check,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function KitchenDashboard() {
  const { currentUser } = useAuth();
  const { orders, updateOrderStatus, updateOrderEta, refreshOrders } = useTableOrder();
  const isAdminReadOnly = currentUser?.role === 'admin';

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('all'); // all, pending, preparing, ready, served, completed
  const [selectedStation, setSelectedStation] = useState('all'); // all, tandoor, curry, pizza, breads, beverages, desserts
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('fifo'); // fifo (oldest/urgent first), newest
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio & Notification States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kotSlipOrder, setKotSlipOrder] = useState(null); // Active order for Thermal KOT print modal

  // Master Digital Kitchen Clock
  const [currentClock, setCurrentClock] = useState(() => new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentClock(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const prevOrderIdsRef = useRef(new Set(orders.map(o => o.id)));

  // 3-Second Active Auto-Refresh Interval
  useEffect(() => {
    const syncTimer = setInterval(async () => {
      setIsRefreshing(true);
      if (refreshOrders) {
        await refreshOrders();
      }
      setLastSyncTime(new Date().toLocaleTimeString());
      setTimeout(() => setIsRefreshing(false), 500);
    }, 3000);

    return () => clearInterval(syncTimer);
  }, [refreshOrders]);

  // Detect newly arrived orders and trigger audio chime
  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    const newOrders = orders.filter(o => !prevOrderIdsRef.current.has(o.id));

    if (newOrders.length > 0) {
      const latest = newOrders[0];
      if (soundEnabled) {
        showOrderNotification(
          `🔔 New KOT: Table ${latest.tableNumber || '01'}!`,
          `Order #${latest.id} • ${latest.items?.length || 0} items • ₹${latest.total?.toFixed(0) || '0'}`
        );
      }
      setNewOrderAlert(latest);
      setTimeout(() => setNewOrderAlert(null), 9000);
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled]);

  const handleTestSound = () => {
    playOrderBellSound();
    setNewOrderAlert({
      id: `KOT-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: '04',
      customerName: 'Test Table 04',
      total: 620,
      items: [{ name: 'Paneer Butter Masala', quantity: 2 }, { name: 'Butter Naan', quantity: 4 }]
    });
    setTimeout(() => setNewOrderAlert(null), 6000);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (isAdminReadOnly) {
      alert('Action Blocked: Administrator account is in Read-Only monitor mode and cannot modify kitchen order tickets.');
      return;
    }
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  };

  const handleEtaUpdate = async (orderId, newMinutes) => {
    if (isAdminReadOnly) {
      alert('Action Blocked: Administrator account is in Read-Only monitor mode.');
      return;
    }
    if (updateOrderEta) {
      await updateOrderEta(orderId, newMinutes);
    }
  };

  // Kitchen Stations Definition
  const KITCHEN_STATIONS = [
    { id: 'all', label: 'All Stations (Master KDS)', icon: Layers },
    { id: 'tandoor', label: 'Tandoor & Starters', icon: Flame, keywords: ['tandoor', 'tikka', 'kebab', 'starter', 'paneer tikka'] },
    { id: 'curry', label: 'Curries & Mains', icon: Utensils, keywords: ['curry', 'masala', 'gravy', 'dal', 'paneer butter', 'chicken'] },
    { id: 'pizza', label: 'Pizza & Fast Food', icon: ShoppingBag, keywords: ['pizza', 'burger', 'sandwich', 'pasta', 'fries'] },
    { id: 'breads', label: 'Breads & Rice', icon: ChefHat, keywords: ['naan', 'roti', 'paratha', 'kulcha', 'rice', 'biryani', 'pulao'] },
    { id: 'beverages', label: 'Bar & Beverages', icon: Sparkles, keywords: ['shake', 'coffee', 'tea', 'mojito', 'lassi', 'soda', 'drink', 'beverage'] },
    { id: 'desserts', label: 'Desserts', icon: Clock, keywords: ['dessert', 'ice cream', 'gulab jamun', 'kulfi', 'brownie', 'halwa'] },
  ];

  // Filter and Sort orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const s = String(order.status || '').toLowerCase().trim();

      // 1. Status Tab filter
      if (activeTab === 'all') {
        if (s === 'completed' || s === 'cancelled') return false;
      } else if (activeTab === 'pending') {
        if (s !== 'pending' && s !== 'placed') return false;
      } else if (activeTab === 'preparing') {
        if (s !== 'preparing' && s !== 'accepted') return false;
      } else if (activeTab === 'ready') {
        if (s !== 'ready') return false;
      } else if (activeTab === 'served') {
        if (s !== 'served' && s !== 'enjoying_meal' && s !== 'enjoying meal' && s !== 'bill requested' && s !== 'bill_requested') return false;
      } else if (activeTab === 'completed') {
        if (s !== 'completed') return false;
      }

      // 2. Station Filter (Checks if any item matches the station's keywords)
      if (selectedStation !== 'all') {
        const station = KITCHEN_STATIONS.find(st => st.id === selectedStation);
        if (station && station.keywords) {
          const hasMatchingItem = order.items?.some(item => {
            const nameLower = String(item.name || '').toLowerCase();
            const catLower = String(item.category || '').toLowerCase();
            return station.keywords.some(kw => nameLower.includes(kw) || catLower.includes(kw));
          });
          if (!hasMatchingItem) return false;
        }
      }

      // 3. Search query filter (Table #, Order #, Guest name, Dish name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTable = String(order.tableNumber || '').toLowerCase().includes(q) || `table ${order.tableNumber}`.toLowerCase().includes(q);
        const matchesId = String(order.id || '').toLowerCase().includes(q);
        const matchesCustomer = String(order.customerName || '').toLowerCase().includes(q);
        const matchesItem = order.items?.some(i => String(i.name || '').toLowerCase().includes(q));
        if (!matchesTable && !matchesId && !matchesCustomer && !matchesItem) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort: FIFO (Oldest first for kitchen expediting) vs Newest
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (sortOrder === 'fifo') {
        return timeA - timeB; // Oldest first
      } else {
        return timeB - timeA; // Newest first
      }
    });
  }, [orders, activeTab, selectedStation, searchQuery, sortOrder]);

  // Operational Metrics
  const metrics = useMemo(() => {
    const active = orders.filter(o => {
      const s = String(o.status || '').toLowerCase().trim();
      return s !== 'completed' && s !== 'cancelled';
    });

    const now = Date.now();
    let rushCount = 0;
    let totalItemsInPrep = 0;
    let totalEtaMinutes = 0;
    let etaCount = 0;

    active.forEach(o => {
      const s = String(o.status || '').toLowerCase().trim();
      const diffMins = Math.floor((now - new Date(o.createdAt || now).getTime()) / 60000);
      const targetEta = o.estimatedPrepMinutes || 20;

      // Rush if waiting > 15m or exceeds target ETA
      if (diffMins >= 15 || (targetEta > 0 && diffMins >= targetEta)) {
        rushCount++;
      }

      // Total dishes being cooked
      if (s === 'pending' || s === 'placed' || s === 'preparing' || s === 'accepted') {
        o.items?.forEach(i => {
          totalItemsInPrep += (i.quantity || 1);
        });
      }

      if (o.estimatedPrepMinutes) {
        totalEtaMinutes += o.estimatedPrepMinutes;
        etaCount++;
      }
    });

    const avgEta = etaCount > 0 ? Math.round(totalEtaMinutes / etaCount) : 20;

    return {
      activeKots: active.length,
      platesInPrep: totalItemsInPrep,
      rushCount,
      readyCount: orders.filter(o => String(o.status || '').toLowerCase().trim() === 'ready').length,
      avgEta
    };
  }, [orders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s !== 'completed' && s !== 'cancelled';
      }).length,
      pending: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s === 'pending' || s === 'placed';
      }).length,
      preparing: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s === 'preparing' || s === 'accepted';
      }).length,
      ready: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s === 'ready';
      }).length,
      served: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s === 'served' || s === 'enjoying_meal' || s === 'bill requested';
      }).length,
      completed: orders.filter(o => {
        const s = String(o.status || '').toLowerCase().trim();
        return s === 'completed';
      }).length,
    };
  }, [orders]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Collapsible Sidebar for Kitchen Screen */}
      {!sidebarCollapsed && (
        <div className="shrink-0 transition-all duration-300">
          <Sidebar mode="kitchen" />
        </div>
      )}

      {/* Main KDS Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* ================================================================== */}
        {/* 1. MASTER KDS TOP HUD (Controls, Live Clock & System Status)         */}
        {/* ================================================================== */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Left: Branding & Station Selector */}
            <div className="flex items-center gap-3">
              
              {/* Sidebar Collapse Button */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title={sidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Sidebar for Fullscreen Ticket Width"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-glow shrink-0">
                <ChefHat className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg lg:text-xl font-black text-white tracking-wide uppercase">
                    SmartDine KDS
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider">
                    Kitchen Display
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Commercial Kitchen Station • Live Table QR Orders
                </p>
              </div>
            </div>

            {/* Center: Real-Time Digital Kitchen Clock */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="font-mono text-base font-black tracking-widest text-slate-200">
                {currentClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-xs text-slate-400 font-bold border-l border-slate-800 pl-2">
                {currentClock.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Right: KDS Operational Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* 3s Auto-Sync Pulse */}
              <div 
                onClick={() => {
                  if (refreshOrders) refreshOrders();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-inner cursor-pointer hover:bg-emerald-500/20 transition"
                title="Real-time 3s auto-sync active with customer table ordering. Click to force instant refresh."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px]">3s Sync</span>
                <RotateCw className={`w-3 h-3 ml-0.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>

              {/* Sound Test Chime */}
              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-glow transition active:scale-95 cursor-pointer"
                title="Test Kitchen Audio Bell"
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Test Bell</span>
              </button>

              {/* Sound ON/OFF Toggle */}
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playOrderBellSound();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  soundEnabled 
                    ? 'bg-slate-800 text-orange-400 border-orange-500/40' 
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title={soundEnabled ? "Audio chime is active" : "Audio chime is muted"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
              </button>

              {/* Fullscreen Kiosk Mode Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen KDS" : "Enter Native Fullscreen KDS (Wall / Tablet Mode)"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </header>

        {/* ================================================================== */}
        {/* 2. FLOATING NEW ORDER ALERT BANNER                                 */}
        {/* ================================================================== */}
        {newOrderAlert && (
          <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-in slide-in-from-top duration-300 px-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white shadow-[0_0_35px_rgba(232,117,42,0.45)] border-2 border-white/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black animate-bounce shadow-md">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm flex items-center gap-1.5">
                    <span>New KOT: Table {newOrderAlert.tableNumber || '01'}!</span>
                    <span className="text-[10px] font-mono font-bold bg-black/25 px-1.5 py-0.5 rounded">#{newOrderAlert.id}</span>
                  </h4>
                  <p className="text-xs text-orange-100 font-semibold mt-0.5">
                    {newOrderAlert.items?.length || 1} items • Total: ₹{newOrderAlert.total || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pending');
                    setNewOrderAlert(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-orange-600 font-black text-xs shadow hover:bg-orange-50 cursor-pointer"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setNewOrderAlert(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 lg:p-6 space-y-5 max-w-[1920px] w-full mx-auto">
          
          {/* ================================================================ */}
          {/* 3. KITCHEN OPERATIONS METRICS SUMMARY BAR                         */}
          {/* ================================================================ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* Active Tickets */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active KOTs
                </span>
                <span className="text-xl font-black text-white">
                  {metrics.activeKots}
                </span>
              </div>
            </div>

            {/* Plates in Prep */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dishes in Prep
                </span>
                <span className="text-xl font-black text-white">
                  {metrics.platesInPrep} <span className="text-xs text-slate-400 font-semibold">plates</span>
                </span>
              </div>
            </div>

            {/* Rush / Delayed Tickets */}
            <div className={`p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 ${
              metrics.rushCount > 0 
                ? 'bg-red-950/30 border-red-500/50 text-red-300 ring-1 ring-red-500/30' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                metrics.rushCount > 0 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Overdue / Rush
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xl font-black ${metrics.rushCount > 0 ? 'text-red-400' : 'text-white'}`}>
                    {metrics.rushCount}
                  </span>
                  {metrics.rushCount > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-900/40 px-1.5 py-0.2 rounded">
                      Needs Action
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ready for Service / Runner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ready for Pickup
                </span>
                <span className="text-xl font-black text-emerald-300">
                  {metrics.readyCount}
                </span>
              </div>
            </div>

            {/* Avg Target Prep ETA */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Prep ETA
                </span>
                <span className="text-xl font-black text-amber-300">
                  {metrics.avgEta} <span className="text-xs text-slate-400 font-semibold">min</span>
                </span>
              </div>
            </div>

          </div>

          {/* Admin Read-Only Banner */}
          {isAdminReadOnly && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Admin Monitor Mode:</strong> You are viewing live kitchen tickets in <strong>Read-Only</strong> mode. Ticket progression is reserved for kitchen line cooks.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] uppercase font-extrabold border border-amber-500/30">
                View Only
              </span>
            </div>
          )}

          {/* ================================================================ */}
          {/* 4. STATION SELECTOR BAR (Line-Cook Stations)                      */}
          {/* ================================================================ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Kitchen Prep Stations:</span>
              </span>
              {selectedStation !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedStation('all')}
                  className="text-orange-400 hover:text-orange-300 text-[11px] cursor-pointer"
                >
                  Reset to All Stations
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {KITCHEN_STATIONS.map((station) => {
                const Icon = station.icon;
                const isSelected = selectedStation === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => setSelectedStation(station.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-glow'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-400'}`} />
                    <span>{station.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* 5. TOOLBAR: LIFECYCLE TABS, TABLE SEARCH & SORT                   */}
          {/* ================================================================ */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-800/80">
            
            {/* Status Lifecycle Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Active Queue */}
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-orange-500 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Active Queue</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
                  {tabCounts.all}
                </span>
              </button>

              {/* New Orders */}
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>New Orders</span>
                {tabCounts.pending > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-bounce">
                    {tabCounts.pending}
                  </span>
                )}
              </button>

              {/* In Prep */}
              <button
                type="button"
                onClick={() => setActiveTab('preparing')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'preparing'
                    ? 'bg-blue-600 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Cooking (Prep)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
                  {tabCounts.preparing}
                </span>
              </button>

              {/* Ready to Serve */}
              <button
                type="button"
                onClick={() => setActiveTab('ready')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'ready'
                    ? 'bg-emerald-600 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Ready for Runner</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
                  {tabCounts.ready}
                </span>
              </button>

              {/* Served */}
              <button
                type="button"
                onClick={() => setActiveTab('served')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'served'
                    ? 'bg-teal-700 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Served (Dining)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
                  {tabCounts.served}
                </span>
              </button>

              {/* Completed */}
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Completed</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
                  {tabCounts.completed}
                </span>
              </button>

            </div>

            {/* Right: Search by Table / KOT ID & Urgency Sort */}
            <div className="flex items-center gap-2.5">
              {/* Quick Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter Table (e.g. Table 04) or KOT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Urgency FIFO vs Newest Sort */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSortOrder('fifo')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sortOrder === 'fifo' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="FIFO: Oldest and most urgent orders appear first (Standard Restaurant Kitchen practice)"
                >
                  FIFO (Urgent First)
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('newest')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sortOrder === 'newest' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Newest orders appear first"
                >
                  Newest
                </button>
              </div>
            </div>

          </div>

          {/* ================================================================ */}
          {/* 6. ORDERS GRID (Authentic KDS Layout)                             */}
          {/* ================================================================ */}
          {filteredOrders.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto">
                <ChefHat className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-200">No Kitchen Tickets in this Queue</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery 
                    ? `No orders match "${searchQuery}". Try clearing your search filter.`
                    : 'Customer QR orders placed from dine-in tables will land here automatically in real-time with sound chimes.'}
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold hover:bg-orange-500/30 transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleStatusUpdate}
                  onUpdateEta={handleEtaUpdate}
                  onOpenKotSlip={(ord) => setKotSlipOrder(ord)}
                  readOnly={isAdminReadOnly}
                  stationFilter={selectedStation}
                />
              ))}
            </div>
          )}

        </div>

        {/* ================================================================== */}
        {/* 7. THERMAL KOT PRINT SLIP MODAL (80mm POS Slip Preview)            */}
        {/* ================================================================== */}
        {kotSlipOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2 text-slate-200 font-extrabold text-sm">
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>Kitchen Order Ticket (KOT Slip)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setKotSlipOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thermal Paper Slip Body */}
              <div className="p-6 overflow-y-auto bg-slate-950 flex justify-center">
                
                <div className="w-full max-w-[340px] bg-white text-slate-950 p-5 rounded shadow-lg font-mono text-xs border border-dashed border-slate-400 leading-tight">
                  
                  <div className="text-center pb-3 border-b border-dashed border-slate-400">
                    <h2 className="text-base font-black tracking-wider uppercase">SMARTDINE KITCHEN</h2>
                    <p className="text-[11px] text-slate-600">DINE-IN KOT SLIP</p>
                    <div className="mt-2 py-1 px-3 bg-slate-100 rounded text-sm font-black tracking-wide border border-slate-300">
                      TABLE {kotSlipOrder.tableNumber || '01'}
                    </div>
                  </div>

                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">KOT #:</span>
                      <span className="font-bold">KOT-{String(kotSlipOrder.id || '').slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Time:</span>
                      <span className="font-bold">
                        {kotSlipOrder.createdAt ? new Date(kotSlipOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Source:</span>
                      <span className="font-bold">Table QR Scan</span>
                    </div>
                    {kotSlipOrder.customerName && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Guest:</span>
                        <span className="font-bold truncate">{kotSlipOrder.customerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Table */}
                  <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
                    <div className="flex justify-between font-black text-[11px] uppercase border-b pb-1">
                      <span>QTY  ITEM</span>
                      <span>STATUS</span>
                    </div>
                    {kotSlipOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs pt-0.5">
                        <div>
                          <span className="font-black mr-1.5">{item.quantity}x</span>
                          <span className="font-bold">{item.name}</span>
                          {item.instructions && (
                            <div className="text-[10px] text-red-600 italic pl-5">
                              * {item.instructions}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-[10px]">
                          {item.isVeg !== false ? '[VEG]' : '[NON-VEG]'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special Notes Callout */}
                  {kotSlipOrder.notes && (
                    <div className="py-2.5 border-b border-dashed border-slate-400">
                      <div className="font-black text-red-600 text-[11px] uppercase">
                        *** SPECIAL INSTRUCTION ***
                      </div>
                      <div className="font-bold text-xs mt-0.5">
                        {kotSlipOrder.notes}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 text-center text-[10px] text-slate-500">
                    <div>SmartDine Automated KDS Print</div>
                    <div className="mt-1 font-mono tracking-widest text-slate-400">
                      - - - - - TEAR HERE - - - - -
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKotSlipOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print KOT Ticket</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
