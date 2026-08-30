import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import { 
  Flame, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Banknote, 
  ArrowRight, 
  Receipt, 
  ExternalLink,
  Users,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  BellRing
} from 'lucide-react';

export default function AdminOrders() {
  const { 
    orders, 
    updateOrderStatus, 
    markTableAsPaidByAdmin 
  } = useTableOrder();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status mapping and styling
  const statusColors = {
    new: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    placed: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    accepted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    preparing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    ready: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    served: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    'bill requested': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    'cash requested': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    completed: 'bg-slate-700/40 text-slate-400 border-slate-700/60',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40'
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order #${orderId} marked as ${newStatus.toUpperCase()}`, { icon: '⚡' });
  };

  const isOrderPaid = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || '').trim().toLowerCase();
    if (p === 'unpaid' || p === 'pending' || p.includes('requested') || p.includes('awaiting')) return false;
    return p === 'paid' || p === 'cash paid' || p === 'online paid' || !!o.paidAt;
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && (o.status === 'completed' || o.status === 'cancelled')) return false;
      if (statusFilter === 'kitchen' && !['pending', 'placed', 'preparing', 'accepted', 'ready'].includes(o.status)) return false;
      if (statusFilter === 'bill' && o.paymentStatus !== 'Bill Requested' && o.paymentStatus !== 'Cash Payment Requested') return false;
      if (statusFilter === 'unpaid' && isOrderPaid(o)) return false;
      if (statusFilter === 'paid' && !isOrderPaid(o)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchTable = String(o.tableNumber).toLowerCase().includes(q);
      const matchCustomer = String(o.customerName || '').toLowerCase().includes(q);
      const matchItems = o.items?.some(i => i.name.toLowerCase().includes(q));
      return matchId || matchTable || matchCustomer || matchItems;
    }

    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 font-sans text-slate-100">
      <Sidebar mode="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <Flame className="w-7 h-7 text-orange-500" />
              <span>Live Order Lifecycle Manager</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time pipeline: New → Accepted → Preparing → Ready → Served → Bill Requested → Settle
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black">
              {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} Active Orders
            </span>
          </div>
        </div>

        {/* Search & Status Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by table, order ID, dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'active', label: 'Active Pipeline' },
              { id: 'kitchen', label: 'In Kitchen' },
              { id: 'bill', label: 'Bill / Cash Waiting' },
              { id: 'unpaid', label: 'Unpaid' },
              { id: 'paid', label: 'Paid & Settled' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Card Grid */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Orders Found</h3>
            <p className="text-xs text-slate-500">No orders match the selected filter or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => {
              const paid = isOrderPaid(order);
              const isCash = order.paymentStatus === 'Cash Payment Requested';
              const isBillReq = order.paymentStatus === 'Bill Requested' || isCash;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4.5 border transition-all space-y-3 relative flex flex-col justify-between ${
                    isCash
                      ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/80 shadow-lg'
                      : isBillReq
                      ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/80 shadow-lg'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Row: Order ID & Table */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-200">#{order.id}</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                          Table {order.tableNumber}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[order.status] || 'bg-slate-800 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Customer & Time */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span className="font-semibold text-slate-300">{order.customerName || 'Dine-In Guest'}</span>
                      <span className="text-[10px]">{new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Items List */}
                    <div className="mt-3 space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 max-h-36 overflow-y-auto custom-scrollbar text-xs">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="font-bold text-orange-400">{item.quantity}x</span>
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-medium text-slate-400">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Payment Badge */}
                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400">Total: </span>
                        <span className="text-sm font-black text-white">₹{order.total?.toFixed(0)}</span>
                      </div>

                      {paid ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          PAID ✅ ({order.paymentMethod || 'Online'})
                        </span>
                      ) : isCash ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black animate-pulse">
                          💵 COLLECT CASH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          {order.paymentStatus || 'Payment Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operational Controls Lifecycle */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                      {order.status === 'pending' || order.status === 'placed' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'accepted')}
                          className="py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                        >
                          Accept Order
                        </button>
                      ) : null}

                      {order.status === 'accepted' || order.status === 'pending' || order.status === 'placed' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer"
                        >
                          Start Cooking
                        </button>
                      ) : null}

                      {order.status === 'preparing' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          className="col-span-2 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          Mark Ready to Serve
                        </button>
                      ) : null}

                      {order.status === 'ready' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'served')}
                          className="col-span-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          Mark Served to Table
                        </button>
                      ) : null}

                      {order.status === 'served' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="col-span-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>

                    {/* Settle Action */}
                    {!paid && (
                      <button
                        type="button"
                        onClick={() => {
                          markTableAsPaidByAdmin(order.tableNumber, 'Cash (Collected by Cashier)');
                          toast.success(`💰 Table ${order.tableNumber} bill settled!`);
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Collect Cash & Settle (₹{order.total?.toFixed(0)})</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
