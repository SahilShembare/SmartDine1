import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { localStore } from '../firebase/config';
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
  RotateCcw
} from 'lucide-react';

export default function AdminDashboard() {
  const { orders, menuItems, tables, categories, setOrders, setMenuItems, setTables, setCategories } = useTableOrder();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Computed Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.total || 0) : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'placed');
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'accepted');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeTablesCount = tables.filter(t => t.active !== false).length;

  const handleResetDemoData = () => {
    if (confirm('Reset and reload all demo menu items, categories, tables, and realistic orders?')) {
      setSeeding(true);
      localStore.resetToDemoData();
      setMenuItems(localStore.getMenuItems());
      setCategories(localStore.getCategories());
      setTables(localStore.getTables());
      setOrders(localStore.getOrders());
      setSeeding(false);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <Sidebar mode="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Restaurant Analytics & Overview
              <span className="p-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <Sparkles className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live metrics, kitchen queue status, and restaurant performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemoData}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seedSuccess ? 'Demo Data Restored!' : 'Seed Demo Data'}</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Revenue */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/70 border border-slate-700/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-extrabold text-white">₹{totalRevenue.toLocaleString()}</span>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% vs last week</span>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/70 border border-slate-700/80 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-extrabold text-white">{orders.length}</span>
              <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                <span>{completedOrders.length} Completed</span>
              </div>
            </div>
          </div>

          {/* Active Tables */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/70 border border-slate-700/80 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Tables</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-extrabold text-white">{activeTablesCount} / {tables.length}</span>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                <span>All QR codes operational</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/70 border border-slate-700/80 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Menu Items</span>
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl lg:text-3xl font-extrabold text-white">{menuItems.length} Dishes</span>
              <div className="flex items-center gap-1 text-xs text-purple-400 mt-1">
                <span>Across {categories.length} categories</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Kitchen Status Funnel */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-400" />
                Live Order Pipeline
              </h3>
              <p className="text-xs text-slate-400">Current real-time status of dining room orders</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
              {pendingOrders.length + preparingOrders.length + readyOrders.length} In-Progress
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-2xl font-extrabold text-amber-300">{pendingOrders.length}</span>
              <p className="text-xs font-semibold text-amber-400 mt-0.5">Pending Approval</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-2xl font-extrabold text-blue-300">{preparingOrders.length}</span>
              <p className="text-xs font-semibold text-blue-400 mt-0.5">Cooking & Prep</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-2xl font-extrabold text-emerald-300">{readyOrders.length}</span>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">Ready to Serve</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <span className="text-2xl font-extrabold text-slate-300">{completedOrders.length}</span>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Served Today</p>
            </div>
          </div>
        </div>

        {/* Recent Orders List Table */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Latest Dine-In Orders
            </h3>
            <span className="text-xs text-slate-400">Auto-updating in real-time</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                        Table {order.tableNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {order.customerName || 'Dine-In Guest'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      ₹{order.total?.toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        order.status === 'preparing' || order.status === 'accepted' ? 'bg-blue-500/20 text-blue-300' :
                        order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' :
                        order.status === 'completed' ? 'bg-slate-700 text-slate-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
