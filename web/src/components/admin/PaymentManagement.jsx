import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Receipt 
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';

export default function PaymentManagement() {
  const { orders = [], markOrderAsPaidByAdmin, markOrderAsUnpaidByAdmin } = useTableOrder();
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Online verification helper (UPI, Card, NetBanking are automatically Paid)
  const isOnlinePayment = (method) => {
    const m = String(method || '').toLowerCase();
    return m.includes('upi') || m.includes('card') || m.includes('netbanking') || m.includes('net banking') || m.includes('razorpay') || m.includes('online');
  };

  // Payment Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashTotal = 0;
    let onlineTotal = 0;
    let pendingCount = 0;

    orders.forEach(o => {
      const method = String(o.paymentMethod || '').toLowerCase();
      const isOnline = isOnlinePayment(method);
      const isPaid = isOnline || String(o.paymentStatus || '').toLowerCase() === 'paid' || !!o.paidAt;
      const s = String(o.status || '').toLowerCase();
      const amt = Number(o.amount || o.total) || 0;

      if (s !== 'cancelled') {
        if (isPaid) {
          totalRevenue += amt;
          if (method.includes('cash')) {
            cashTotal += amt;
          } else {
            onlineTotal += amt;
          }
        } else {
          pendingCount++;
        }
      }
    });

    return { totalRevenue, cashTotal, onlineTotal, pendingCount };
  }, [orders]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return orders.filter(o => {
      const isOnline = isOnlinePayment(o.paymentMethod);
      const isPaid = isOnline || String(o.paymentStatus || 'pending').toLowerCase() === 'paid' || !!o.paidAt;

      if (filterPaymentStatus === 'paid' && !isPaid) return false;
      if (filterPaymentStatus === 'pending' && isPaid) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const idMatch = String(o.id || '').toLowerCase().includes(q);
        const custMatch = String(o.customerName || '').toLowerCase().includes(q);
        const tblMatch = String(o.tableNumber || '').includes(q);
        const methodMatch = String(o.paymentMethod || '').toLowerCase().includes(q);
        if (!idMatch && !custMatch && !tblMatch && !methodMatch) return false;
      }

      return true;
    });
  }, [orders, filterPaymentStatus, searchQuery]);

  const handleMarkPaid = async (orderId) => {
    await markOrderAsPaidByAdmin(orderId, 'Cash');
    toast.success(`Order #${orderId} marked as Paid (Cash Collected)`);
  };

  const handleMarkUnpaid = async (orderId) => {
    if (markOrderAsUnpaidByAdmin) {
      await markOrderAsUnpaidByAdmin(orderId);
      toast.success(`Order #${orderId} marked as Unpaid (Pending Cash)`);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Today';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Today';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Revenue
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">Total settled payments</p>
        </div>

        {/* 2. Cash Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cash Payments
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            ₹{metrics.cashTotal.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">Cash collected at counter</p>
        </div>

        {/* 3. Online Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Online / UPI
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-emerald-600 tracking-tight">
            ₹{metrics.onlineTotal.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">QR, Cards & UPI</p>
        </div>

        {/* 4. Pending Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Bills
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-amber-600 tracking-tight">
            {metrics.pendingCount}
          </div>
          <p className="mt-1 text-xs text-slate-400">Awaiting payment settlement</p>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Payments Log
          </h2>
          <p className="text-xs text-slate-500">
            Transaction history, settlement method, and payment status
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterPaymentStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPaymentStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterPaymentStatus('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPaymentStatus === 'paid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setFilterPaymentStatus('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPaymentStatus === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Table</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">Date and Time</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((order) => {
                  const method = order.paymentMethod || 'Cash';
                  const isOnline = isOnlinePayment(method);
                  const isPaid = isOnline || String(order.paymentStatus || '').toLowerCase() === 'paid' || !!order.paidAt;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {order.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Online'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">
                        {order.customerName || 'Guest'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ₹{Number(order.amount || order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className={`inline-block px-2.5 py-1 rounded-md font-medium text-xs ${
                          isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {method}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Paid {isOnline ? `(${method})` : '(Cash)'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Unpaid (Cash)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDateTime(order.paidAt || order.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Auto-Paid
                          </span>
                        ) : (
                          <div className="flex items-center justify-end">
                            {isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleMarkUnpaid(order.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-600 border border-slate-200 font-semibold text-[11px] transition cursor-pointer"
                                title="Click to mark cash bill as Unpaid"
                              >
                                Mark as Unpaid
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(order.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-[11px] shadow-xs cursor-pointer transition"
                                title="Click to mark cash bill as Paid"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
