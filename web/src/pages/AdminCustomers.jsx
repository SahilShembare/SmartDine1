import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  Users, 
  Search, 
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  Star, 
  Phone, 
  ExternalLink,
  Crown,
  Sparkles,
  Receipt
} from 'lucide-react';

export default function AdminCustomers() {
  const { orders } = useTableOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Group orders by customer phone / name
  const customerList = useMemo(() => {
    const map = new Map();

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const key = order.customerPhone || order.customerName || `Guest-Table-${order.tableNumber}`;
      
      const existing = map.get(key) || {
        id: key,
        name: order.customerName || 'Dine-In Guest',
        phone: order.customerPhone || 'N/A',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt || new Date().toISOString(),
        dishMap: new Map(),
        orderHistory: []
      };

      existing.totalOrders += 1;
      existing.totalSpent += (order.total || 0);
      existing.orderHistory.push(order);

      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
      }

      if (Array.isArray(order.items)) {
        order.items.forEach(i => {
          existing.dishMap.set(i.name, (existing.dishMap.get(i.name) || 0) + (i.quantity || 1));
        });
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).map(c => {
      const topDishes = Array.from(c.dishMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      return {
        ...c,
        topDishes,
        avgOrderValue: c.totalOrders > 0 ? Math.round(c.totalSpent / c.totalOrders) : 0
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = customerList.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
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
              <Users className="w-7 h-7 text-amber-500" />
              <span>Customer Relationship & Dining CRM</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Guest profiles, lifetime spending, order history & favorite dining delicacies
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
            {customerList.length} Registered Dining Guests
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs space-y-2">
              <Users className="w-10 h-10 text-slate-700 mx-auto" />
              <p>No customer profiles found.</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-sm flex items-center justify-center shadow">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{customer.name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">{customer.phone}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black">
                      {customer.totalOrders} Orders
                    </span>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Total Spent</span>
                      <div className="font-black text-white text-sm">₹{customer.totalSpent.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Avg Order</span>
                      <div className="font-bold text-orange-400 text-sm">₹{customer.avgOrderValue}</div>
                    </div>
                  </div>

                  {/* Favorite Delicacies */}
                  {customer.topDishes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Favorite Delicacies</span>
                      <div className="flex flex-wrap gap-1">
                        {customer.topDishes.map((dish, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium truncate">
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* History Action */}
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  View Complete Order History ({customer.orderHistory.length})
                </button>
              </div>
            ))
          )}
        </div>

        {/* Customer History Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCustomer.name}'s Order History</h3>
                  <p className="text-xs text-slate-400">{selectedCustomer.phone} • Lifetime Spent: ₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                {selectedCustomer.orderHistory.map(o => (
                  <div key={o.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-200">Order #{o.id} • Table {o.tableNumber}</span>
                      <span className="text-orange-400 font-black">₹{o.total?.toFixed(0)}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate">
                      {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>{new Date(o.createdAt || Date.now()).toLocaleString()}</span>
                      <span className="text-emerald-400 font-bold uppercase">{o.paymentStatus || 'Paid'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
