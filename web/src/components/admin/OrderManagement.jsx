import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChefHat, 
  Utensils, 
  IndianRupee,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';

export default function OrderManagement() {
  const { orders = [], updateOrderStatus } = useTableOrder();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Status Counts
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length, pending: 0, preparing: 0, ready: 0, served: 0, cancelled: 0 };
    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const s = String(o.status || '').toLowerCase();
      const matchesStatus = selectedStatus === 'all' || s === selectedStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        String(o.id || '').toLowerCase().includes(q) ||
        String(o.tableNumber || '').includes(q) ||
        String(o.customerName || '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

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

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ready
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Served
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Order Management
          </h2>
          <p className="text-xs text-slate-500">
            Monitor incoming customer orders, kitchen status, and table fulfillment
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, table, guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'preparing', label: 'Preparing' },
          { id: 'ready', label: 'Ready' },
          { id: 'served', label: 'Served' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          const count = statusCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No orders found</p>
            <p className="text-xs text-slate-400 mt-1">There are no orders matching this filter.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentStatus = String(order.status || 'pending').toLowerCase();
            return (
              <div
                key={order.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: ID, Table, Customer & Time */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-sm text-slate-900 tracking-tight">
                        {order.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Online Order'}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatOrderTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{order.customerName || 'Walk-in Guest'}</span>
                      {order.customerPhone && (
                        <span className="text-slate-400">({order.customerPhone})</span>
                      )}
                      <span>•</span>
                      <span className="font-bold text-slate-900">₹{order.amount || order.total}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        String(order.paymentStatus).toLowerCase() === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.paymentStatus || 'Pending'} ({order.paymentMethod || 'Cash'})
                      </span>
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="pt-2 text-xs text-slate-700 flex flex-wrap gap-2">
                      {(order.items || []).map((it, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                        >
                          <strong>{it.quantity}x</strong> {it.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: View Only Inspection */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(order)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>View Details</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Details: {selectedOrderDetails.id}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatOrderTime(selectedOrderDetails.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Table:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderDetails.tableNumber ? `Table ${selectedOrderDetails.tableNumber}` : 'Online'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderDetails.customerName || 'Guest'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderDetails.paymentMethod} ({selectedOrderDetails.paymentStatus})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Status:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedOrderDetails.status}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <div className="font-bold text-slate-800 mb-2">Order Items</div>
                <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {(selectedOrderDetails.items || []).map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <span className="text-slate-400 block">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{item.quantity * item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-700">Total Bill Amount:</span>
                <span className="text-emerald-600">
                  ₹{selectedOrderDetails.amount || selectedOrderDetails.total}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
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
