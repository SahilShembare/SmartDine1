import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
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
  AlertTriangle,
  Timer,
  Utensils,
  Layers,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  CalendarDays,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  User,
  Edit3,
  Save,
  Phone,
  Mail,
  BadgeCheck,
  Award,
  Package,
  Send
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

  const sanitizeChefName = (name) => {
    if (!name || name === 'Master Chef Kitchen' || name === 'Head Chef & Kitchen') {
      return 'Kitchen Chef';
    }
    return name;
  };

  // Dedicated Kitchen Chef Profile State
  const [showChefProfileModal, setShowChefProfileModal] = useState(false);
  const [isEditingChefProfile, setIsEditingChefProfile] = useState(false);

  // Ingredient / Stock Alert States
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockItems, setStockItems] = useState([
    { id: 'paneer', name: 'Paneer', status: 'Low Stock', emoji: '🟠', level: '1.2 kg remaining', color: 'amber', requested: false, reqQty: '5 kg' },
    { id: 'cheese', name: 'Cheese', status: 'Out of Stock', emoji: '🔴', level: '0 kg remaining', color: 'red', requested: false, reqQty: '4 kg' },
    { id: 'chicken', name: 'Chicken', status: 'Low Stock', emoji: '🟠', level: '2.5 kg remaining', color: 'amber', requested: false, reqQty: '10 kg' },
  ]);
  const [stockUrgency, setStockUrgency] = useState('Urgent');
  const [stockNotes, setStockNotes] = useState('');
  const [isSendingStockReq, setIsSendingStockReq] = useState(false);

  const handleSendStockRequest = (e) => {
    if (e) e.preventDefault();
    setIsSendingStockReq(true);
    setTimeout(() => {
      setStockItems(prev => prev.map(item => ({ ...item, requested: true })));
      setIsSendingStockReq(false);
      setShowStockModal(false);
      toast.success('📦 Stock request for Paneer, Cheese & Chicken dispatched to Store Manager!', {
        duration: 4500,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #f97316'
        }
      });
    }, 450);
  };

  const [chefProfile, setChefProfile] = useState(() => {
    const saved = localStorage.getItem('smartdine_kitchen_chef_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.displayName === 'Master Chef Kitchen' || parsed.displayName === 'Head Chef & Kitchen') {
          parsed.displayName = 'Kitchen Chef';
        }
        if (parsed.station && parsed.station.includes('Master Kitchen')) {
          parsed.station = 'All Stations';
        }
        return parsed;
      } catch {}
    }
    return {
      displayName: sanitizeChefName(currentUser?.displayName),
      station: 'All Stations',
      phone: '+91 98765 43210',
      email: currentUser?.email || 'kitchen@smartdine.com',
      specialty: 'Executive Kitchen Lead • Fast Prep & Plating Specialist',
      shift: 'Evening Shift (4:00 PM – 12:00 AM)',
      employeeId: 'KCH-CHEF-01'
    };
  });
  const [editChefForm, setEditChefForm] = useState(chefProfile);

  const handleSaveChefProfile = (e) => {
    e?.preventDefault();
    setChefProfile(editChefForm);
    localStorage.setItem('smartdine_kitchen_chef_profile', JSON.stringify(editChefForm));
    setIsEditingChefProfile(false);
    toast.success('Kitchen Chef Profile updated successfully! 👨‍🍳');
  };

  // Kitchen Orders History State
  const [showProfileSalesModal, setShowProfileSalesModal] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all', 'today', 'yesterday', or 'YYYY-MM-DD'
  const [customDateInput, setCustomDateInput] = useState('');
  const [expandedDates, setExpandedDates] = useState(() => ({}));
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

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
          `🔔 New Order: Table ${latest.tableNumber || '01'}!`,
          `Order #${latest.id} • ${latest.items?.length || 0} items`
        );
      }
      setNewOrderAlert(latest);

      // Pop-up Toast Alert
      toast.custom((t) => (
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-orange-500 shadow-[0_10px_35px_rgba(232,117,42,0.45)] text-white flex items-center gap-3.5 max-w-md w-full animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 animate-bounce">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">Table {latest.tableNumber || '01'}</span>
              <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
                #{latest.id}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {latest.items?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || 'New Order'}
            </p>
            <span className="text-[11px] font-extrabold text-amber-400">
              {latest.items?.length || 0} dishes to prepare
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                setActiveTab('pending');
              }}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shadow cursor-pointer transition active:scale-95"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ), { duration: 8000, id: `kot-${latest.id}` });

      setTimeout(() => setNewOrderAlert(null), 9000);
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled]);

  const handleTestSound = () => {
    playOrderBellSound();
    const testOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: '04',
      customerName: 'Test Table 04',
      total: 620,
      items: [{ name: 'Paneer Butter Masala', quantity: 2 }, { name: 'Butter Naan', quantity: 4 }]
    };
    setNewOrderAlert(testOrder);

    // Pop-up Toast Alert for Test Bell
    toast.custom((t) => (
      <div className="p-4 rounded-2xl bg-slate-900 border-2 border-orange-500 shadow-[0_10px_35px_rgba(232,117,42,0.45)] text-white flex items-center gap-3.5 max-w-md w-full animate-in slide-in-from-top duration-300">
        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 animate-bounce">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white">Table 04</span>
            <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
              #{testOrder.id}
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate mt-0.5">
            2x Paneer Butter Masala, 4x Butter Naan
          </p>
          <span className="text-[11px] font-extrabold text-amber-400">
            6 dishes to prepare
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              setActiveTab('pending');
            }}
            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shadow cursor-pointer transition active:scale-95"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ), { duration: 7000 });

    setTimeout(() => setNewOrderAlert(null), 7000);
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
    { id: 'all', label: 'All Stations', icon: Layers },
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

  // Tab counts (Completed option removed as requested)
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
    };
  }, [orders]);

  // =========================================================================
  // DAILY ORDER SALES & DATE-WISE ORDER GROUPING LOGIC
  // =========================================================================
  const toggleDateExpand = (dateKey) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const getOrderDateKey = (order) => {
    if (!order?.createdAt) return 'Unknown Date';
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return 'Unknown Date';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return 'Unknown Date';
    }
  };

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const formatDisplayDate = (dateKey) => {
    if (!dateKey || dateKey === 'Unknown Date') return 'Other Orders';
    try {
      const [y, m, d] = dateKey.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const formatted = dateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      if (dateKey === todayKey) return `Today (${formatted})`;
      if (dateKey === yesterdayKey) return `Yesterday (${formatted})`;
      return formatted;
    } catch {
      return dateKey;
    }
  };

  // Group all orders date-wise with revenue & items statistics
  const dateWiseGroups = useMemo(() => {
    const groups = {};
    orders.forEach(order => {
      const dateKey = getOrderDateKey(order);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          displayDate: formatDisplayDate(dateKey),
          orders: [],
          totalSales: 0,
          totalItemsCount: 0,
          completedCount: 0,
          activeCount: 0
        };
      }
      groups[dateKey].orders.push(order);
      groups[dateKey].totalSales += (order.total || 0);

      const s = String(order.status || '').toLowerCase().trim();
      if (s === 'completed' || s === 'served') {
        groups[dateKey].completedCount++;
      } else if (s !== 'cancelled') {
        groups[dateKey].activeCount++;
      }

      if (Array.isArray(order.items)) {
        order.items.forEach(i => {
          groups[dateKey].totalItemsCount += (i.quantity || 1);
        });
      }
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [orders, todayKey, yesterdayKey]);

  // Today's specific metrics
  const todayGroup = useMemo(() => {
    return dateWiseGroups.find(g => g.dateKey === todayKey) || {
      orders: [],
      totalSales: 0,
      totalItemsCount: 0,
      completedCount: 0,
      activeCount: 0
    };
  }, [dateWiseGroups, todayKey]);

  // Pending orders for notification popover
  const pendingOrders = useMemo(() => {
    return orders.filter(o => {
      const s = String(o.status || '').toLowerCase().trim();
      return s === 'pending' || s === 'placed';
    });
  }, [orders]);

  // Filtered date groups based on date selector
  const filteredDateGroups = useMemo(() => {
    if (selectedDateFilter === 'all') return dateWiseGroups;
    if (selectedDateFilter === 'today') return dateWiseGroups.filter(g => g.dateKey === todayKey);
    if (selectedDateFilter === 'yesterday') return dateWiseGroups.filter(g => g.dateKey === yesterdayKey);
    return dateWiseGroups.filter(g => g.dateKey === selectedDateFilter);
  }, [dateWiseGroups, selectedDateFilter, todayKey, yesterdayKey]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Collapsible Sidebar for Kitchen Screen */}
      {!sidebarCollapsed && (
        <div className="shrink-0 transition-all duration-300">
          <Sidebar 
            mode="kitchen" 
            onOpenChefProfile={() => {
              setEditChefForm(chefProfile);
              setShowChefProfileModal(true);
            }}
            onOpenOrdersHistory={() => setShowProfileSalesModal(true)}
            chefName={chefProfile.displayName}
          />
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
                    SmartDine Kitchen
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



              {/* Pop-up Notifications Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition relative cursor-pointer"
                  title="Live Kitchen Notifications"
                >
                  <BellRing className={`w-4 h-4 ${pendingOrders.length > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
                  {pendingOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                      {pendingOrders.length}
                    </span>
                  )}
                </button>

                {/* Pop-up Notification Window */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3.5 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-orange-400" />
                        <span>Live Order Notifications</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {pendingOrders.length} Pending
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 text-xs custom-scrollbar">
                      {pendingOrders.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No pending orders right now. Kitchen is clear! 🍳
                        </div>
                      ) : (
                        pendingOrders.map(ord => (
                          <div
                            key={ord.id}
                            onClick={() => {
                              setNotifDropdownOpen(false);
                              setActiveTab('pending');
                            }}
                            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-white">Table {ord.tableNumber || '01'}</span>
                              <span className="text-[10px] font-mono text-orange-400 font-bold">#{ord.id}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate">
                              {ord.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span>🕒 {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                              <span className="text-orange-400 font-bold">{ord.items?.length || 0} items</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {pendingOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          setActiveTab('pending');
                        }}
                        className="w-full py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold text-center cursor-pointer transition"
                      >
                        View All Pending in Queue →
                      </button>
                    )}
                  </div>
                )}
              </div>



              {/* Fullscreen Kiosk Mode Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Native Fullscreen (Wall / Tablet Mode)"}
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
                    <span>New Order: Table {newOrderAlert.tableNumber || '01'}!</span>
                    <span className="text-[10px] font-mono font-bold bg-black/25 px-1.5 py-0.5 rounded">#{newOrderAlert.id}</span>
                  </h4>
                  <p className="text-xs text-orange-100 font-semibold mt-0.5">
                    {newOrderAlert.items?.length || 1} items to prepare
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
                  Active Orders
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
          {/* 4. INGREDIENT / STOCK ALERT BAR                                  */}
          {/* ================================================================ */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 animate-in fade-in duration-200">
            {/* Left: Section Title & Small Alerts */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800 shrink-0">
                <span className="text-base">📦</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 whitespace-nowrap">
                  Ingredient / Stock Alert
                </span>
              </div>

              {/* Small Alerts Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 🟠 Paneer — Low Stock */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
                  <span>🟠</span>
                  <span className="text-white font-extrabold">Paneer</span>
                  <span className="text-slate-400 font-normal">—</span>
                  <span className="text-amber-400 font-black">Low Stock</span>
                  {stockItems.find(i => i.id === 'paneer')?.requested && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                      Requested ✓
                    </span>
                  )}
                </div>

                {/* 🔴 Cheese — Out of Stock */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold shadow-sm">
                  <span>🔴</span>
                  <span className="text-white font-extrabold">Cheese</span>
                  <span className="text-slate-400 font-normal">—</span>
                  <span className="text-red-400 font-black uppercase text-[11px] tracking-wide">Out of Stock</span>
                  {stockItems.find(i => i.id === 'cheese')?.requested && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                      Requested ✓
                    </span>
                  )}
                </div>

                {/* 🟠 Chicken — Low Stock */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
                  <span>🟠</span>
                  <span className="text-white font-extrabold">Chicken</span>
                  <span className="text-slate-400 font-normal">—</span>
                  <span className="text-amber-400 font-black">Low Stock</span>
                  {stockItems.find(i => i.id === 'chicken')?.requested && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                      Requested ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: "Request Stock" Action Button */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowStockModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black shadow-glow hover:shadow-orange-500/40 transition active:scale-95 cursor-pointer"
                title="Send Stock Replenishment Request to Store Manager"
              >
                <Package className="w-3.5 h-3.5 text-white" />
                <span>Request Stock</span>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 5. TOOLBAR: LIFECYCLE TABS, TABLE SEARCH & SORT                   */}
          {/* ================================================================ */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-800/80">
            
            {/* Status Lifecycle Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Live Order Queue */}
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-orange-500 text-white shadow-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>Live Order Queue</span>
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

            </div>

            {/* Right: Search by Table / KOT ID */}
            <div className="flex items-center gap-2">
              {/* Quick Search (Compact) */}
              <div className="relative w-44 sm:w-52">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Table / #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
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
                  <span>Kitchen Order Slip</span>
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
                    <p className="text-[11px] text-slate-600">DINE-IN ORDER SLIP</p>
                    <div className="mt-2 py-1 px-3 bg-slate-100 rounded text-sm font-black tracking-wide border border-slate-300">
                      TABLE {kotSlipOrder.tableNumber || '01'}
                    </div>
                  </div>

                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order #:</span>
                      <span className="font-bold">ORD-{String(kotSlipOrder.id || '').slice(-6).toUpperCase()}</span>
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
                    <div>SmartDine Automated Order Print</div>
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
                  <span>Print Order Ticket</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 8. KITCHEN PROFILE & DAILY SALES / DATE-WISE ORDERS MODAL          */}
        {/* ================================================================== */}
        {showProfileSalesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-glow">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Kitchen Profile & Date-Wise Orders</span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider">
                        Order Records
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Date-wise orders breakdown and kitchen cooking volume
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileSalesModal(false)}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* 1. Kitchen Staff Profile Section */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      {sanitizeChefName(currentUser?.displayName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h3 className="text-base font-black text-white">
                          {sanitizeChefName(currentUser?.displayName)}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase">
                          Kitchen Staff
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {currentUser?.email || 'kitchen@smartdine.com'} • On-Duty Commercial Kitchen Station
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active Kitchen Shift • Real-time Order Stream</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block">Current Date</span>
                    <span className="text-sm font-black text-white">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* 2. Key Daily Kitchen Performance: Orders & Dishes Cooked (No Income/Sales) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Today's Orders */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Today's Orders
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                        {todayGroup.orders.length} <span className="text-sm font-bold text-slate-400">orders</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                        Total tickets received today
                      </span>
                    </div>
                  </div>

                  {/* Today's Dishes Cooked */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Dishes Cooked
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                        {todayGroup.totalItemsCount} <span className="text-sm font-bold text-slate-400">dishes</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                        Total items prepared today
                      </span>
                    </div>
                  </div>

                  {/* Fulfilled & Served */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Served & Completed
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                        {todayGroup.completedCount} <span className="text-sm font-bold text-slate-400">orders</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                        Delivered successfully to tables
                      </span>
                    </div>
                  </div>

                </div>

                {/* 3. Date-Wise Orders History Explorer */}
                <div className="space-y-4 pt-2">
                  
                  {/* Section Title & Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-orange-400" />
                        <span>Date-Wise Order Records</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Check kitne order konse din huye aur unke total dishes ka count
                      </p>
                    </div>

                    {/* Filter Pills & Custom Date Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateFilter('all');
                          setCustomDateInput('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedDateFilter === 'all'
                            ? 'bg-orange-500 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        All Dates ({dateWiseGroups.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateFilter('today');
                          setCustomDateInput('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedDateFilter === 'today'
                            ? 'bg-orange-500 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Today ({todayGroup.orders.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateFilter('yesterday');
                          setCustomDateInput('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedDateFilter === 'yesterday'
                            ? 'bg-orange-500 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Yesterday
                      </button>

                      {/* Custom Date Input */}
                      <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="date"
                          value={customDateInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomDateInput(val);
                            if (val) {
                              setSelectedDateFilter(val);
                            } else {
                              setSelectedDateFilter('all');
                            }
                          }}
                          className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                          title="Pick custom date to filter orders"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date-Wise Groups List */}
                  {filteredDateGroups.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                      <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
                      <h5 className="font-bold text-sm text-slate-300">No Orders Recorded on This Date</h5>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Is date par koi order record nahi mila. Doosri date select karein ya 'All Dates' par tap karein.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateFilter('all');
                          setCustomDateInput('');
                        }}
                        className="mt-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs"
                      >
                        Show All Dates
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDateGroups.map((group) => {
                        const isExpanded = !!expandedDates[group.dateKey] || filteredDateGroups.length === 1;
                        return (
                          <div
                            key={group.dateKey}
                            className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-sm transition-all"
                          >
                            {/* Date Group Card Header */}
                            <div
                              onClick={() => toggleDateExpand(group.dateKey)}
                              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition select-none"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-black text-white">
                                    {group.displayDate}
                                  </h5>
                                  <span className="text-[11px] text-slate-400">
                                    Date Key: <span className="font-mono text-slate-300">{group.dateKey}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Date Group Summary Badges */}
                              <div className="flex items-center gap-2 sm:gap-3">
                                {/* Total Orders count on this day */}
                                <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-200">
                                  {group.orders.length} Orders
                                </span>

                                {/* Total Dishes Cooked on this day */}
                                <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-400">
                                  {group.totalItemsCount} Dishes Cooked
                                </span>

                                <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Orders Table for this Date */}
                            {isExpanded && (
                              <div className="p-3 sm:p-4 pt-0 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2 flex items-center justify-between">
                                  <span>Orders Placed on {group.displayDate}</span>
                                  <span>{group.totalItemsCount} Total Items Cooked</span>
                                </div>

                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                  {group.orders.map((ord, oIdx) => {
                                    const ordTime = ord.createdAt
                                      ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'Just now';
                                    const statusStr = String(ord.status || '').toLowerCase().trim();
                                    return (
                                      <div
                                        key={ord.id || oIdx}
                                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                                      >
                                        <div className="space-y-1 flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                              #{ord.id}
                                            </span>
                                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                                              Table {ord.tableNumber || '01'}
                                            </span>
                                            <span className="text-slate-400 font-medium">
                                              🕒 {ordTime}
                                            </span>
                                            {ord.customerName && (
                                              <span className="text-slate-400 truncate">
                                                • {ord.customerName}
                                              </span>
                                            )}
                                          </div>

                                          {/* Items summary */}
                                          <p className="text-slate-300 text-[11px] truncate">
                                            {ord.items?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || 'No item detail'}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                          {/* Status Badge */}
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                            statusStr === 'completed' || statusStr === 'served'
                                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                              : statusStr === 'ready'
                                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                              : statusStr === 'preparing'
                                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                              : statusStr === 'cancelled'
                                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                              : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                          }`}>
                                            {ord.status || 'Active'}
                                          </span>

                                          {/* Order Items count */}
                                          <span className="font-mono font-bold text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                                            {ord.items?.length || 0} items
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  Showing records across <strong className="text-white">{filteredDateGroups.length}</strong> date(s)
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfileSalesModal(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 cursor-pointer"
                >
                  Close Records
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 9. DEDICATED KITCHEN CHEF PROFILE MODAL                            */}
        {/* ================================================================== */}
        {showChefProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white flex items-center justify-center shadow-glow">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>Kitchen Chef Profile</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                        On Duty
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Staff credentials, station setup & on-duty performance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingChefProfile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditChefForm(chefProfile);
                        setIsEditingChefProfile(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingChefProfile(false);
                      setShowChefProfileModal(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
                
                {/* 1. Chef Identity Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-3xl shadow-glow border-2 border-orange-400/40">
                      {chefProfile.displayName ? chefProfile.displayName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-white flex items-center justify-center shadow" title="Active On Duty">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <h3 className="text-lg font-black text-white">
                        {chefProfile.displayName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase">
                        Kitchen Staff
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      {chefProfile.specialty}
                    </p>

                    <div className="flex items-center gap-3 justify-center sm:justify-start text-xs text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <BadgeCheck className="w-3.5 h-3.5 text-orange-400" />
                        <span>ID: {chefProfile.employeeId}</span>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Kitchen Shift</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Edit Profile Form OR Info View */}
                {isEditingChefProfile ? (
                  <form onSubmit={handleSaveChefProfile} className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Chef Credentials</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">Update staff details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Chef / Staff Display Name</label>
                        <input
                          type="text"
                          value={editChefForm.displayName}
                          onChange={(e) => setEditChefForm({ ...editChefForm, displayName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Kitchen Intercom / Phone</label>
                        <input
                          type="text"
                          value={editChefForm.phone}
                          onChange={(e) => setEditChefForm({ ...editChefForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Assigned Prep Station</label>
                        <select
                          value={editChefForm.station}
                          onChange={(e) => setEditChefForm({ ...editChefForm, station: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-orange-500 focus:outline-none cursor-pointer"
                        >
                          <option value="All Stations">All Stations</option>
                          <option value="Tandoor & Starters">Tandoor & Starters</option>
                          <option value="Curries & Mains">Curries & Mains</option>
                          <option value="Pizza & Fast Food">Pizza & Fast Food</option>
                          <option value="Breads & Rice">Breads & Rice</option>
                          <option value="Bar & Beverages">Bar & Beverages</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Shift Slot</label>
                        <select
                          value={editChefForm.shift}
                          onChange={(e) => setEditChefForm({ ...editChefForm, shift: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-orange-500 focus:outline-none cursor-pointer"
                        >
                          <option value="Morning Shift (8:00 AM – 4:00 PM)">Morning Shift (8:00 AM – 4:00 PM)</option>
                          <option value="Evening Shift (4:00 PM – 12:00 AM)">Evening Shift (4:00 PM – 12:00 AM)</option>
                          <option value="Night Shift (8:00 PM – 4:00 AM)">Night Shift (8:00 PM – 4:00 AM)</option>
                          <option value="Full Day Shift">Full Day Shift</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 font-bold mb-1">Role / Cooking Specialty</label>
                        <input
                          type="text"
                          value={editChefForm.specialty}
                          onChange={(e) => setEditChefForm({ ...editChefForm, specialty: e.target.value })}
                          placeholder="e.g. Tandoor Chef, Quick Order Expediter"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingChefProfile(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Credentials Details Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Station</span>
                        <span className="text-xs font-black text-white">{chefProfile.station}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Shift Timing</span>
                        <span className="text-xs font-black text-white">{chefProfile.shift}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kitchen Contact</span>
                        <span className="text-xs font-mono font-bold text-white">{chefProfile.phone}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Station Email</span>
                        <span className="text-xs font-mono font-bold text-white truncate max-w-[180px] block">{chefProfile.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Today's Shift Performance (No sales/income, pure food prep metrics) */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Today's Kitchen Shift Performance</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Orders</span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{todayGroup.orders.length}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">tickets today</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Dishes Cooked</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">{todayGroup.totalItemsCount}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">plates plated</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Served</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block">{todayGroup.completedCount}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">delivered</span>
                    </div>
                  </div>
                </div>

                {/* 4. Quick Actions */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Bell className="w-4 h-4 text-orange-400" />
                    <span>Test kitchen audio bell & pop-up chime</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    Ring Test Bell 🔔
                  </button>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowChefProfileModal(false);
                    setShowProfileSalesModal(true);
                  }}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>View Date-Wise Orders History →</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowChefProfileModal(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 10. REQUEST STOCK / INGREDIENT REPLENISHMENT MODAL                 */}
        {/* ================================================================== */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>📦 Ingredient / Stock Replenishment</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Notify Restaurant Store & Inventory Manager
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSendStockRequest} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Stock Alert Items to Request */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                    Critical Ingredients Needed:
                  </label>
                  
                  <div className="space-y-2">
                    {stockItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          item.color === 'red' 
                            ? 'bg-red-950/20 border-red-500/40' 
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white">{item.name}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                item.color === 'red' 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">{item.level}</span>
                          </div>
                        </div>

                        {/* Quantity input */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-bold">Qty:</span>
                          <input 
                            type="text"
                            defaultValue={item.reqQty}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStockItems(prev => prev.map(si => si.id === item.id ? { ...si, reqQty: val } : si));
                            }}
                            className="w-20 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black text-center text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgency Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                    Urgency Priority:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Normal', 'Urgent', 'Emergency'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setStockUrgency(lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-black text-center transition cursor-pointer border ${
                          stockUrgency === lvl
                            ? lvl === 'Emergency'
                              ? 'bg-red-600 text-white border-red-500 shadow-glow'
                              : 'bg-orange-500 text-white border-orange-400 shadow-glow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {lvl === 'Emergency' ? '🚨 Emergency' : lvl === 'Urgent' ? '⚡ Urgent' : '📦 Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                    Kitchen Chef Remark:
                  </label>
                  <textarea
                    rows={2}
                    value={stockNotes}
                    onChange={(e) => setStockNotes(e.target.value)}
                    placeholder="e.g., Running dinner rush, please send cheese immediately..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingStockReq}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-glow transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingStockReq ? 'Sending Request...' : 'Send Stock Request 🚀'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
