import React, { useMemo } from 'react';
import { 
  IndianRupee, 
  ShoppingBag, 
  Award, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Utensils,
  Printer
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';

export default function ReportManagement() {
  const { orders = [] } = useTableOrder();

  // Basic Sales & Order Metrics (100% Real from Live Orders)
  const reportData = useMemo(() => {
    let dailySales = 0;
    let validOrdersCount = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    const itemCounts = {};
    const paymentMethods = {
      'Cash': { count: 0, amount: 0 },
      'UPI': { count: 0, amount: 0 },
      'Card': { count: 0, amount: 0 },
    };

    orders.forEach(order => {
      const status = String(order.status || '').toLowerCase();
      const pStatus = String(order.paymentStatus || '').toLowerCase();
      const amount = Number(order.amount || order.total) || 0;

      if (status === 'cancelled') {
        cancelledOrdersCount++;
        return;
      }

      validOrdersCount++;
      if (status === 'served' || status === 'completed') {
        completedOrdersCount++;
      }

      // Online payment methods (UPI, Card, NetBanking) are automatically Paid ONLY if not counter/cash
      const method = String(order.paymentMethod || 'Cash').toLowerCase();
      const isCounter = method.includes('counter') || method.includes('cash') || method.includes('desk');
      const isOnline = !isCounter && (method.includes('upi') || method.includes('online') || method.includes('razorpay') || method.includes('card') || method.includes('netbanking') || method.includes('net banking'));
      const isUnpaidState = !pStatus || pStatus === 'pending' || pStatus === 'unpaid' || pStatus.includes('requested') || pStatus.includes('awaiting');
      const isPaid = !isUnpaidState && (isOnline || pStatus === 'paid' || !!order.paidAt);

      if (isPaid) {
        dailySales += amount;
      }

      // Payment method breakdown
      let key = 'Cash';
      if (method.includes('upi') || method.includes('online') || method.includes('razorpay')) {
        key = 'UPI';
      } else if (method.includes('card')) {
        key = 'Card';
      } else if (method.includes('netbanking') || method.includes('net banking')) {
        key = 'Net Banking';
      }
      if (!paymentMethods[key]) {
        paymentMethods[key] = { count: 0, amount: 0 };
      }
      paymentMethods[key].count++;
      if (isPaid) {
        paymentMethods[key].amount += amount;
      }

      // Items ranking
      (order.items || []).forEach(item => {
        const name = item.name || 'Dish';
        if (!itemCounts[name]) {
          itemCounts[name] = {
            name: name,
            quantity: 0,
            revenue: 0,
            isVeg: item.isVeg !== undefined ? item.isVeg : true
          };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        itemCounts[name].quantity += qty;
        itemCounts[name].revenue += (qty * price);
      });
    });

    const avgOrderValue = validOrdersCount > 0 ? Math.round(dailySales / validOrdersCount) : 0;
    const sortedItems = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);
    const topItem = sortedItems[0] || null;

    return {
      dailySales,
      totalOrders: orders.length,
      validOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      avgOrderValue,
      topItem,
      mostOrderedItems: sortedItems.slice(0, 7),
      paymentMethods
    };
  }, [orders]);

  const maxQty = reportData.mostOrderedItems[0]?.quantity || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Screen Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Restaurant Reports
          </h2>
          <p className="text-xs text-slate-500">
            Essential daily performance summary and sales reports
          </p>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
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
                Official Daily Sales & Performance Summary
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">
              Report Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p>Printed: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* 4 Essential Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daily Sales
          </span>
          <div className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">
            ₹{reportData.dailySales.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Avg. ₹{reportData.avgOrderValue} per order
          </p>
        </div>

        {/* 2. Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Orders
          </span>
          <div className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">
            {reportData.totalOrders}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {reportData.completedOrdersCount} served • {reportData.cancelledOrdersCount} cancelled
          </p>
        </div>

        {/* 3. Most Popular Dish */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Selling Dish
          </span>
          <div className="mt-3 text-lg font-bold text-slate-900 truncate">
            {reportData.topItem ? reportData.topItem.name : '—'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {reportData.topItem ? `${reportData.topItem.quantity} portions sold today` : 'No dishes sold yet'}
          </p>
        </div>

        {/* 4. Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fulfillment Rate
          </span>
          <div className="mt-3 text-3xl font-bold text-emerald-600 tracking-tight">
            {reportData.totalOrders > 0 
              ? `${Math.round(((reportData.totalOrders - reportData.cancelledOrdersCount) / reportData.totalOrders) * 100)}%` 
              : '100%'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Order success rate
          </p>
        </div>
      </div>

      {/* Two Columns: Most Ordered Items & Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Ordered Food Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Most Ordered Food Items
              </h3>
              <p className="text-xs text-slate-400">
                Top selling items by quantity ordered
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="mt-4 space-y-3.5">
            {reportData.mostOrderedItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No orders recorded yet.</p>
            ) : (
              reportData.mostOrderedItems.map((item, idx) => {
                const percentage = Math.round((item.quantity / maxQty) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-600 flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          item.isVeg ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{item.quantity} sold</span>
                        <span className="text-[11px] text-slate-400 ml-2">₹{item.revenue}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:border-slate-300 print:shadow-none break-inside-avoid">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payment Summary
              </h3>
              <p className="text-xs text-slate-400">
                Distribution across settlement channels
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="mt-4 space-y-4">
            {Object.entries(reportData.paymentMethods).map(([method, data]) => {
              const totalRev = reportData.dailySales || 1;
              const pct = Math.round((data.amount / totalRev) * 100);

              return (
                <div key={method} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{method}</span>
                      <span className="text-[11px] text-slate-400">({data.count} transactions)</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{data.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-medium">
                    {pct}% of total daily sales
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Print-Only Official Footer */}
      <div className="print-only pt-6 mt-6 border-t border-slate-300 text-center text-xs text-slate-500">
        SmartDine Restaurant Management System • Official Performance Audit Report • Generated Automatically
      </div>

    </div>
  );
}
