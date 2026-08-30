import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { localStore } from '../firebase/config';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  UtensilsCrossed, 
  QrCode, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Banknote,
  Check,
  CreditCard,
  Layers,
  Filter,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Search,
  Users,
  Flame,
  Star,
  Eye,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  RefreshCw,
  BellRing,
  Download,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    orders, 
    menuItems, 
    tables, 
    categories, 
    setOrders, 
    setMenuItems, 
    setTables, 
    setCategories,
    getCombinedTableBill,
    markTableAsPaidByAdmin
  } = useTableOrder();

  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'inkitchen'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to check if an order is paid
  const isOrderPaid = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || '').trim().toLowerCase();
    if (p === 'unpaid' || p === 'pending' || p.includes('requested') || p.includes('awaiting')) {
      return false;
    }
    if (p === 'paid' || p === 'cash paid' || p === 'online paid') {
      return true;
    }
    return !!o.paidAt && !!o.transactionId && !o.transactionId.startsWith('PENDING');
  };

  // Real-time financial calculations
  const paidOrdersList = orders.filter(o => isOrderPaid(o) && o.status !== 'cancelled');
  const pendingOrdersList = orders.filter(o => !isOrderPaid(o) && o.status !== 'cancelled');
  
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.total || 0) : 0), 0);
  const paidRevenue = paidOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = pendingOrdersList.reduce((sum, o) => sum + (o.total || 0), 0);

  // Cash vs Online Revenue Breakup
  const onlineRevenue = paidOrdersList
    .filter(o => !String(o.paymentMethod || '').toLowerCase().includes('cash'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cashRevenue = paidOrdersList
    .filter(o => String(o.paymentMethod || '').toLowerCase().includes('cash'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'placed');
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'accepted');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const activeKitchenCount = pendingOrders.length + preparingOrders.length + readyOrders.length;
  const aov = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Active tables with unpaid bills
  const activeUnpaidTableNumbers = Array.from(new Set(
    orders
      .filter(o => !isOrderPaid(o) && o.status !== 'cancelled' && o.tableNumber)
      .map(o => String(o.tableNumber).padStart(2, '0'))
  ));

  const activeTableBills = activeUnpaidTableNumbers.map(tNum => getCombinedTableBill(tNum));
  const billRequestedCount = activeTableBills.filter(b => 
    b.billStatus === 'Bill Requested' || 
    b.billStatus === 'Cash Payment Requested' ||
    b.activeOrders?.some(o => 
      String(o.paymentStatus || '').toLowerCase().includes('cash') || 
      String(o.paymentStatus || '').toLowerCase().includes('requested')
    )
  ).length;

  // Real table occupancy calculation
  const occupancyPercentage = tables.length > 0 ? Math.round((activeTableBills.length / tables.length) * 100) : 0;

  // Top Selling Dishes in Real Time
  const topSellingDishes = useMemo(() => {
    const dishCountMap = new Map();
    orders.forEach(order => {
      if (Array.isArray(order.items) && order.status !== 'cancelled') {
        order.items.forEach(item => {
          const key = item.name;
          const current = dishCountMap.get(key) || { name: item.name, quantity: 0, revenue: 0, isVeg: item.isVeg !== false };
          current.quantity += (item.quantity || 1);
          current.revenue += (item.price * (item.quantity || 1));
          dishCountMap.set(key, current);
        });
      }
    });
    return Array.from(dishCountMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [orders]);

  // Refresh live database data
  const handleLiveRefresh = () => {
    setIsRefreshing(true);
    const latestOrders = localStore.getOrders();
    setOrders([...latestOrders]);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Live database synchronized!', { icon: '🔄' });
    }, 400);
  };

  // Export Daily Sales Report (CSV)
  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error('No orders available to export.');
      return;
    }

    const headers = ['Order ID', 'Table', 'Customer Name', 'Phone', 'Items', 'Total Amount', 'Kitchen Status', 'Payment Status', 'Payment Method', 'Txn ID', 'Date Time'];
    const rows = orders.map(o => [
      o.id,
      `Table ${o.tableNumber}`,
      `"${o.customerName || 'Guest'}"`,
      `"${o.customerPhone || 'N/A'}"`,
      `"${o.items?.map(i => `${i.quantity}x ${i.name}`).join('; ') || ''}"`,
      o.total || 0,
      o.status || 'placed',
      isOrderPaid(o) ? 'Paid' : (o.paymentStatus || 'Pending'),
      `"${o.paymentMethod || (isOrderPaid(o) ? 'Online' : 'Dine-In')}"`,
      `"${o.transactionId || 'N/A'}"`,
      `"${o.createdAt || new Date().toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartDine_Daily_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Daily Sales CSV Report downloaded! 📊', { icon: '📊' });
  };

  // Clear completed orders (End of Day close)
  const handleClearCompleted = () => {
    if (confirm('Are you sure you want to clear completed & settled orders for a fresh dining shift? Unpaid orders will remain active.')) {
      const remaining = orders.filter(o => !isOrderPaid(o) || o.status !== 'completed');
      setOrders(remaining);
      toast.success('Settled orders archived for today!');
    }
  };

  // Filtered & Searched Orders for Ledger Table
  const filteredOrders = orders.filter(o => {
    const isPaid = isOrderPaid(o);
    const inKitchen = ['pending', 'placed', 'preparing', 'accepted', 'ready'].includes(o.status);

    if (paymentFilter === 'pending' && isPaid) return false;
    if (paymentFilter === 'paid' && !isPaid) return false;
    if (paymentFilter === 'inkitchen' && !inKitchen) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchTable = String(o.tableNumber).toLowerCase().includes(q);
      const matchCustomer = String(o.customerName || '').toLowerCase().includes(q);
      const matchPhone = String(o.customerPhone || '').toLowerCase().includes(q);
      const matchItems = o.items?.some(i => i.name.toLowerCase().includes(q));
      return matchId || matchTable || matchCustomer || matchPhone || matchItems;
    }

    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 font-sans text-slate-100">
      <Sidebar mode="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* REAL-TIME COMMAND HEADER */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Restaurant Operations & Cashier Console</span>
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
                {billRequestedCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 animate-bounce shadow-md">
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{billRequestedCount} Bill Requests Waiting!</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Live dining tables, cashier collection, real-time kitchen queue & financial ledger
              </p>
            </div>

            {/* Real Operational Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleLiveRefresh}
                title="Sync Live Orders & Table Bills"
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Live Data</span>
              </button>

              <button
                onClick={handleExportCsv}
                title="Export Daily Sales Data to CSV Spreadsheet"
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Report (.CSV)</span>
              </button>

              <Link
                to="/kitchen"
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-lg shadow-orange-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Kitchen Display ({activeKitchenCount})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 6 FINANCIAL & PERFORMANCE KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* 1. Collected Revenue (Paid) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg relative overflow-hidden group hover:border-emerald-500 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Total Collected</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl lg:text-2xl font-black text-white">₹{paidRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                {paidOrdersList.length} Orders Settled
              </div>
            </div>
          </div>

          {/* 2. Online vs Cash Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/40 shadow-lg relative overflow-hidden group hover:border-blue-500 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">Online vs Cash</span>
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 space-y-0.5 text-[11px]">
              <div className="flex justify-between font-bold text-slate-200">
                <span>Online (UPI/Card):</span>
                <span className="text-emerald-400">₹{onlineRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200">
                <span>Cash Counter:</span>
                <span className="text-amber-400">₹{cashRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 3. Pending Receivables */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-lg relative overflow-hidden group hover:border-amber-500 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Pending Bill</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl lg:text-2xl font-black text-amber-300">₹{pendingRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                {activeTableBills.length} Dining Tables Active
              </div>
            </div>
          </div>

          {/* 4. Dining Room Occupancy */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Occupancy</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl lg:text-2xl font-black text-white">{activeTableBills.length} / {tables.length}</div>
              <div className="text-[11px] text-orange-400 font-semibold mt-0.5">
                {occupancyPercentage}% Tables Busy
              </div>
            </div>
          </div>

          {/* 5. Kitchen Queue Active */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Kitchen Queue</span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl lg:text-2xl font-black text-purple-300">{activeKitchenCount}</div>
              <div className="text-[11px] text-purple-400 font-semibold mt-0.5">
                {preparingOrders.length} Cooking • {readyOrders.length} Ready
              </div>
            </div>
          </div>

          {/* 6. Average Order Value (AOV) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avg Order (AOV)</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl lg:text-2xl font-black text-white">₹{aov}</div>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Across {orders.length} Orders
              </div>
            </div>
          </div>

        </div>

        {/* DINING ROOM REAL FLOOR MAP & BILLING SESSIONS */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-400" />
                <span>Dining Room Live Table Floor Map ({tables.length} Tables)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time dining table status, live orders, bill requests & 1-tap settlement
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Vacant</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Dining (Unpaid)</span>
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span>Bill Requested</span>
              </span>
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((tbl) => {
              const formatted = String(tbl.number).padStart(2, '0');
              const isOccupied = activeUnpaidTableNumbers.includes(formatted);
              const bill = isOccupied ? getCombinedTableBill(formatted) : null;
              const isCashRequested = bill?.activeOrders?.some(o => o.paymentStatus === 'Cash Payment Requested' || o.paymentMethod?.includes('Cash'));
              const isBillRequested = bill?.billStatus === 'Bill Requested' || isCashRequested;

              return (
                <div
                  key={tbl.id || tbl.number}
                  className={`rounded-2xl p-4 border transition-all space-y-3 relative overflow-hidden flex flex-col justify-between ${
                    isCashRequested
                      ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/50 animate-pulse'
                      : isBillRequested
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/50'
                      : isOccupied
                      ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Top Table Badge & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          isCashRequested
                            ? 'bg-emerald-500 text-slate-950'
                            : isBillRequested
                            ? 'bg-amber-500 text-slate-950'
                            : isOccupied
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Table {formatted}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{tbl.seats || 4} Seats</span>
                      </div>

                      {isOccupied ? (
                        <div className="text-xs text-slate-300 font-bold mt-1.5 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bill.orderCount} Orders Active ({bill.consolidatedItems.length} Dishes)</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 mt-1.5">Available for Seating</div>
                      )}
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isCashRequested
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-bounce'
                        : isBillRequested
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                        : isOccupied
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {isCashRequested ? '💵 Collect Cash' : isBillRequested ? '🛎️ Bill Request' : isOccupied ? 'Dining' : 'Vacant'}
                    </span>
                  </div>

                  {/* Financial Overview for Table */}
                  {isOccupied ? (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>₹{bill.subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>GST (5%)</span>
                        <span>₹{bill.tax.toFixed(0)}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800 flex justify-between font-black text-white text-sm">
                        <span>Payable Bill</span>
                        <span className="text-orange-400 text-base font-black">₹{bill.total.toFixed(0)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 text-center text-xs text-slate-600 font-medium">
                      Table ready for guest scan
                    </div>
                  )}

                  {/* Action Buttons for Table */}
                  <div className="flex items-center gap-2 pt-1">
                    {isOccupied ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            markTableAsPaidByAdmin(formatted, 'Cash (Collected by Cashier)');
                            toast.success(`💰 Cash ₹${bill.total.toFixed(0)} collected for Table ${formatted} & Settled!`, {
                              icon: '💵',
                              duration: 4000
                            });
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCashRequested
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20 shadow-lg'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{isCashRequested ? `Collect ₹${bill.total.toFixed(0)}` : 'Accept Cash'}</span>
                        </button>

                        <a
                          href={`/bill?table=${formatted}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1"
                          title="Open Customer Live Bill"
                        >
                          <span>Bill</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    ) : (
                      <a
                        href={`/menu?table=${formatted}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs text-center border border-slate-700/60 transition"
                      >
                        Open Menu QR
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-COLUMN SECTION: LIVE KITCHEN FUNNEL + TOP DISHES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left: Kitchen Pipeline Funnel (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-400" />
                  <span>Live Kitchen Order Pipeline</span>
                </h3>
                <p className="text-xs text-slate-400">Order stages across kitchen stations</p>
              </div>
              <Link
                to="/kitchen"
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <span>Full Kitchen Display</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <span className="text-2xl font-black text-amber-300">{pendingOrders.length}</span>
                <p className="text-xs font-bold text-amber-400">New Placed</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                <span className="text-2xl font-black text-blue-300">{preparingOrders.length}</span>
                <p className="text-xs font-bold text-blue-400">Cooking Now</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-2xl font-black text-emerald-300">{readyOrders.length}</span>
                <p className="text-xs font-bold text-emerald-400">Ready to Serve</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center space-y-1">
                <span className="text-2xl font-black text-slate-300">{completedOrders.length}</span>
                <p className="text-xs font-bold text-slate-400">Served / Settled</p>
              </div>
            </div>
          </div>

          {/* Right: Top Selling Delicacies (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span>Top Selling Delicacies</span>
                </h3>
                <p className="text-xs text-slate-400">Bestseller dishes by customer volume</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Leaderboard</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {topSellingDishes.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No orders placed yet to rank delicacies.
                </div>
              ) : (
                topSellingDishes.map((dish, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-[11px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span>{dish.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{dish.quantity} portions served</span>
                      </div>
                    </div>

                    <span className="font-black text-orange-400 shrink-0">
                      ₹{dish.revenue.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* DETAILED ORDERS & PAYMENT LEDGER WITH SEARCH & MULTI-FILTER */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <span>Live Orders & Payment Settlement Ledger</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect which customer payments are Pending vs Paid with complete audit trail
              </p>
            </div>

            {/* Search, Filter Controls & Archiving */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              
              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order, table, guest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paymentFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({orders.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    paymentFilter === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Pending ({pendingOrdersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    paymentFilter === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Paid ({paidOrdersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentFilter('inkitchen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    paymentFilter === 'inkitchen'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-purple-400/80 hover:text-purple-300'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>In Kitchen ({activeKitchenCount})</span>
                </button>
              </div>

              {/* End of Shift Clear */}
              <button
                type="button"
                onClick={handleClearCompleted}
                title="Archive settled orders at end of shift"
                className="p-2 rounded-xl bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Table</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Dishes Ordered</th>
                  <th className="px-4 py-3.5">Bill Total</th>
                  <th className="px-4 py-3.5">Kitchen Status</th>
                  <th className="px-4 py-3.5">Payment Status</th>
                  <th className="px-4 py-3.5">Mode / Transaction</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-xs text-slate-500 space-y-2">
                      <Receipt className="w-8 h-8 text-slate-700 mx-auto" />
                      <p>No orders found matching the filter criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const paid = isOrderPaid(order);

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                            Table {order.tableNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          <div className="font-bold text-xs">{order.customerName || 'Dine-In Guest'}</div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs max-w-[220px]">
                          <div className="truncate font-medium">
                            {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-black text-slate-100">
                          ₹{order.total?.toFixed(0)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            order.status === 'preparing' || order.status === 'accepted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            order.status === 'completed' ? 'bg-slate-800 text-slate-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {paid ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{order.paymentMethod?.includes('Cash') ? 'PAID (CASH)' : 'PAID (ONLINE)'}</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                              order.paymentStatus === 'Cash Payment Requested'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-bounce'
                                : order.paymentStatus === 'Bill Requested'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.paymentStatus === 'Cash Payment Requested' ? (
                                <>
                                  <Banknote className="w-3 h-3 text-emerald-400" />
                                  <span>COLLECT CASH</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>{order.paymentStatus === 'Bill Requested' ? 'BILL REQUESTED' : 'PENDING'}</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">
                          <div className="font-bold text-[11px] text-slate-200">
                            {order.paymentMethod || (paid ? 'Online Verified' : 'Dine-In Billing')}
                          </div>
                          {order.transactionId && (
                            <div className="text-[10px] font-mono text-emerald-400">{order.transactionId}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!paid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  markTableAsPaidByAdmin(order.tableNumber, 'Cash (Collected by Cashier)');
                                  toast.success(`💰 Cash ₹${order.total?.toFixed(0)} received for Table ${order.tableNumber}!`, { icon: '💵' });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <Banknote className="w-3 h-3" />
                                <span>Collect Cash</span>
                              </button>
                            ) : null}

                            <a
                              href={`/bill?table=${order.tableNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
                              title="View Customer Bill Receipt"
                            >
                              <span>Receipt</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
