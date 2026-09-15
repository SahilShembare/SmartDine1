import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Utensils, 
  Search, 
  Eye, 
  Layers, 
  RotateCw,
  BellRing,
  X,
  Sparkles
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';

export default function KitchenUpdates() {
  const { orders = [] } = useTableOrder();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready' | 'served'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);

  // Filter active kitchen orders (exclude cancelled)
  const kitchenOrders = useMemo(() => {
    return orders.filter(order => {
      const s = String(order.status || '').toLowerCase().trim();
      if (s === 'cancelled') return false;

      // Status filter
      if (activeTab === 'all') {
        // Show non-completed orders first, or active orders
        return s !== 'completed';
      }
      if (activeTab === 'pending') {
        return s === 'pending' || s === 'placed';
      }
      if (activeTab === 'preparing') {
        return s === 'preparing' || s === 'accepted';
      }
      if (activeTab === 'ready') {
        return s === 'ready';
      }
      if (activeTab === 'served') {
        return s === 'served' || s === 'completed';
      }
      return true;
    }).filter(order => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTable = String(order.tableNumber || '').toLowerCase().includes(q) || `table ${order.tableNumber}`.toLowerCase().includes(q);
      const matchId = String(order.id || '').toLowerCase().includes(q);
      const matchDish = (order.items || []).some(item => String(item.name || '').toLowerCase().includes(q));
      return matchTable || matchId || matchDish;
    });
  }, [orders, activeTab, searchQuery]);

  // Operational Counts
  const counts = useMemo(() => {
    let pendingCount = 0;
    let preparingCount = 0;
    let readyCount = 0;
    let servedCount = 0;

    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase().trim();
      if (s === 'pending' || s === 'placed') pendingCount++;
      else if (s === 'preparing' || s === 'accepted') preparingCount++;
      else if (s === 'ready') readyCount++;
      else if (s === 'served' || s === 'completed') servedCount++;
    });

    return {
      activeTotal: pendingCount + preparingCount + readyCount,
      pendingCount,
      preparingCount,
      readyCount,
      servedCount
    };
  }, [orders]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    switch (s) {
      case 'pending':
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Received (In Queue)
          </span>
        );
      case 'preparing':
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Cooking in Kitchen
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ready to Serve
          </span>
        );
      case 'served':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Served to Guest
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

  const formatElapsed = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
      if (diff <= 0) return 'Just now';
      if (diff < 60) return `${diff}m ago`;
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hrs}h ${mins}m ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Active KOTs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Kitchen KOTs
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">
            {counts.activeTotal}
          </div>
          <p className="mt-1 text-xs text-slate-400">Total table tickets in workflow</p>
        </div>

        {/* 2. Received (In Queue) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Received (In Queue)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-amber-600 tracking-tight">
            {counts.pendingCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Awaiting kitchen prep start</p>
        </div>

        {/* 3. Cooking in Kitchen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cooking in Kitchen
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-orange-600 tracking-tight">
            {counts.preparingCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Chefs actively preparing food</p>
        </div>

        {/* 4. Ready to Serve */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ready to Serve
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-600 tracking-tight">
            {counts.readyCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Plated dishes waiting for service</p>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Live Kitchen Updates
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time kitchen order ticket (KOT) monitoring and food preparation status
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active ({counts.activeTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟡 In Queue ({counts.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preparing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'preparing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟠 Cooking ({counts.preparingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ready' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟢 Ready ({counts.readyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('served')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'served' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Served ({counts.servedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search table or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Kitchen Ticket Cards Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-3">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Kitchen Orders in this Category</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            The kitchen display is currently clear for this filter. New table orders will show up here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map((ticket) => {
            const itemCount = (ticket.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
            return (
              <div 
                key={ticket.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition flex flex-col justify-between overflow-hidden"
              >
                {/* Ticket Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-xs">
                      {ticket.tableNumber ? `Table ${ticket.tableNumber}` : 'Online'}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 block">
                        #{ticket.id}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatElapsed(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                {/* Ticket Body: Itemized Food List */}
                <div className="p-4 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                    <span>Dishes to Cook</span>
                    <span>{itemCount} items</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(ticket.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-800 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {item.quantity}x
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {item.name}
                            </span>
                            {item.instructions && (
                              <span className="text-[10px] text-amber-600 italic block">
                                Note: {item.instructions}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          item.isVeg ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="block text-[11px] text-slate-400">Guest:</span>
                    <strong className="text-slate-800 font-semibold">{ticket.customerName || 'Dine-in Guest'}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicketModal(ticket)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-600" />
                    <span>View Ticket</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Inspection Modal */}
      {selectedTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kitchen Ticket #{selectedTicketModal.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedTicketModal.tableNumber ? `Table ${selectedTicketModal.tableNumber}` : 'Online Order'} • Placed {formatElapsed(selectedTicketModal.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Current Preparation Stage</span>
              {getStatusBadge(selectedTicketModal.status)}
            </div>

            {/* Dishes Itemized */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Order Items ({selectedTicketModal.items?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                {(selectedTicketModal.items || []).map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-xs">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 block">{item.name}</span>
                        {item.instructions && (
                          <span className="text-[10px] text-amber-600 italic">Note: {item.instructions}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      item.isVeg ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicketModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
