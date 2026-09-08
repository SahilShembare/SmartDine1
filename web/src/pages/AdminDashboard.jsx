import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import {
  IndianRupee,
  ShoppingBag,
  Grid,
  Flame,
  UtensilsCrossed,
  CreditCard,
  QrCode,
  RefreshCw,
  Search,
  ArrowRight,
  Calendar,
  ChevronRight,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { 
    orders = [], 
    tables = [], 
    menuItems = [],
    refreshOrders 
  } = useTableOrder();
  const navigate = useNavigate();

  // Search & Filter for Recent Orders Table
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle Refresh Click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshOrders) {
      await refreshOrders();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Dashboard synced with live orders', { id: 'refresh-sync' });
    }, 400);
  };

  // ==========================================
  // 1. CORE OPERATIONAL METRICS
  // ==========================================

  // Total Paid Revenue Today
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => {
        const p = String(o.paymentStatus || '').toLowerCase();
        return p === 'paid' || p === 'cash paid' || p === 'online paid' || !!o.paidAt;
      })
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [orders]);

  // Active (Uncompleted & Uncancelled) Orders
  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      const s = String(o.status || '').toLowerCase().trim();
      return s !== 'completed' && s !== 'cancelled';
    });
  }, [orders]);

  // Completed Orders Count
  const completedCount = useMemo(() => {
    return orders.filter(o => String(o.status || '').toLowerCase().trim() === 'completed').length;
  }, [orders]);

  // Kitchen Preparation Queue Count (Pending + Cooking)
  const kitchenQueueCount = useMemo(() => {
    return orders.filter(o => {
      const s = String(o.status || '').toLowerCase().trim();
      return s === 'pending' || s === 'placed' || s === 'preparing' || s === 'accepted';
    }).length;
  }, [orders]);

  // Table Occupancy Map
  const occupiedTableSet = useMemo(() => {
    const set = new Set();
    activeOrders.forEach(o => {
      if (o.tableNumber) {
        set.add(String(o.tableNumber).padStart(2, '0'));
      }
    });
    return set;
  }, [activeOrders]);

  const billRequestedTableSet = useMemo(() => {
    const set = new Set();
    activeOrders.forEach(o => {
      const s = String(o.status || '').toLowerCase().trim();
      const p = String(o.paymentStatus || '').toLowerCase().trim();
      if (s === 'bill requested' || p === 'bill requested' || p === 'cash payment requested') {
        if (o.tableNumber) {
          set.add(String(o.tableNumber).padStart(2, '0'));
        }
      }
    });
    return set;
  }, [activeOrders]);

  const totalTablesCount = Math.max(25, tables.length);
  const occupiedCount = occupiedTableSet.size;
  const occupancyPercent = Math.round((occupiedCount / totalTablesCount) * 100);

  // ==========================================
  // 2. RECENT ORDERS (FILTERED & SORTED)
  // ==========================================
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const s = String(order.status || '').toLowerCase().trim();

      // Status filter
      if (statusFilter === 'active') {
        if (s === 'completed' || s === 'cancelled') return false;
      } else if (statusFilter === 'completed') {
        if (s !== 'completed') return false;
      }

      // Search query (Table, ID, Customer)
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const matchesTable = String(order.tableNumber || '').includes(q) || `table ${order.tableNumber}`.toLowerCase().includes(q);
        const matchesId = String(order.id || '').toLowerCase().includes(q);
        const matchesCustomer = String(order.customerName || '').toLowerCase().includes(q);
        if (!matchesTable && !matchesId && !matchesCustomer) return false;
      }

      return true;
    }).slice(0, 10); // Show top 10 most recent orders
  }, [orders, statusFilter, orderSearch]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    switch (s) {
      case 'pending':
      case 'placed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">New Order</span>;
      case 'preparing':
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">Cooking</span>;
      case 'ready':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Ready to Serve</span>;
      case 'served':
      case 'enjoying_meal':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">Served (Dining)</span>;
      case 'bill requested':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">Bill Requested</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Standard Unified Admin Sidebar */}
      <Sidebar mode="admin" />

      {/* Main Clean Content Area */}
      <main className="flex-1 p-5 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        {/* ============================================================ */}
        {/* 1. SIMPLE HEADER                                             */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                Restaurant Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wide">
                Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Welcome back, <span className="font-bold text-slate-200">{currentUser?.displayName || 'Sahil (Admin)'}</span> • Real-time overview of orders & tables.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Today Date Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Sync Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Refresh orders and table status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. 4 ESSENTIAL KPI CARDS (Simple & Direct)                   */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Today's Revenue */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              From settled customer orders
            </p>
          </div>

          {/* 2. Total Orders */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Orders</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {orders.length}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-orange-400 font-bold">{activeOrders.length} active</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{completedCount} completed</span>
            </div>
          </div>

          {/* 3. Table Occupancy */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Table Occupancy</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Grid className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {occupiedCount}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ {totalTablesCount} Tables</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">{occupancyPercent}% occupied</span>
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. Active Kitchen Queue */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kitchen Queue</span>
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {kitchenQueueCount}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-amber-300 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Pending / In cooking right now</span>
            </p>
          </div>

        </div>

        {/* ============================================================ */}
        {/* 3. QUICK MANAGEMENT SHORTCUTS (4 Clean Cards)               */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            to="/admin/orders"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 group-hover:bg-orange-500/30 text-orange-400 flex items-center justify-center transition">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition">Live Orders</h4>
                <p className="text-[11px] text-slate-400">Accept & track tickets</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/admin/tables"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 text-purple-400 flex items-center justify-center transition">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition">Tables & QR</h4>
                <p className="text-[11px] text-slate-400">25 Tables & QR standees</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/admin/menu"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 text-blue-400 flex items-center justify-center transition">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition">Menu Dishes</h4>
                <p className="text-[11px] text-slate-400">{menuItems.length} items listed</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/admin/payments"
            className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition group flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">Billing & Payments</h4>
                <p className="text-[11px] text-slate-400">Cash & online ledger</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </Link>

        </div>

        {/* ============================================================ */}
        {/* 4. RESTAURANT FLOOR TABLES SNAPSHOT (Tables 01 to 25)        */}
        {/* ============================================================ */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-orange-400" />
                <span>Live Table Occupancy (25 Tables)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time dining floor view across all restaurant tables
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Free ({totalTablesCount - occupiedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-400">Dining ({occupiedCount})</span>
              </div>
              <Link to="/admin/tables" className="text-xs font-bold text-orange-400 hover:underline ml-2">
                Manage Floor →
              </Link>
            </div>
          </div>

          {/* Quick Tables Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2 pt-1">
            {Array.from({ length: 25 }, (_, i) => {
              const tableNum = String(i + 1).padStart(2, '0');
              const isOccupied = occupiedTableSet.has(tableNum);
              const isBillReq = billRequestedTableSet.has(tableNum);

              return (
                <Link
                  key={tableNum}
                  to="/admin/tables"
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    isBillReq 
                      ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-sm' 
                      : isOccupied 
                      ? 'bg-orange-950/30 border-orange-500/70 text-orange-300 font-black shadow-sm' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                  title={`Table ${tableNum}: ${isOccupied ? 'Occupied with dining guests' : 'Available'}`}
                >
                  <span className="text-[10px] font-bold block uppercase text-slate-500">T</span>
                  <span className="text-sm font-black">{tableNum}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. RECENT ORDERS TABLE (Simple & Clean)                      */}
        {/* ============================================================ */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          
          {/* Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <span>Recent Customer Orders</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest orders received from customer table QR scans
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filter Pills */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'active' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({activeOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter Table / ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition w-44"
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-1">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No orders found</p>
              <p>Customer orders placed via QR codes will appear here in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Dishes</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Kitchen Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOrders.map((order) => {
                    const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid' || !!order.paidAt;
                    return (
                      <tr key={order.id} className="hover:bg-slate-900/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                          #{String(order.id).slice(-6).toUpperCase()}
                          <div className="text-[10px] text-slate-500 font-sans font-normal">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-black border border-orange-500/30">
                            Table {order.tableNumber || '01'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="truncate text-slate-200">
                            {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {order.items?.length || 0} item(s)
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          ₹{order.total?.toFixed(0) || '0'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                            isPaid 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* View All Orders Link */}
          <div className="pt-2 text-center border-t border-slate-800/60">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
            >
              <span>View all orders in Live Orders console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </main>
    </div>
  );
}
