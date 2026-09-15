import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  Clock, 
  ArrowUpRight,
  Filter,
  CalendarDays,
  Printer
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';

// Helper to parse order date safely
const getOrderDate = (order) => {
  if (!order?.createdAt) return new Date();
  const d = new Date(order.createdAt);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Helper to check if order is paid (online is auto-paid, or marked paid)
const isOrderPaid = (order) => {
  const method = String(order?.paymentMethod || '').toLowerCase();
  const isOnline = method.includes('upi') || method.includes('card') || method.includes('netbanking') || method.includes('net banking') || method.includes('razorpay') || method.includes('online');
  const pStatus = String(order?.paymentStatus || '').toLowerCase();
  return isOnline || pStatus === 'paid' || !!order?.paidAt;
};

export default function SalesAnalysis() {
  const { orders = [] } = useTableOrder();

  const [analysisType, setAnalysisType] = useState('monthly'); // 'monthly' | 'yearly'

  // Dynamic discovery of all months and years present in real orders
  const availablePeriods = useMemo(() => {
    const yearsSet = new Set();
    const monthsMap = new Map();

    const now = new Date();
    const curYear = String(now.getFullYear());
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curKey = `${curYear}-${curMonth}`;
    const curLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    yearsSet.add(curYear);
    monthsMap.set(curKey, {
      key: curKey,
      label: `${curLabel} (Current)`,
      year: curYear,
      monthIdx: now.getMonth(),
      yearNum: now.getFullYear(),
      name: curLabel
    });

    orders.forEach(o => {
      if (!o.createdAt) return;
      const d = getOrderDate(o);
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      yearsSet.add(y);
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          key,
          label: key === curKey ? `${label} (Current)` : label,
          year: y,
          monthIdx: d.getMonth(),
          yearNum: d.getFullYear(),
          name: label
        });
      }
    });

    const months = Array.from(monthsMap.values()).sort((a, b) => b.key.localeCompare(a.key));
    const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

    return { months, years, defaultMonthKey: curKey, defaultYear: curYear };
  }, [orders]);

  const [selectedMonth, setSelectedMonth] = useState(availablePeriods.defaultMonthKey);
  const [selectedYear, setSelectedYear] = useState(availablePeriods.defaultYear);

  // Monthly Data Calculation (100% Real from Orders)
  const monthlyData = useMemo(() => {
    const activeMonthKey = selectedMonth || availablePeriods.defaultMonthKey;
    const [selYearStr, selMonthStr] = activeMonthKey.split('-');
    const selYear = Number(selYearStr) || new Date().getFullYear();
    const selMonthIndex = (Number(selMonthStr) || (new Date().getMonth() + 1)) - 1;

    const monthObj = availablePeriods.months.find(m => m.key === activeMonthKey) || {
      name: new Date(selYear, selMonthIndex, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    };

    // Filter real orders matching selected month and year
    const monthOrders = orders.filter(o => {
      const d = getOrderDate(o);
      return d.getFullYear() === selYear && d.getMonth() === selMonthIndex;
    });

    let totalRevenue = 0;
    let validOrdersCount = 0;
    const dailyTotals = {};
    const dishStats = {};

    const monthShort = monthObj.name ? monthObj.name.split(' ')[0].slice(0, 3) : 'M';
    const weeks = [
      { week: `Week 1 (${monthShort} 1 – 7)`, orders: 0, revenue: 0, aov: 0, topDay: '—' },
      { week: `Week 2 (${monthShort} 8 – 14)`, orders: 0, revenue: 0, aov: 0, topDay: '—' },
      { week: `Week 3 (${monthShort} 15 – 21)`, orders: 0, revenue: 0, aov: 0, topDay: '—' },
      { week: `Week 4 (${monthShort} 22 – end)`, orders: 0, revenue: 0, aov: 0, topDay: '—' },
    ];
    const weekDailyTally = [{}, {}, {}, {}];

    monthOrders.forEach(o => {
      const status = String(o.status || '').toLowerCase();
      if (status === 'cancelled') return;

      validOrdersCount++;
      const amt = Number(o.amount || o.total) || 0;
      const isPaid = isOrderPaid(o);
      if (isPaid) {
        totalRevenue += amt;
      }

      const d = getOrderDate(o);
      const dayNum = d.getDate();
      const dayKey = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      if (isPaid) {
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + amt;
      }

      let wIdx = 0;
      if (dayNum >= 1 && dayNum <= 7) wIdx = 0;
      else if (dayNum >= 8 && dayNum <= 14) wIdx = 1;
      else if (dayNum >= 15 && dayNum <= 21) wIdx = 2;
      else wIdx = 3;

      weeks[wIdx].orders++;
      if (isPaid) {
        weeks[wIdx].revenue += amt;
        weekDailyTally[wIdx][dayKey] = (weekDailyTally[wIdx][dayKey] || 0) + amt;
      }

      // Dish tally
      (o.items || []).forEach(item => {
        const name = item.name || 'Dish';
        if (!dishStats[name]) {
          dishStats[name] = { name, portions: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 1;
        const pr = Number(item.price) || 0;
        dishStats[name].portions += qty;
        dishStats[name].revenue += (qty * pr);
      });
    });

    weeks.forEach((w, idx) => {
      w.aov = w.orders > 0 ? Math.round(w.revenue / w.orders) : 0;
      const tally = weekDailyTally[idx];
      const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) {
        w.topDay = `${best[0]} (₹${best[1].toLocaleString('en-IN')})`;
      } else if (w.orders > 0) {
        w.topDay = `${w.orders} orders`;
      } else {
        w.topDay = 'No sales';
      }
    });

    const peakDayEntry = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
    const peakSalesDay = peakDayEntry && peakDayEntry[1] > 0
      ? `${peakDayEntry[0]} (₹${peakDayEntry[1].toLocaleString('en-IN')})`
      : (validOrdersCount > 0 ? 'Recorded' : 'No sales recorded yet');

    const now = new Date();
    const isCurrentMonth = selYear === now.getFullYear() && selMonthIndex === now.getMonth();
    const daysInMonth = isCurrentMonth ? now.getDate() : new Date(selYear, selMonthIndex + 1, 0).getDate();
    const avgDailyRevenue = daysInMonth > 0 ? Math.round(totalRevenue / daysInMonth) : 0;
    const avgOrderValue = validOrdersCount > 0 ? Math.round(totalRevenue / validOrdersCount) : 0;
    const topDishes = Object.values(dishStats).sort((a, b) => b.portions - a.portions).slice(0, 5);

    return {
      monthKey: activeMonthKey,
      monthName: monthObj.name,
      totalRevenue,
      totalOrders: validOrdersCount,
      avgDailyRevenue,
      avgOrderValue,
      peakSalesDay,
      weeks,
      topDishes
    };
  }, [orders, selectedMonth, availablePeriods]);

  // Yearly Data Calculation (100% Real from Orders)
  const yearlyData = useMemo(() => {
    const selYearNum = Number(selectedYear || availablePeriods.defaultYear);

    const yearOrders = orders.filter(o => {
      const d = getOrderDate(o);
      return d.getFullYear() === selYearNum && String(o.status || '').toLowerCase() !== 'cancelled';
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const months12 = monthNames.map((name, mIdx) => {
      const mOrders = yearOrders.filter(o => {
        const d = getOrderDate(o);
        return d.getMonth() === mIdx;
      });

      const paidOrders = mOrders.filter(isOrderPaid);
      const revenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount || o.total) || 0), 0);
      const ordersCount = mOrders.length;
      const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

      let status = 'No Orders';
      if (selYearNum === currentYear && mIdx === currentMonthIdx) {
        status = 'Current Month';
      } else if (selYearNum > currentYear || (selYearNum === currentYear && mIdx > currentMonthIdx)) {
        status = 'Upcoming';
      } else if (revenue > 0) {
        status = 'Active';
      }

      return {
        monthIndex: mIdx,
        month: `${name} ${selYearNum}`,
        orders: ordersCount,
        revenue,
        aov,
        status
      };
    });

    const activeRevMonths = months12.filter(m => m.revenue > 0);
    if (activeRevMonths.length > 0) {
      const topRevMonth = [...activeRevMonths].sort((a, b) => b.revenue - a.revenue)[0];
      topRevMonth.status = 'Peak';
    }

    const annualRevenue = months12.reduce((sum, m) => sum + m.revenue, 0);
    const annualOrders = months12.reduce((sum, m) => sum + m.orders, 0);
    const activeCount = months12.filter(m => m.orders > 0 || m.status === 'Current Month').length || 1;
    const avgMonthlyRevenue = Math.round(annualRevenue / activeCount);

    const bestMonth = [...months12].sort((a, b) => b.revenue - a.revenue)[0];
    const peakMonth = bestMonth && bestMonth.revenue > 0
      ? `${bestMonth.month} (₹${bestMonth.revenue.toLocaleString('en-IN')})`
      : (annualOrders > 0 ? `${annualOrders} orders recorded` : 'No sales recorded yet');

    return {
      annualRevenue,
      annualOrders,
      avgMonthlyRevenue,
      peakMonth,
      months: months12
    };
  }, [orders, selectedYear, availablePeriods]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Sales Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Real-time monthly revenue trends and annual restaurant financial performance
          </p>
        </div>

        <div className="no-print flex items-center gap-2.5 flex-wrap">
          {/* Monthly vs Yearly Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setAnalysisType('monthly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                analysisType === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setAnalysisType('yearly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                analysisType === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Yearly Analysis</span>
            </button>
          </div>

          {/* Date Selector */}
          {analysisType === 'monthly' ? (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {availablePeriods.months.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {availablePeriods.years.map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Analysis</span>
          </button>
        </div>
      </div>

      {/* Print-Only Formal Document Header */}
      <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
              SD
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                SmartDine Restaurant
              </h1>
              <p className="text-xs font-semibold text-emerald-700">
                {analysisType === 'monthly'
                  ? `Monthly Financial Sales Analysis — ${monthlyData.monthName}`
                  : `Annual Financial Sales Audit — Year ${selectedYear}`}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">
              Period: {analysisType === 'monthly' ? monthlyData.monthName : `Calendar Year ${selectedYear}`}
            </p>
            <p>Printed: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. MONTHLY SALES ANALYSIS VIEW                               */}
      {/* ============================================================ */}
      {analysisType === 'monthly' && (
        <div className="space-y-6">
          
          {/* 4 Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Total Sales
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                ₹{monthlyData.totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Revenue for {monthlyData.monthName}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Orders
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {monthlyData.totalOrders}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Average ₹{monthlyData.avgOrderValue} per order
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Daily Sales
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-emerald-600 tracking-tight">
                ₹{monthlyData.avgDailyRevenue.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Daily run-rate for {monthlyData.monthName}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Peak Sales Day
              </span>
              <div className="mt-3 text-base font-bold text-slate-900 truncate">
                {monthlyData.peakSalesDay}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Highest single-day revenue
              </p>
            </div>
          </div>

          {/* Monthly Week-by-Week Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none break-inside-avoid">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Weekly Sales Breakdown ({monthlyData.monthName})
                </h3>
                <p className="text-xs text-slate-400">
                  Performance grouped across calendar weeks for {monthlyData.monthName}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {monthlyData.monthName}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Time Period</th>
                    <th className="px-4 py-3.5">Orders Count</th>
                    <th className="px-4 py-3.5">Total Revenue</th>
                    <th className="px-4 py-3.5">Average Order Value</th>
                    <th className="px-4 py-3.5">Top Earning Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {monthlyData.weeks.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {w.week}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {w.orders > 0 ? `${w.orders} orders` : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600">
                        {w.revenue > 0 ? `₹${w.revenue.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {w.aov > 0 ? `₹${w.aov}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {w.topDay}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Dishes of the Selected Month */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bestselling Dishes ({monthlyData.monthName})
                </h3>
                <p className="text-xs text-slate-400">
                  Top ordered items contributing to {monthlyData.monthName} revenue
                </p>
              </div>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            {monthlyData.topDishes.length === 0 ? (
              <div className="mt-4 p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-medium">
                No dish orders recorded for this month yet.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {monthlyData.topDishes.map((dish, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 print:border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-900 truncate">{dish.name}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {dish.portions} portions sold
                    </div>
                    <div className="font-bold text-emerald-600 text-xs">
                      ₹{dish.revenue.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 2. YEARLY SALES ANALYSIS VIEW                                */}
      {/* ============================================================ */}
      {analysisType === 'yearly' && (
        <div className="space-y-6">
          
          {/* 4 Annual KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Annual Gross Revenue
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                ₹{yearlyData.annualRevenue.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Cumulative for Year {selectedYear}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Annual Order Volume
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {yearlyData.annualOrders.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Total dining orders served in {selectedYear}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Monthly Revenue
              </span>
              <div className="mt-3 text-2xl lg:text-3xl font-bold text-emerald-600 tracking-tight">
                ₹{yearlyData.avgMonthlyRevenue.toLocaleString('en-IN')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Monthly average run-rate for {selectedYear}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Highest Earning Month
              </span>
              <div className="mt-3 text-base font-bold text-slate-900 truncate">
                {yearlyData.peakMonth}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Peak performance in {selectedYear}
              </p>
            </div>
          </div>

          {/* Month-by-Month Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none break-inside-avoid">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Month-by-Month Financial Summary ({selectedYear})
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed audit of orders, total sales, and average bill sizes across months
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Year {selectedYear}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Month</th>
                    <th className="px-4 py-3.5">Orders Count</th>
                    <th className="px-4 py-3.5">Total Revenue</th>
                    <th className="px-4 py-3.5">Average Order Value</th>
                    <th className="px-5 py-3.5 text-right">Performance Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {yearlyData.months.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {m.month}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {m.orders > 0 ? `${m.orders} orders` : '—'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {m.revenue > 0 ? `₹${m.revenue.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {m.aov > 0 ? `₹${m.aov}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {m.status === 'Peak' && (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ★ Peak Month
                          </span>
                        )}
                        {m.status === 'High' && (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                            High Sales
                          </span>
                        )}
                        {m.status === 'Normal' && (
                          <span className="px-2.5 py-1 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-700">
                            Steady
                          </span>
                        )}
                        {m.status === 'In Progress' && (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                            ● Current Month
                          </span>
                        )}
                        {m.status === 'Upcoming' && (
                          <span className="text-slate-400 text-[11px]">
                            Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Print-Only Official Footer */}
      <div className="print-only pt-6 mt-6 border-t border-slate-300 text-center text-xs text-slate-500">
        SmartDine Restaurant Management System • Sales Analysis & Financial Audit Report • Confidential
      </div>

    </div>
  );
}
