import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import { 
  BellRing, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  Flame, 
  AlertTriangle, 
  Filter, 
  Trash2, 
  ExternalLink,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function AdminNotifications() {
  const { orders } = useTableOrder();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'orders' | 'bills' | 'cash'

  // Build live notification stream from orders
  const notifications = useMemo(() => {
    const list = [];

    orders.forEach(o => {
      // 1. Cash Payment Requested
      if (o.paymentStatus === 'Cash Payment Requested') {
        list.push({
          id: `cash_${o.id}`,
          type: 'cash',
          title: `💵 Cash Collection Pending (Table ${o.tableNumber})`,
          message: `${o.customerName || 'Guest'} requested cash payment of ₹${o.total}. Collect cash at counter & settle.`,
          time: o.updatedAt || o.createdAt,
          link: `/admin/payments`,
          urgency: 'high'
        });
      }

      // 2. Bill Requested
      if (o.paymentStatus === 'Bill Requested') {
        list.push({
          id: `bill_${o.id}`,
          type: 'bill',
          title: `🛎️ Bill Requested (Table ${o.tableNumber})`,
          message: `Customer at Table ${o.tableNumber} requested final consolidated invoice of ₹${o.total}.`,
          time: o.updatedAt || o.createdAt,
          link: `/bill?table=${o.tableNumber}`,
          urgency: 'high'
        });
      }

      // 3. New Kitchen Order
      if (o.status === 'pending' || o.status === 'placed') {
        list.push({
          id: `order_${o.id}`,
          type: 'order',
          title: `🔥 New Order Placed #${o.id} (Table ${o.tableNumber})`,
          message: `${o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
          time: o.createdAt,
          link: `/admin/orders`,
          urgency: 'normal'
        });
      }

      // 4. Payment Completed
      if (o.paymentStatus === 'Paid' || !!o.paidAt) {
        list.push({
          id: `paid_${o.id}`,
          type: 'paid',
          title: `✅ Payment Verified (Table ${o.tableNumber})`,
          message: `₹${o.total} settled via ${o.paymentMethod || 'Online'} (${o.transactionId || 'TXN-SUCCESS'}).`,
          time: o.paidAt || o.updatedAt || o.createdAt,
          link: `/admin/payments`,
          urgency: 'low'
        });
      }
    });

    return list.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [orders]);

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'orders' && n.type !== 'order') return false;
    if (filterType === 'bills' && n.type !== 'bill') return false;
    if (filterType === 'cash' && n.type !== 'cash') return false;
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
              <BellRing className="w-7 h-7 text-orange-500" />
              <span>Real-Time Restaurant Notification Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live operational alerts for new kitchen orders, table bill requests & cashier cash collection
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black">
            {notifications.length} Total Live Alerts
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: `All Alerts (${notifications.length})` },
            { id: 'cash', label: `💵 Cash To Collect (${notifications.filter(n => n.type === 'cash').length})` },
            { id: 'bills', label: `🛎️ Bill Requests (${notifications.filter(n => n.type === 'bill').length})` },
            { id: 'orders', label: `🔥 New Orders (${notifications.filter(n => n.type === 'order').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-2">
              <BellRing className="w-10 h-10 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">All Caught Up!</h3>
              <p className="text-xs text-slate-500">No active alerts matching this filter.</p>
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <div
                key={notif.id}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.type === 'cash'
                    ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/60 shadow-lg'
                    : notif.type === 'bill'
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg'
                    : notif.type === 'order'
                    ? 'bg-slate-900/90 border-orange-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                    notif.type === 'cash' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
                    notif.type === 'bill' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
                    notif.type === 'order' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {notif.type === 'cash' ? <Banknote className="w-5 h-5" /> :
                     notif.type === 'bill' ? <BellRing className="w-5 h-5" /> :
                     notif.type === 'order' ? <Flame className="w-5 h-5" /> :
                     <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 inline-block">
                      {new Date(notif.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                <Link
                  to={notif.link}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Open Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}
