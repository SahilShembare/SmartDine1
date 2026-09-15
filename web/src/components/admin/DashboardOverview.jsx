import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  IndianRupee, 
  Grid3X3, 
  PlusCircle, 
  ArrowRight, 
  Utensils, 
  CheckCircle2, 
  XCircle, 
  ChefHat, 
  Coffee,
  Check,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';

export default function DashboardOverview({ 
  onNavigateTab, 
  onOpenAddMenuItem 
}) {
  const { 
    orders = [], 
    tables = [], 
    updateOrderStatus,
    updateTableStatus 
  } = useTableOrder();

  const [selectedTableModal, setSelectedTableModal] = useState(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // =========================================================================
  // 1. FOUR SIMPLE SUMMARY CARDS
  // =========================================================================
  const totalOrdersCount = orders.length;

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => String(o.status || '').toLowerCase() === 'pending').length;
  }, [orders]);

  const todaySales = useMemo(() => {
    return orders
      .filter(o => {
        const p = String(o.paymentStatus || '').toLowerCase();
        const s = String(o.status || '').toLowerCase();
        return (p === 'paid' || !!o.paidAt) && s !== 'cancelled';
      })
      .reduce((sum, o) => sum + (Number(o.amount || o.total) || 0), 0);
  }, [orders]);

  // Total Tables & Available Tables
  const totalTables = tables.length || 25;
  const occupiedTableNumbers = useMemo(() => {
    const set = new Set();
    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      if (s !== 'completed' && s !== 'served' && s !== 'cancelled' && o.tableNumber) {
        set.add(String(o.tableNumber).padStart(2, '0'));
      }
    });
    return set;
  }, [orders]);

  const availableTablesCount = useMemo(() => {
    return tables.filter(t => {
      const num = String(t.tableNumber).padStart(2, '0');
      const isExplicitOccupied = t.status === 'Occupied' || t.status === 'Waiting';
      return !occupiedTableNumbers.has(num) && !isExplicitOccupied;
    }).length;
  }, [tables, occupiedTableNumbers]);

  // =========================================================================
  // 2. RECENT ORDERS (Table)
  // =========================================================================
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 7);
  }, [orders]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Received (In Queue)
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Cooking in Kitchen
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ready to Serve
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Served
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} updated to ${newStatus}`);
  };

  const formatOrderTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  // Format Items list summary
  const formatItemsSummary = (items) => {
    if (!items || !items.length) return '1 item';
    if (items.length <= 2) {
      return items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    }
    return `${items[0].quantity}x ${items[0].name}, ${items[1].quantity}x ${items[1].name} +${items.length - 2} more`;
  };

  // =========================================================================
  // 3. TABLE STATUS (Grid)
  // =========================================================================
  const getTableEffectiveStatus = (tbl) => {
    const num = String(tbl.tableNumber).padStart(2, '0');
    if (occupiedTableNumbers.has(num)) return 'Occupied';
    if (tbl.status === 'Occupied') return 'Occupied';
    if (tbl.status === 'Waiting') return 'Waiting';
    return 'Available';
  };

  const getTableColorClasses = (status) => {
    switch (status) {
      case 'Available':
        return 'border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:border-emerald-400';
      case 'Occupied':
        return 'border-rose-200 bg-rose-50/40 text-rose-800 hover:border-rose-400';
      case 'Waiting':
        return 'border-amber-200 bg-amber-50/40 text-amber-800 hover:border-amber-400';
      default:
        return 'border-slate-200 bg-white text-slate-700';
    }
  };

  const getTableStatusDot = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'Occupied':
        return 'bg-rose-500';
      case 'Waiting':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ============================================================ */}
      {/* 1. DASHBOARD OVERVIEW: ONLY 4 SIMPLE SUMMARY CARDS           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {totalOrdersCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Today's total orders
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Orders
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pendingOrdersCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-bold tracking-tight ${
              pendingOrdersCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {pendingOrdersCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Orders waiting for action
            </p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              ₹{todaySales.toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total revenue today
            </p>
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Tables
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {availableTablesCount} <span className="text-base font-normal text-slate-400">/ {totalTables}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Currently free tables
            </p>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. QUICK ACTIONS: ONLY THREE BUTTONS                         */}
      {/* ============================================================ */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">
              Frequently accessed administrative tasks
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* 1. Add Menu Item */}
            <button
              type="button"
              onClick={() => onOpenAddMenuItem ? onOpenAddMenuItem() : onNavigateTab('menu')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>

            {/* 2. Manage Tables */}
            <button
              type="button"
              onClick={() => onNavigateTab('tables')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Grid3X3 className="w-4 h-4 text-emerald-600" />
              <span>Manage Tables</span>
            </button>

            {/* 3. Kitchen Updates */}
            <button
              type="button"
              onClick={() => onNavigateTab('kitchen')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-orange-600" />
              <span>Kitchen Updates</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LIVE KITCHEN UPDATES TABLE                                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900">
                Live Kitchen Updates
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live dining tickets and cooking status across restaurant tables
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('kitchen')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Kitchen Monitor</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Table</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Dishes in Prep</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Order Time</th>
                <th className="px-4 py-3.5">Kitchen Status</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No orders placed today yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const currentStatus = String(order.status || 'pending').toLowerCase();
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {order.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {order.tableNumber ? `Table ${order.tableNumber}` : 'Online'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {order.customerName || 'Guest'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={formatItemsSummary(order.items)}>
                        {formatItemsSummary(order.items)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ₹{Number(order.amount || order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatOrderTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderModal(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TABLE STATUS: SIMPLE VISUAL SECTION                       */}
      {/* ============================================================ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Table Status
            </h2>
            <p className="text-xs text-slate-500">
              Live floor overview of restaurant tables
            </p>
          </div>

          {/* Status Color Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
              <span className="text-slate-700">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
              <span className="text-slate-700">Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
              <span className="text-slate-700">Waiting</span>
            </div>
          </div>
        </div>

        {/* Visual Table Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {tables.slice(0, 24).map((tbl) => {
            const numStr = String(tbl.tableNumber).padStart(2, '0');
            const status = getTableEffectiveStatus(tbl);
            const activeOrder = orders.find(o => 
              String(o.tableNumber).padStart(2, '0') === numStr && 
              o.status !== 'completed' && 
              o.status !== 'served' && 
              o.status !== 'cancelled'
            );

            return (
              <div
                key={tbl.id || numStr}
                onClick={() => setSelectedTableModal({ table: tbl, status, activeOrder })}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between aspect-square ${getTableColorClasses(status)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    T-{numStr}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${getTableStatusDot(status)}`} />
                </div>

                <div className="mt-auto">
                  <span className="text-[11px] font-bold block truncate">
                    {status}
                  </span>
                  {activeOrder ? (
                    <span className="text-[10px] text-slate-500 block truncate">
                      ₹{activeOrder.amount || activeOrder.total}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {tbl.capacity || 4} Seats
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Table Detail Modal */}
      {selectedTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Table {String(selectedTableModal.table.tableNumber).padStart(2, '0')}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTableModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-900">{selectedTableModal.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Seating Capacity:</span>
                <span className="font-semibold text-slate-700">{selectedTableModal.table.capacity || 4} Persons</span>
              </div>
              {selectedTableModal.activeOrder && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="font-semibold text-slate-800">
                    Order: {selectedTableModal.activeOrder.id}
                  </div>
                  <div className="text-slate-500">
                    Guest: {selectedTableModal.activeOrder.customerName}
                  </div>
                  <div className="font-bold text-emerald-600">
                    Bill: ₹{selectedTableModal.activeOrder.amount || selectedTableModal.activeOrder.total}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Update Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Change Status:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateTableStatus(selectedTableModal.table.tableNumber, 'Available');
                    toast.success(`Table ${selectedTableModal.table.tableNumber} set to Available`);
                    setSelectedTableModal(null);
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTableStatus(selectedTableModal.table.tableNumber, 'Occupied');
                    toast.success(`Table ${selectedTableModal.table.tableNumber} set to Occupied`);
                    setSelectedTableModal(null);
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition cursor-pointer"
                >
                  Occupied
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTableStatus(selectedTableModal.table.tableNumber, 'Waiting');
                    toast.success(`Table ${selectedTableModal.table.tableNumber} set to Waiting`);
                    setSelectedTableModal(null);
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
                >
                  Waiting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View-Only Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Details: {selectedOrderModal.id}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatOrderTime(selectedOrderModal.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Table:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderModal.tableNumber ? `Table ${selectedOrderModal.tableNumber}` : 'Online'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderModal.customerName || 'Guest'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderModal.paymentMethod} ({selectedOrderModal.paymentStatus})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Status:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedOrderModal.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="font-bold text-slate-800 mb-2">Ordered Items</div>
                <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {(selectedOrderModal.items || []).map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <span className="text-slate-400 block text-[11px]">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{item.quantity * item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-700">Total Bill Amount:</span>
                <span className="text-emerald-600">
                  ₹{selectedOrderModal.amount || selectedOrderModal.total}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
