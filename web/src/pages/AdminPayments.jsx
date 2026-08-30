import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useTableOrder } from '../context/TableOrderContext';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Search, 
  Filter, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Banknote, 
  Receipt, 
  ExternalLink,
  Download,
  Calendar,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminPayments() {
  const { 
    orders, 
    markTableAsPaidByAdmin 
  } = useTableOrder();

  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'cash' | 'upi' | 'card'
  const [searchQuery, setSearchQuery] = useState('');

  const isOrderPaid = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || '').trim().toLowerCase();
    if (p === 'unpaid' || p === 'pending' || p.includes('requested') || p.includes('awaiting')) return false;
    return p === 'paid' || p === 'cash paid' || p === 'online paid' || !!o.paidAt;
  };

  const paidOrders = orders.filter(o => isOrderPaid(o) && o.status !== 'cancelled');
  const pendingOrders = orders.filter(o => !isOrderPaid(o) && o.status !== 'cancelled');

  const totalCollected = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const cashCollected = paidOrders
    .filter(o => String(o.paymentMethod || '').toLowerCase().includes('cash'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const upiCollected = paidOrders
    .filter(o => String(o.paymentMethod || '').toLowerCase().includes('upi'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cardCollected = paidOrders
    .filter(o => String(o.paymentMethod || '').toLowerCase().includes('card'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Filtered Payments Table
  const filteredPayments = orders.filter(o => {
    const paid = isOrderPaid(o);
    const method = String(o.paymentMethod || '').toLowerCase();

    if (paymentFilter === 'paid' && !paid) return false;
    if (paymentFilter === 'pending' && paid) return false;
    if (paymentFilter === 'cash' && !method.includes('cash')) return false;
    if (paymentFilter === 'upi' && !method.includes('upi')) return false;
    if (paymentFilter === 'card' && !method.includes('card')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchTable = String(o.tableNumber).toLowerCase().includes(q);
      const matchTxn = String(o.transactionId || '').toLowerCase().includes(q);
      const matchCustomer = String(o.customerName || '').toLowerCase().includes(q);
      return matchId || matchTable || matchTxn || matchCustomer;
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
              <CreditCard className="w-7 h-7 text-emerald-500" />
              <span>Payment & Settlement Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track collected revenue, cash counter settlements, online UPI transactions & pending receivables
            </p>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Total Collection */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-emerald-400">Total Collected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{totalCollected.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">{paidOrders.length} Settled Invoices</div>
          </div>

          {/* 2. Pending Collection */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-400">Pending Receivables</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-2">₹{pendingAmount.toLocaleString()}</div>
            <div className="text-[11px] text-amber-400 mt-0.5">{pendingOrders.length} Table Bills Unpaid</div>
          </div>

          {/* 3. Cash Counter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400">Cash Payments</span>
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{cashCollected.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Counter Received</div>
          </div>

          {/* 4. UPI Payments */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400">UPI Online</span>
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{upiCollected.toLocaleString()}</div>
            <div className="text-[11px] text-blue-400 mt-0.5">Dynamic QR & Apps</div>
          </div>

          {/* 5. Card Payments */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400">Debit / Credit Cards</span>
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{cardCollected.toLocaleString()}</div>
            <div className="text-[11px] text-purple-400 mt-0.5">Verified Online</div>
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table, transaction ID, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'paid', label: '🟢 Paid & Cleared' },
              { id: 'pending', label: '🔴 Pending Collection' },
              { id: 'cash', label: '💵 Cash' },
              { id: 'upi', label: '📱 UPI' },
              { id: 'card', label: '💳 Cards' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPaymentFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  paymentFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Ledger Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Transaction / Order ID</th>
                <th className="px-4 py-3.5">Table</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Bill Amount</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-500 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-700 mx-auto" />
                    <p>No payment records match the current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(order => {
                  const paid = isOrderPaid(order);
                  const isCashReq = order.paymentStatus === 'Cash Payment Requested';

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="font-bold text-slate-200">{order.transactionId || `TXN-PENDING`}</div>
                        <div className="text-[10px] text-slate-500">Order #{order.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                          Table {order.tableNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-300">
                        <div className="font-bold">{order.customerName || 'Dine-In Guest'}</div>
                        {order.customerPhone && <div className="text-[10px] text-slate-500 font-mono">{order.customerPhone}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-black text-sm text-white">
                        ₹{order.total?.toFixed(0)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-300">
                        <div className="font-semibold">{order.paymentMethod || (paid ? 'Online Verified' : 'Dine-In Billing')}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString()} • {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {paid ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                        ) : isCashReq ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-black inline-flex items-center gap-1 animate-bounce">
                            <Banknote className="w-3 h-3 text-emerald-400" />
                            <span>COLLECT CASH</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!paid && (
                            <button
                              type="button"
                              onClick={() => {
                                markTableAsPaidByAdmin(order.tableNumber, 'Cash (Collected by Cashier)');
                                toast.success(`💰 Table ${order.tableNumber} bill settled!`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Collect Cash</span>
                            </button>
                          )}

                          <a
                            href={`/bill?table=${order.tableNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
                            title="View Customer Bill Receipt"
                          >
                            <span>Receipt</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
