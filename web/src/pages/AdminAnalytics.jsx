import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Flame, 
  PieChart, 
  Calendar, 
  UtensilsCrossed, 
  CreditCard,
  CheckCircle2,
  Smartphone,
  Banknote
} from 'lucide-react';

export default function AdminAnalytics() {
  const { orders, menuItems, categories } = useTableOrder();
  const [timeRange, setTimeRange] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'

  const isOrderPaid = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || '').trim().toLowerCase();
    if (p === 'unpaid' || p === 'pending' || p.includes('requested') || p.includes('awaiting')) return false;
    return p === 'paid' || p === 'cash paid' || p === 'online paid' || !!o.paidAt;
  };

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const paidOrders = orders.filter(o => isOrderPaid(o) && o.status !== 'cancelled');

  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const paidRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  // Payment Breakdown
  const cashTotal = paidOrders.filter(o => String(o.paymentMethod || '').toLowerCase().includes('cash')).reduce((sum, o) => sum + (o.total || 0), 0);
  const upiTotal = paidOrders.filter(o => String(o.paymentMethod || '').toLowerCase().includes('upi')).reduce((sum, o) => sum + (o.total || 0), 0);
  const cardTotal = paidOrders.filter(o => String(o.paymentMethod || '').toLowerCase().includes('card')).reduce((sum, o) => sum + (o.total || 0), 0);

  const cashPct = paidRevenue > 0 ? Math.round((cashTotal / paidRevenue) * 100) : 0;
  const upiPct = paidRevenue > 0 ? Math.round((upiTotal / paidRevenue) * 100) : 0;
  const cardPct = paidRevenue > 0 ? Math.max(0, 100 - cashPct - upiPct) : 0;

  // Food Analytics (Veg vs Non-Veg & Top items)
  const { topDishes, vegCount, nonVegCount } = useMemo(() => {
    const dishMap = new Map();
    let veg = 0;
    let nonVeg = 0;

    validOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(i => {
          const key = i.name;
          const current = dishMap.get(key) || { name: i.name, quantity: 0, revenue: 0, isVeg: i.isVeg !== false };
          current.quantity += (i.quantity || 1);
          current.revenue += (i.price * (i.quantity || 1));
          dishMap.set(key, current);

          if (i.isVeg !== false) {
            veg += (i.quantity || 1);
          } else {
            nonVeg += (i.quantity || 1);
          }
        });
      }
    });

    const top = Array.from(dishMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 6);
    return { topDishes: top, vegCount: veg, nonVegCount: nonVeg };
  }, [validOrders]);

  const totalDishesOrdered = vegCount + nonVegCount;
  const vegPct = totalDishesOrdered > 0 ? Math.round((vegCount / totalDishesOrdered) * 100) : 70;
  const nonVegPct = 100 - vegPct;

  // Sales Trend Mock Data relative to real total
  const trendDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendWeights = [0.10, 0.12, 0.11, 0.14, 0.18, 0.20, 0.15];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 font-sans text-slate-100">
      <Sidebar mode="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-orange-500" />
              <span>Restaurant Analytics & Business Intelligence</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sales velocity, average order value, delicacy demand trends & payment channel analytics
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  timeRange === t ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core High-Level KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Gross Sales</span>
              <IndianRupee className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs last period</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Average Order Value (AOV)</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white">₹{aov}</div>
            <div className="text-[11px] text-slate-400">Across {validOrders.length} Dining Orders</div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Paid Revenue Settled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-400">₹{paidRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-300 font-semibold">{paidOrders.length} Invoices Cleared</div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Delicacies Sold</span>
              <UtensilsCrossed className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white">{totalDishesOrdered}</div>
            <div className="text-[11px] text-purple-400 font-semibold">{vegPct}% Vegetarian Dishes</div>
          </div>
        </div>

        {/* 2-Column Section: Sales Velocity Chart + Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Sales Bar Chart (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Sales & Revenue Velocity</h3>
                <p className="text-xs text-slate-400">Daily distribution and volume contribution</p>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">₹{totalRevenue} Total</span>
            </div>

            {/* Visual CSS Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
              {trendDays.map((day, idx) => {
                const heightPct = Math.max(15, Math.round(trendWeights[idx] * 100 * 3));
                const daySales = Math.round(totalRevenue * trendWeights[idx]);

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                      ₹{daySales}
                    </span>
                    <div className="w-full bg-slate-950 rounded-xl overflow-hidden h-32 flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-lg transition-all group-hover:brightness-125 shadow-lg shadow-orange-600/20"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Channels (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Payment Method Channels</h3>
              <p className="text-xs text-slate-400">Collection channel distribution</p>
            </div>

            <div className="space-y-4 pt-2">
              {/* UPI */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>UPI Online (QR & Apps)</span>
                  </span>
                  <span className="text-white">₹{upiTotal.toLocaleString()} ({upiPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div style={{ width: `${upiPct}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>

              {/* Cash */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash Counter Settlement</span>
                  </span>
                  <span className="text-white">₹{cashTotal.toLocaleString()} ({cashPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div style={{ width: `${cashPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              {/* Card */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-purple-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Credit / Debit Cards</span>
                  </span>
                  <span className="text-white">₹{cardTotal.toLocaleString()} ({cardPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div style={{ width: `${cardPct}%` }} className="h-full bg-purple-500 rounded-full" />
                </div>
              </div>

              {/* Veg vs Non-Veg Pill */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mt-4 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-400">🟢 Veg: {vegPct}%</span>
                  <span className="text-red-400">🔴 Non-Veg: {nonVegPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                  <div style={{ width: `${vegPct}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${nonVegPct}%` }} className="bg-red-500 h-full" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Top Delicacies Leaderboard */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>Highest Selling Dishes Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-400">Ranked by total quantity served and revenue generation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {topDishes.map((dish, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 font-black flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span>{dish.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{dish.quantity} portions ordered</span>
                  </div>
                </div>

                <span className="font-black text-orange-400 text-sm shrink-0">
                  ₹{dish.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
