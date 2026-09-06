import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import AskSmartDineAI from '../components/AskSmartDineAI';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Grid,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  Search,
  ChevronDown,
  Calendar,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Download,
  Filter,
  Eye,
  Star,
  DollarSign,
  IndianRupee,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { 
    orders: contextOrders = [], 
    menuItems: contextMenuItems = [], 
    tables: contextTables = [],
    setMenuItems,
    setTables
  } = useTableOrder();
  const navigate = useNavigate();

  // Navigation & Drawer State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Time Period for Revenue Analytics
  const [timePeriod, setTimePeriod] = useState('today'); // 'today' | 'week' | 'month' | 'year'

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Recent Orders Filter & Search
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSortBy, setOrderSortBy] = useState('newest'); // 'newest' | 'amount-high' | 'amount-low'

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [addFoodModalOpen, setAddFoodModalOpen] = useState(false);
  const [addTableModalOpen, setAddTableModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dashboardAiOpen, setDashboardAiOpen] = useState(false);
  const [dashboardAiQuery, setDashboardAiQuery] = useState('');

  // Restaurant Background Image Themes
  const BACKGROUND_OPTIONS = [
    {
      id: 'fine-dining',
      name: '🏛️ Grand Dining Hall (Local HQ)',
      url: '/restaurant-bg.jpg'
    },
    {
      id: 'luxury-lounge',
      name: '🍷 Luxury Ambient Lounge',
      url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1920&auto=format&fit=crop&q=80'
    },
    {
      id: 'royal-bistro',
      name: '✨ Royal Bistro Lights',
      url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1920&auto=format&fit=crop&q=80'
    },
    {
      id: 'terrace-lights',
      name: '🌿 Terrace Dining',
      url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1920&auto=format&fit=crop&q=80'
    }
  ];

  const [currentBg, setCurrentBg] = useState(() => {
    const saved = localStorage.getItem('smartdine_admin_bg');
    return (saved && saved.startsWith('/')) ? saved : BACKGROUND_OPTIONS[0].url;
  });
  const [bgDropdownOpen, setBgDropdownOpen] = useState(false);

  const handleSelectBg = (url) => {
    setCurrentBg(url);
    localStorage.setItem('smartdine_admin_bg', url);
    setBgDropdownOpen(false);
    toast.success('Dashboard background updated!', { icon: '🖼️' });
  };

  // Form State for Quick Add Food
  const [newFood, setNewFood] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    isVeg: true,
    description: '',
    isAvailable: true
  });

  // Form State for Quick Add Table
  const [newTable, setNewTable] = useState({
    tableNumber: 'Table ' + (contextTables.length + 1).toString().padStart(2, '0'),
    seats: 4
  });

  // Handle Refresh Click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard metrics refreshed successfully', { id: 'refresh-toast' });
    }, 600);
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ==========================================
  // Sample & Context-Merged Data
  // ==========================================

  // Revenue Analytics Datasets
  const analyticsData = useMemo(() => {
    switch (timePeriod) {
      case 'today':
        return {
          revenue: '₹25,450',
          ordersCount: '128 orders',
          comparison: '+12.5% vs yesterday',
          labels: ['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
          values: [2200, 4800, 6100, 3200, 4100, 7200, 3850],
          maxVal: 8000
        };
      case 'week':
        return {
          revenue: '₹1,84,200',
          ordersCount: '894 orders',
          comparison: '+9.8% vs last week',
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [21000, 24500, 22000, 26800, 31400, 36500, 32000],
          maxVal: 40000
        };
      case 'month':
        return {
          revenue: '₹7,42,800',
          ordersCount: '3,620 orders',
          comparison: '+15.2% vs last month',
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          values: [168000, 192000, 184000, 198800],
          maxVal: 220000
        };
      case 'year':
        return {
          revenue: '₹84,50,000',
          ordersCount: '42,100 orders',
          comparison: '+22.4% vs last year',
          labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
          values: [620000, 690000, 710000, 742000, 810000, 878000],
          maxVal: 950000
        };
      default:
        return {
          revenue: '₹25,450',
          ordersCount: '128 orders',
          comparison: '+12.5%',
          labels: ['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
          values: [2200, 4800, 6100, 3200, 4100, 7200, 3850],
          maxVal: 8000
        };
    }
  }, [timePeriod]);

  // Order Overview Donut Data
  const orderBreakdown = [
    { label: 'Pending', count: 12, percent: '9%', color: '#F59E0B' },
    { label: 'Preparing', count: 24, percent: '19%', color: '#3B82F6' },
    { label: 'Ready', count: 18, percent: '14%', color: '#8B5CF6' },
    { label: 'Served', count: 32, percent: '25%', color: '#10B981' },
    { label: 'Completed', count: 38, percent: '30%', color: '#22C55E' },
    { label: 'Cancelled', count: 4, percent: '3%', color: '#EF4444' }
  ];
  const totalOrdersCount = 128;

  // Realistic Sample Orders
  const sampleOrdersList = [
    {
      id: 'SD1028',
      customer: 'Rahul Sharma',
      phone: '+91 98765 43210',
      table: 'Table 02',
      items: [
        { name: 'Butter Chicken', qty: 2, price: 380 },
        { name: 'Garlic Naan', qty: 4, price: 60 }
      ],
      amount: 1000,
      payment: 'Razorpay (UPI)',
      paymentStatus: 'Paid',
      status: 'Preparing',
      createdAt: '12 mins ago'
    },
    {
      id: 'SD1027',
      customer: 'Priya Patel',
      phone: '+91 98234 56789',
      table: 'Table 05',
      items: [
        { name: 'Paneer Tikka', qty: 1, price: 280 },
        { name: 'Dal Makhani', qty: 1, price: 260 }
      ],
      amount: 540,
      payment: 'Cash',
      paymentStatus: 'Pending',
      status: 'Pending',
      createdAt: '18 mins ago'
    },
    {
      id: 'SD1026',
      customer: 'Amit Verma',
      phone: '+91 97123 45678',
      table: 'Table 01',
      items: [
        { name: 'Deluxe Veg Thali', qty: 2, price: 350 },
        { name: 'Sweet Lassi', qty: 2, price: 90 }
      ],
      amount: 880,
      payment: 'Razorpay (Card)',
      paymentStatus: 'Paid',
      status: 'Ready',
      createdAt: '28 mins ago'
    },
    {
      id: 'SD1025',
      customer: 'Neha Gupta',
      phone: '+91 99876 54321',
      table: 'Table 04',
      items: [
        { name: 'Masala Dosa', qty: 2, price: 140 },
        { name: 'Cold Coffee', qty: 2, price: 120 }
      ],
      amount: 520,
      payment: 'Razorpay (UPI)',
      paymentStatus: 'Paid',
      status: 'Served',
      createdAt: '42 mins ago'
    },
    {
      id: 'SD1024',
      customer: 'Rajesh Kumar',
      phone: '+91 98456 78901',
      table: 'Table 06',
      items: [
        { name: 'Veg Dum Biryani', qty: 2, price: 260 },
        { name: 'Gulab Jamun', qty: 2, price: 80 }
      ],
      amount: 680,
      payment: 'Razorpay (NetBanking)',
      paymentStatus: 'Paid',
      status: 'Completed',
      createdAt: '1 hour ago'
    },
    {
      id: 'SD1023',
      customer: 'Ananya Singh',
      phone: '+91 97654 32109',
      table: 'Table 03',
      items: [
        { name: 'Paneer Pizza', qty: 1, price: 299 },
        { name: 'French Fries', qty: 1, price: 140 }
      ],
      amount: 439,
      payment: 'Cash',
      paymentStatus: 'Cancelled',
      status: 'Cancelled',
      createdAt: '2 hours ago'
    }
  ];

  // Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    return sampleOrdersList
      .filter(order => {
        // Status filter
        if (orderStatusFilter !== 'all' && order.status.toLowerCase() !== orderStatusFilter.toLowerCase()) {
          return false;
        }
        // Search query
        if (orderSearchQuery.trim()) {
          const query = orderSearchQuery.toLowerCase();
          const matchId = order.id.toLowerCase().includes(query);
          const matchCust = order.customer.toLowerCase().includes(query);
          const matchTable = order.table.toLowerCase().includes(query);
          if (!matchId && !matchCust && !matchTable) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (orderSortBy === 'amount-high') return b.amount - a.amount;
        if (orderSortBy === 'amount-low') return a.amount - b.amount;
        return 0; // default newest
      });
  }, [orderStatusFilter, orderSearchQuery, orderSortBy]);

  // Table Status Cards (Section 8)
  const restaurantTables = [
    { number: 'Table 01', seats: 4, status: 'Available', currentOrder: null, customer: null },
    { number: 'Table 02', seats: 4, status: 'Occupied', currentOrder: '#SD1028', customer: 'Rahul Sharma (35m)' },
    { number: 'Table 03', seats: 2, status: 'Reserved', currentOrder: null, customer: 'Dr. Rao (8:30 PM)' },
    { number: 'Table 04', seats: 6, status: 'Available', currentOrder: null, customer: null },
    { number: 'Table 05', seats: 4, status: 'Occupied', currentOrder: '#SD1027', customer: 'Priya Patel (15m)' },
    { number: 'Table 06', seats: 2, status: 'Available', currentOrder: null, customer: null }
  ];

  // Popular Menu Items (Section 9)
  const [popularItems, setPopularItems] = useState([
    {
      id: 1,
      name: 'Paneer Pizza',
      category: 'Italian',
      price: 299,
      ordersSold: 124,
      rating: 4.8,
      inStock: true,
      image: '/dishes/veg_pizza.jpg'
    },
    {
      id: 2,
      name: 'Paneer Butter Masala',
      category: 'North Indian',
      price: 320,
      ordersSold: 148,
      rating: 4.9,
      inStock: true,
      image: '/dishes/paneer_butter_masala.jpg'
    },
    {
      id: 3,
      name: 'Dal Makhani',
      category: 'North Indian',
      price: 260,
      ordersSold: 112,
      rating: 4.8,
      inStock: true,
      image: '/dishes/dal_makhani.jpg'
    },
    {
      id: 4,
      name: 'Deluxe Veg Thali',
      category: 'Special Thalis',
      price: 350,
      ordersSold: 96,
      rating: 4.9,
      inStock: true,
      image: '/dishes/deluxe_veg_thali.jpg'
    },
    {
      id: 5,
      name: 'Cold Coffee',
      category: 'Beverages',
      price: 140,
      ordersSold: 88,
      rating: 4.7,
      inStock: false,
      image: '/dishes/cold_coffee.jpg'
    }
  ]);

  // Toggle Item Availability
  const toggleStock = (itemId) => {
    setPopularItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, inStock: !item.inStock } : item
    ));
    toast.success('Menu item stock status updated', { id: 'stock-toggle' });
  };

  // Recent Notifications (Section 12)
  const recentNotifications = [
    {
      id: 1,
      type: 'order',
      title: 'New order #SD1024 received',
      desc: 'Table 06 • 3 items • ₹680',
      time: '5m ago',
      icon: ShoppingBag,
      iconColor: 'text-blue-500 bg-blue-50'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment completed for order #SD1021',
      desc: '₹1,240 received via UPI QR',
      time: '18m ago',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 bg-emerald-50'
    },
    {
      id: 3,
      type: 'reservation',
      title: 'Table 08 reservation confirmed',
      desc: 'Party of 4 guests for 9:00 PM',
      time: '45m ago',
      icon: QrCode,
      iconColor: 'text-purple-500 bg-purple-50'
    },
    {
      id: 4,
      type: 'stock',
      title: 'Low stock alert for Cold Coffee',
      desc: 'Only 3 units remaining in inventory',
      time: '1h ago',
      icon: AlertCircle,
      iconColor: 'text-amber-500 bg-amber-50'
    },
    {
      id: 5,
      type: 'review',
      title: 'New customer review received',
      desc: '5 stars: "Best Butter Paneer & fastest QR service!"',
      time: '2h ago',
      icon: Star,
      iconColor: 'text-yellow-500 bg-yellow-50'
    }
  ];

  // Quick Action: Save Food
  const handleSaveFood = (e) => {
    e.preventDefault();
    if (!newFood.name || !newFood.price) {
      toast.error('Please enter food name and price');
      return;
    }
    toast.success(`Dish "${newFood.name}" added to menu!`);
    setAddFoodModalOpen(false);
    setNewFood({
      name: '',
      category: 'Main Course',
      price: '',
      isVeg: true,
      description: '',
      isAvailable: true
    });
  };

  // Quick Action: Save Table
  const handleSaveTable = (e) => {
    e.preventDefault();
    toast.success(`Table "${newTable.tableNumber}" created!`);
    setAddTableModalOpen(false);
  };

  // Quick Action: Export Report
  const handleExportReport = (format) => {
    toast.success(`Generating ${format.toUpperCase()} report... Download started!`);
    setReportModalOpen(false);
  };

  // Navigation Links for Sidebar (Section 2)
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', active: true },
    { label: '🧠 SmartDine AI', icon: Sparkles, path: '/admin/ai', active: false, badge: 'AI Live' },
    { label: 'Orders', icon: ShoppingBag, path: '/admin/orders', active: false },
    { label: 'Menu Management', icon: UtensilsCrossed, path: '/admin/menu', active: false },
    { label: 'Table Management', icon: Grid, path: '/admin/tables', active: false },
    { label: 'Customers', icon: Users, path: '/admin/customers', active: false },
    { label: 'Staff Management', icon: UserCheck, path: '/admin/settings', active: false },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments', active: false },
    { label: 'Reports & Analytics', icon: BarChart3, path: '/admin/analytics', active: false },
    { label: 'Reviews & Feedback', icon: MessageSquare, path: '/admin/settings', active: false },
    { label: 'Notifications', icon: Bell, path: '/admin/notifications', active: false },
    { label: 'Settings', icon: Settings, path: '/admin/settings', active: false },
  ];

  // Render Status Badge
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
      case 'preparing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Preparing</span>;
      case 'ready':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Ready</span>;
      case 'served':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Served</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="admin-dashboard-container min-h-screen text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* ============================================================ */}
      {/* 1. RESTAURANT BACKGROUND IMAGE LAYER (FULL DASHBOARD)         */}
      {/* ============================================================ */}
      <div 
        className="admin-dashboard-bg-layer"
        style={{
          backgroundImage: `url('${currentBg}')`
        }}
      />
      <div className="admin-dashboard-overlay" />
      
      {/* ============================================================ */}
      {/* 2. SIDEBAR NAVIGATION (Desktop Fixed + Mobile Drawer)         */}
      {/* ============================================================ */}
      
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Top Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E8752A] to-[#F97316] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">SmartDine</h1>
                <p className="text-[11px] font-medium text-slate-400 italic">Restaurant Management</p>
              </div>
            </Link>
            
            {/* Close Button on Mobile Drawer */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${item.active 
                      ? 'bg-[#E8752A] text-white shadow-sm shadow-orange-500/30' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Admin Profile & Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-700">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser?.displayName || 'Sahil S. (Admin)'}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">Restaurant Manager</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200/70 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ============================================================ */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 relative z-10">

        {/* ============================================================ */}
        {/* 3. TOP HEADER                                                */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
          
          {/* Left Side: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Open navigation sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-800">Dashboard</span>
            </div>
          </div>

          {/* Right Side: Search + Notifications + Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, tables, dishes..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-60 lg:w-72 pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#E8752A] focus:ring-1 focus:ring-[#E8752A] bg-slate-50 transition"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Notifications</span>
                    <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">3 unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {recentNotifications.slice(0, 3).map(n => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${n.iconColor}`}>
                          <n.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link 
                      to="/admin/notifications" 
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-[#E8752A] hover:underline"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8752A] to-[#F97316] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">Restaurant Admin</p>
                  <p className="text-[10px] text-slate-400">SmartDine Manager</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.displayName || 'Admin Console'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'admin@smartdine.com'}</p>
                  </div>
                  <Link 
                    to="/admin/settings" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Restaurant Settings</span>
                  </Link>
                  <Link 
                    to="/kitchen" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Kitchen View</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ============================================================ */}
        {/* MAIN BODY CONTENT                                            */}
        {/* ============================================================ */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ============================================================ */}
          {/* 4. PAGE HEADER                                               */}
          {/* ============================================================ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
              <p className="text-sm text-slate-500 mt-0.5">Overview of your restaurant's performance and daily operations.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Today, September 1, 2026</span>
              </div>

              {/* Theme Wallpaper Selector */}
              <div className="relative">
                <button
                  onClick={() => setBgDropdownOpen(!bgDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 transition active:scale-95 cursor-pointer"
                  title="Change Restaurant Dashboard Background Image"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E8752A]" />
                  <span className="hidden sm:inline">Wallpaper</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {bgDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Restaurant Ambiance Wallpaper
                    </div>
                    {BACKGROUND_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectBg(opt.url)}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-orange-50 transition cursor-pointer ${
                          currentBg === opt.url ? 'text-[#E8752A] bg-orange-50/70 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{opt.name}</span>
                        {currentBg === opt.url && <CheckCircle2 className="w-3.5 h-3.5 text-[#E8752A]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. 5 KPI SUMMARY CARDS                                       */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Today's Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Today's Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E8752A] flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">₹25,450</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>12.5%</span>
                <span className="text-slate-400 font-normal">from yesterday</span>
              </div>
            </div>

            {/* Card 2: Today's Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Today's Orders</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">128</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>8.2%</span>
                <span className="text-slate-400 font-normal">from yesterday</span>
              </div>
            </div>

            {/* Card 3: Customers Today */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Customers Today</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">86</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>6.4%</span>
                <span className="text-slate-400 font-normal">from yesterday</span>
              </div>
            </div>

            {/* Card 4: Occupied Tables */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Occupied Tables</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Grid className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900">18</span>
                <span className="text-sm text-slate-400 font-medium">/ 30</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">60% occupancy</span>
                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            {/* Card 5: Pending Orders */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Orders</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-amber-600">12</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-[11px] font-semibold text-amber-700">Requires attention</span>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 5.1 SMARTDINE AI INTELLIGENCE WIDGET                          */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 rounded-2xl border border-orange-200/90 p-5 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-[#E8752A]/10 to-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E8752A] to-[#F97316] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Sparkles className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      🧠 SmartDine AI Intelligence
                    </h3>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-xs">
                      Predictive System Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Continuous real-time telemetry from kitchen queues, table velocity, and historical sales patterns.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/ai"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs font-bold transition"
                >
                  <span>Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                </Link>
                <button
                  onClick={() => {
                    setDashboardAiQuery('');
                    setDashboardAiOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#EA580C] text-white shadow-sm shadow-orange-500/20 text-xs font-bold transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>✨ Ask SmartDine AI</span>
                </button>
              </div>
            </div>

            {/* 4 Compact Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              
              {/* 1. Sales Forecast */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                  <span>Sales Forecast</span>
                  <span className="text-emerald-600 font-semibold lowercase">89% conf.</span>
                </div>
                <p className="text-lg font-black text-slate-900 mt-1">₹28K – ₹31K</p>
                <p className="text-xs text-slate-500 mt-0.5">Tomorrow's expected revenue (145–160 orders)</p>
                <Link to="/admin/ai" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8752A] hover:underline mt-2">
                  View curve <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* 2. Demand Alert */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                  <span>Demand Alert</span>
                  <span className="text-rose-600 font-semibold lowercase">🔥 high demand</span>
                </div>
                <p className="text-lg font-black text-slate-900 mt-1">Paneer Pizza +28%</p>
                <p className="text-xs text-slate-500 mt-0.5">58 orders forecasted tonight during dinner peak</p>
                <Link to="/admin/ai" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8752A] hover:underline mt-2">
                  Item velocity <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* 3. Inventory Alert */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                  <span>Inventory Alert</span>
                  <span className="text-amber-600 font-semibold lowercase">⚠️ critical</span>
                </div>
                <p className="text-lg font-black text-slate-900 mt-1">Paneer Stock Alert</p>
                <p className="text-xs text-rose-600 font-bold mt-0.5">May run out tomorrow at 8:00 PM</p>
                <Link to="/admin/ai" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8752A] hover:underline mt-2">
                  Restock 8 kg <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* 4. Business Insight */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                  <span>Business Insight</span>
                  <span className="text-emerald-600 font-semibold lowercase">📈 surge</span>
                </div>
                <p className="text-lg font-black text-slate-900 mt-1">Dinner Revenue +23%</p>
                <p className="text-xs text-slate-500 mt-0.5">Dinner currently accounts for 62% of gross profit</p>
                <Link to="/admin/ai" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8752A] hover:underline mt-2">
                  Insights matrix <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

            </div>

            {/* Bottom Quick-Ask Bar */}
            <div className="mt-4 pt-3.5 border-t border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-semibold text-slate-800">💡 Suggested Prompt:</span>
                <button
                  onClick={() => {
                    setDashboardAiQuery("How were today's sales?");
                    setDashboardAiOpen(true);
                  }}
                  className="text-left text-[#E8752A] hover:underline font-semibold"
                >
                  "How were today's sales?"
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => {
                    setDashboardAiQuery("Which ingredients need restocking?");
                    setDashboardAiOpen(true);
                  }}
                  className="hidden md:inline text-left text-[#E8752A] hover:underline font-semibold"
                >
                  "Which ingredients need restocking?"
                </button>
              </div>

              <button
                onClick={() => {
                  setDashboardAiQuery('');
                  setDashboardAiOpen(true);
                }}
                className="font-bold text-[#E8752A] hover:text-orange-700 flex items-center gap-1 shrink-0"
              >
                <span>✨ Ask SmartDine AI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5.2 AI BUSINESS INSIGHTS PROMINENT CARD                       */}
          {/* ============================================================ */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🧠 SmartDine AI Insights</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Live Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatic business insights generated from historical and live table orders
                </p>
              </div>

              <Link
                to="/admin/ai"
                className="text-xs font-bold text-[#E8752A] hover:underline flex items-center gap-1"
              >
                <span>Deep Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* Insight 1 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-base">💡</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      High Impact
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Dinner Orders Increased 23%</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Dinner orders increased by 23% this week, generating 62% of daily revenue with highest peak at 8:15 PM.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-700">
                  <span className="font-bold text-[#E8752A]">Action: </span>
                  Allocate 2 extra floor servers and pre-prep gravies between 5:30 PM and 7 PM.
                </div>
              </div>

              {/* Insight 2 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-base">💡</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      High Impact
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Friday & Saturday Revenue Peak</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Friday and Saturday generate 44% of total weekly revenue with table occupancy reaching 94%.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-700">
                  <span className="font-bold text-[#E8752A]">Action: </span>
                  Fast-track digital QR table bill payments to shorten table turnover time.
                </div>
              </div>

              {/* Insight 3 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-base">💡</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      High Impact
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Paneer Pizza is Best-Seller</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Paneer Pizza maintains 4.8⭐ average rating with 32% repeat customer order frequency.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-700">
                  <span className="font-bold text-[#E8752A]">Action: </span>
                  Promote Paneer Pizza + Cold Coffee Combo during dinner hours to boost AOV.
                </div>
              </div>

              {/* Insight 4 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-base">⚠️</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Medium Impact
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Cancellation Rate Increased 8%</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Cancellation rate spiked during 8:30 PM rush due to delayed kitchen queue preparation times.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-700">
                  <span className="font-bold text-[#E8752A]">Action: </span>
                  Streamline KOT queue batching and inform diners of 20-min wait times during rush.
                </div>
              </div>

              {/* Insight 5 */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-base">📈</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Medium Impact
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Customer Retention +12%</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Repeat dine-in visits improved by 12% across regular patrons using digital QR loyalty.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 text-[11px] text-slate-700">
                  <span className="font-bold text-[#E8752A]">Action: </span>
                  Launch automated 3rd-visit complimentary dessert coupon campaign.
                </div>
              </div>

              {/* Insight 6 (Interactive Prompt) */}
              <div className="p-3.5 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/60 to-amber-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#E8752A]">
                    <Sparkles className="w-4 h-4" />
                    <span>Ask AI for Custom Insight</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    Have questions about table turnover, peak hours, or inventory depletion?
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDashboardAiQuery("What will tomorrow's sales be?");
                    setDashboardAiOpen(true);
                  }}
                  className="mt-3 w-full py-2 bg-[#E8752A] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  ✨ Inquire AI Assistant
                </button>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* 6. MAIN ANALYTICS SECTION (Two Columns)                      */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Revenue Analytics (8 cols) */}
            <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revenue Analytics</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-xl font-bold text-slate-900">{analyticsData.revenue}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{analyticsData.ordersCount}</span>
                    <span className="text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                      {analyticsData.comparison}
                    </span>
                  </div>
                </div>

                {/* Period Filter Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 self-start sm:self-auto">
                  {['today', 'week', 'month', 'year'].map(p => (
                    <button
                      key={p}
                      onClick={() => setTimePeriod(p)}
                      className={`
                        px-3 py-1 rounded-md capitalize transition
                        ${timePeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}
                      `}
                    >
                      {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="h-60 w-full flex flex-col justify-end pt-4">
                <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2">
                  {analyticsData.values.map((val, idx) => {
                    const heightPercent = Math.round((val / analyticsData.maxVal) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
                          ₹{val.toLocaleString()}
                        </div>
                        {/* Bar */}
                        <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg h-44 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-gradient-to-t from-[#E8752A] to-[#F97316] rounded-t-lg transition-all duration-500 group-hover:from-orange-600 group-hover:to-orange-500"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        {/* Label */}
                        <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
                          {analyticsData.labels[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Order Overview Donut Chart (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution across all stages</p>
              </div>

              {/* Donut Chart Visual */}
              <div className="my-4 flex items-center justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Ring */}
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Multi-segment rings simulation */}
                    <path
                      stroke="#22C55E"
                      strokeWidth="4.2"
                      strokeDasharray="30, 100"
                      strokeDashoffset="0"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#10B981"
                      strokeWidth="4.2"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-30"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#3B82F6"
                      strokeWidth="4.2"
                      strokeDasharray="19, 100"
                      strokeDashoffset="-55"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#8B5CF6"
                      strokeWidth="4.2"
                      strokeDasharray="14, 100"
                      strokeDashoffset="-74"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#F59E0B"
                      strokeWidth="4.2"
                      strokeDasharray="9, 100"
                      strokeDashoffset="-88"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="#EF4444"
                      strokeWidth="4.2"
                      strokeDasharray="3, 100"
                      strokeDashoffset="-97"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-slate-900">{totalOrdersCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Orders</span>
                  </div>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                {orderBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 7. RECENT ORDERS (Full Width Table)                          */}
          {/* ============================================================ */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Table Header & Controls */}
            <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {filteredOrders.length} orders
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Live orders submitted via Table QR & Counter</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search in table */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter customer, order ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#E8752A] bg-slate-50 w-44"
                  />
                </div>

                {/* Status Dropdown */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Sort */}
                <select
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>

                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          #{order.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{order.customer}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{order.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {order.table}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {order.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{order.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 font-medium">{order.payment}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#E8752A] bg-orange-50 hover:bg-orange-100 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 8. RESTAURANT TABLE STATUS                                   */}
          {/* ============================================================ */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Table Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time occupancy and active dining sessions</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available (3)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Occupied (2)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Reserved (1)</span>
                </div>

                <Link
                  to="/admin/tables"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                >
                  View All Tables
                </Link>
              </div>
            </div>

            {/* Compact Table Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {restaurantTables.map((t) => {
                const isOccupied = t.status === 'Occupied';
                const isReserved = t.status === 'Reserved';
                return (
                  <div
                    key={t.number}
                    className={`
                      p-3.5 rounded-xl border transition flex flex-col justify-between
                      ${isOccupied 
                        ? 'bg-orange-50/40 border-orange-200' 
                        : isReserved 
                        ? 'bg-blue-50/40 border-blue-200' 
                        : 'bg-white border-slate-200/80 hover:border-slate-300'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">{t.number}</span>
                      <span className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${isOccupied 
                          ? 'bg-orange-100 text-orange-800' 
                          : isReserved 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-emerald-100 text-emerald-800'}
                      `}>
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-2">
                      <span>{t.seats} Seats</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 truncate">
                      {isOccupied ? (
                        <span className="font-medium text-orange-900 truncate block">
                          {t.customer}
                        </span>
                      ) : isReserved ? (
                        <span className="font-medium text-blue-900 truncate block">
                          {t.customer}
                        </span>
                      ) : (
                        <span className="text-slate-400">Ready for guests</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 9 & 10. POPULAR MENU ITEMS + CUSTOMER ACTIVITY (2 cols)      */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 9. Popular Menu Items (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Popular Menu Items</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top 5 best performing dishes by customer volume</p>
                </div>
                <Link
                  to="/admin/menu"
                  className="text-xs font-semibold text-[#E8752A] hover:underline"
                >
                  Manage Menu
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {popularItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {item.category} • <span className="font-semibold text-slate-800">₹{item.price}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>{item.ordersSold} orders</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {item.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleStock(item.id)}
                        className={`
                          px-2.5 py-1 rounded-full text-[10px] font-bold transition
                          ${item.inStock 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}
                        `}
                      >
                        {item.inStock ? 'In Stock' : 'Low / Out'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. Customer Activity (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Customer Activity</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Dine-in guest acquisition & retention</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    +18.4%
                  </span>
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">Total Customers</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">1,420</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">New Customers</span>
                    <p className="text-lg font-bold text-blue-600 mt-0.5">340</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">Returning Guests</span>
                    <p className="text-lg font-bold text-purple-600 mt-0.5">1,080</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">Repeat Rate</span>
                    <p className="text-lg font-bold text-emerald-600 mt-0.5">76.1%</p>
                  </div>
                </div>
              </div>

              {/* Weekly Activity Line / Sparkline Visual */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 mb-2 block">Weekly Guest Footfall</span>
                <div className="h-24 w-full flex items-end justify-between gap-2 px-1">
                  {[45, 62, 78, 85, 96, 124, 110].map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div 
                        className="w-full bg-slate-200 rounded-t group-hover:bg-[#E8752A] transition" 
                        style={{ height: `${(count / 130) * 100}%` }}
                      />
                      <span className="text-[9px] text-slate-400 font-medium">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 11. QUICK ACTIONS                                            */}
          {/* ============================================================ */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap items-center gap-3">
              
              <button
                onClick={() => setAddFoodModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#d9681f] text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Food Item</span>
              </button>

              <button
                onClick={() => setAddTableModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Table</span>
              </button>

              <Link
                to="/admin/orders"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>View Orders</span>
              </Link>

              <Link
                to="/admin/customers"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>View Customers</span>
              </Link>

              <button
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                <span>Generate Report</span>
              </button>

            </div>
          </div>

          {/* ============================================================ */}
          {/* 12 & 13. NOTIFICATIONS & REPORTS                             */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 12. Notifications (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Recent Notifications</h3>
                  <Link
                    to="/admin/notifications"
                    className="text-xs font-semibold text-[#E8752A] hover:underline"
                  >
                    View All Notifications
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentNotifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${item.iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{item.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 13. Reports & Insights (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reports & Insights</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Download or preview financial & sales summaries</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                
                {/* Report 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Daily Sales</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Today's hourly sales & GST</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleExportReport('Daily Sales')}
                      className="text-[11px] font-semibold text-[#E8752A] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <span className="text-[10px] text-slate-400">PDF / CSV</span>
                  </div>
                </div>

                {/* Report 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Weekly Sales</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">7-day performance breakdown</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleExportReport('Weekly Sales')}
                      className="text-[11px] font-semibold text-[#E8752A] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <span className="text-[10px] text-slate-400">PDF / CSV</span>
                  </div>
                </div>

                {/* Report 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Monthly Sales</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Monthly revenue & tax audit</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleExportReport('Monthly Sales')}
                      className="text-[11px] font-semibold text-[#E8752A] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <span className="text-[10px] text-slate-400">PDF / CSV</span>
                  </div>
                </div>

                {/* Report 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Popular Items</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dish velocity & profitability</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleExportReport('Popular Items')}
                      className="text-[11px] font-semibold text-[#E8752A] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <span className="text-[10px] text-slate-400">PDF / CSV</span>
                  </div>
                </div>

                {/* Report 5 */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Customer Report</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Frequency, spend & loyalty</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => handleExportReport('Customer Report')}
                      className="text-[11px] font-semibold text-[#E8752A] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <span className="text-[10px] text-slate-400">PDF / CSV</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL: ORDER DETAILS                                         */}
      {/* ============================================================ */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order #{selectedOrder.id}</h3>
                <p className="text-xs text-slate-500">{selectedOrder.createdAt} • {selectedOrder.table}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer Details</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrder.customer}</p>
                <p className="text-slate-500">{selectedOrder.phone}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Ordered Items</span>
                <div className="mt-2 divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{item.name} <span className="text-slate-400 font-normal">x{item.qty}</span></span>
                      <span className="font-bold text-slate-900">₹{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="font-bold text-slate-900">Total Amount:</span>
                <span className="font-extrabold text-[#E8752A] text-lg">₹{selectedOrder.amount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Payment: <strong className="text-slate-800">{selectedOrder.payment}</strong></span>
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  toast.success(`Printing kitchen KOT for #${selectedOrder.id}`);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-slate-200 transition"
              >
                Print KOT
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: QUICK ADD FOOD ITEM                                   */}
      {/* ============================================================ */}
      {addFoodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">+ Add Food Item</h3>
              <button onClick={() => setAddFoodModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Tikka Masala"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#E8752A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Special Thalis">Special Thalis</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="280"
                    value={newFood.price}
                    onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#E8752A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFood.isVeg}
                    onChange={(e) => setNewFood({ ...newFood, isVeg: e.target.checked })}
                    className="rounded text-[#E8752A] focus:ring-[#E8752A]"
                  />
                  <span className="font-semibold text-slate-700">Pure Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFood.isAvailable}
                    onChange={(e) => setNewFood({ ...newFood, isAvailable: e.target.checked })}
                    className="rounded text-[#E8752A] focus:ring-[#E8752A]"
                  />
                  <span className="font-semibold text-slate-700">In Stock</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddFoodModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#E8752A] text-white font-semibold hover:bg-[#d9681f]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: QUICK ADD TABLE                                       */}
      {/* ============================================================ */}
      {addTableModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">+ Add New Table</h3>
              <button onClick={() => setAddTableModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#E8752A]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Seating Capacity</label>
                <select
                  value={newTable.seats}
                  onChange={(e) => setNewTable({ ...newTable, seats: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value={2}>2 Seats (Couple)</option>
                  <option value={4}>4 Seats (Standard)</option>
                  <option value={6}>6 Seats (Family)</option>
                  <option value={8}>8 Seats (Group Banquet)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddTableModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: GENERATE REPORT                                       */}
      {/* ============================================================ */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Generate Report</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-500">Select report type and format to generate instant audit files.</p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleExportReport('Daily Sales Summary (PDF)')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#E8752A] hover:bg-orange-50/30 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800">Daily Sales Summary</p>
                    <p className="text-[11px] text-slate-400">Hourly revenue, discounts, tax</p>
                  </div>
                  <FileText className="w-4 h-4 text-[#E8752A]" />
                </button>

                <button
                  onClick={() => handleExportReport('Weekly Kitchen Performance (CSV)')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#E8752A] hover:bg-orange-50/30 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800">Kitchen KOT Speed</p>
                    <p className="text-[11px] text-slate-400">Prep time, turnaround, cancels</p>
                  </div>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  onClick={() => handleExportReport('Monthly Tax & GST Invoice Sheet (CSV)')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#E8752A] hover:bg-orange-50/30 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800">Tax & GST Audit Sheet</p>
                    <p className="text-[11px] text-slate-400">CGST 2.5% + SGST 2.5% breakup</p>
                  </div>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setReportModalOpen(false)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Interactive Ask SmartDine AI Assistant */}
      <AskSmartDineAI
        isOpen={dashboardAiOpen}
        onClose={() => setDashboardAiOpen(false)}
        defaultQuery={dashboardAiQuery}
      />

    </div>
  );
}
