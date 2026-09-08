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
  FileSpreadsheet,
  RotateCcw,
  Eye,
  X,
  Copy,
  Check,
  ShieldAlert,
  Lock
} from 'lucide-react';

export default function AdminPayments() {
  const { 
    orders, 
    markTableAsPaidByAdmin,
    markOrderAsPaidByAdmin,
    refundOrder
  } = useTableOrder();

  const [paymentFilter, setPaymentFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);

  const isOrderRefunded = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || o.payment_status || '').trim().toUpperCase();
    return p === 'REFUNDED' || o.refund_status === 'REFUNDED' || !!o.refunded_at;
  };

  const isOrderFailed = (o) => {
    if (!o) return false;
    const p = String(o.paymentStatus || o.payment_status || '').trim().toUpperCase();
    return p === 'FAILED' || o.status === 'failed';
  };

  const isOrderPaid = (o) => {
    if (!o) return false;
    if (isOrderRefunded(o) || isOrderFailed(o)) return false;
    const p = String(o.paymentStatus || o.payment_status || '').trim().toUpperCase();
    if (p === 'UNPAID' || p === 'PENDING' || p.includes('REQUESTED') || p.includes('AWAITING')) return false;
    return p === 'PAID' || p.includes('PAID') || p.includes('RAZORPAY') || !!o.paid_at || !!o.paidAt;
  };

  const paidOrders = orders.filter(o => isOrderPaid(o) && o.status !== 'cancelled');
  const pendingOrders = orders.filter(o => !isOrderPaid(o) && !isOrderRefunded(o) && o.status !== 'cancelled');
  const refundedOrders = orders.filter(o => isOrderRefunded(o));

  const totalCollected = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const refundedAmount = refundedOrders.reduce((sum, o) => sum + (o.refund_amount || o.total || 0), 0);

  const cashCollected = paidOrders
    .filter(o => String(o.paymentMethod || o.payment_method || '').toLowerCase().includes('cash') || String(o.paymentMethod || '').toLowerCase().includes('counter'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const upiCollected = paidOrders
    .filter(o => String(o.paymentMethod || o.payment_method || '').toLowerCase().includes('upi'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cardCollected = paidOrders
    .filter(o => String(o.paymentMethod || o.payment_method || '').toLowerCase().includes('card'))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const razorpayCollected = paidOrders
    .filter(o => String(o.paymentMethod || o.payment_method || '').toLowerCase().includes('razorpay') || o.payment_gateway === 'Razorpay')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Handle Admin Refund Trigger
  const handleRefundPayment = async (order) => {
    if (!order) return;
    const paymentId = order.razorpay_payment_id || order.transactionId;
    if (!paymentId || !paymentId.startsWith('pay_')) {
      toast.error('Refund is only supported for online Razorpay payments with valid payment ID (pay_...). For cash orders, settle cash directly at counter.');
      return;
    }

    const proceed = window.confirm(
      `Issue full refund of ₹${order.total} for Order #${order.id}?\n\nRazorpay Payment ID: ${paymentId}\n\nThis will send a refund instruction directly to Razorpay gateway.`
    );
    if (!proceed) return;

    setIsRefunding(true);
    try {
      const res = await fetch('/api/refund-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: order.total,
          notes: {
            order_id: order.id,
            table_number: order.tableNumber,
            reason: 'Admin dashboard refund'
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Refund request declined by Razorpay gateway.');
      }

      const refundId = data.refundId || data.refund?.id || `rfnd_${Date.now()}`;
      if (refundOrder) {
        await refundOrder(order.id, {
          refundId,
          refundAmount: order.total,
          reason: 'Admin dashboard refund via Razorpay'
        });
      }

      toast.success(`✅ Refund of ₹${order.total} initiated! (Refund ID: ${refundId})`);
      if (selectedOrderDetails?.id === order.id) {
        setSelectedOrderDetails(prev => ({
          ...prev,
          paymentStatus: 'REFUNDED',
          payment_status: 'REFUNDED',
          refund_status: 'REFUNDED',
          refund_id: refundId
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  // Filtered Payments Table
  const filteredPayments = orders.filter(o => {
    const paid = isOrderPaid(o);
    const refunded = isOrderRefunded(o);
    const failed = isOrderFailed(o);
    const method = String(o.paymentMethod || o.payment_method || '').toLowerCase();

    if (paymentFilter === 'paid' && !paid) return false;
    if (paymentFilter === 'pending' && (paid || refunded || failed)) return false;
    if (paymentFilter === 'refunded' && !refunded) return false;
    if (paymentFilter === 'failed' && !failed) return false;
    if (paymentFilter === 'razorpay' && !method.includes('razorpay') && o.payment_gateway !== 'Razorpay') return false;
    if (paymentFilter === 'cash' && !method.includes('cash') && !method.includes('counter')) return false;
    if (paymentFilter === 'upi' && !method.includes('upi')) return false;
    if (paymentFilter === 'card' && !method.includes('card')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchTable = String(o.tableNumber).toLowerCase().includes(q);
      const matchTxn = String(o.transactionId || '').toLowerCase().includes(q);
      const matchRzpPay = String(o.razorpay_payment_id || '').toLowerCase().includes(q);
      const matchRzpOrd = String(o.razorpay_order_id || '').toLowerCase().includes(q);
      const matchCustomer = String(o.customerName || '').toLowerCase().includes(q);
      return matchId || matchTable || matchTxn || matchRzpPay || matchRzpOrd || matchCustomer;
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
              <span>Razorpay & Settlement Ledger</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time Razorpay payments, HMAC signature verification, cash counter settlements & instant refunds
            </p>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Total Collection */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-emerald-400">Total Cleared</span>
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
            <div className="text-[11px] text-amber-400 mt-0.5">{pendingOrders.length} Counter Bills Pending</div>
          </div>

          {/* 3. Razorpay Online */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-blue-400">Razorpay Online</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{razorpayCollected.toLocaleString()}</div>
            <div className="text-[11px] text-blue-400 mt-0.5">UPI, Cards & NetBanking</div>
          </div>

          {/* 4. Cash Counter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400">Cash Payments</span>
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{cashCollected.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Counter Received</div>
          </div>

          {/* 5. Total Refunded */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-purple-400">Total Refunded</span>
              <RotateCcw className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{refundedAmount.toLocaleString()}</div>
            <div className="text-[11px] text-purple-400 mt-0.5">{refundedOrders.length} Processed Refunds</div>
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table, pay_xxx, order_xxx, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'paid', label: '🟢 Paid' },
              { id: 'pending', label: '🟠 Pending' },
              { id: 'refunded', label: '↩️ Refunded' },
              { id: 'razorpay', label: '⚡ Razorpay' },
              { id: 'cash', label: '💵 Counter' },
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
                <th className="px-4 py-3.5">Order / Payment ID</th>
                <th className="px-4 py-3.5">Table</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Method / Gateway</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Status</th>
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
                  const refunded = isOrderRefunded(order);
                  const failed = isOrderFailed(order);
                  const isCashReq = order.paymentStatus === 'Cash Payment Requested';
                  const paymentId = order.razorpay_payment_id || order.transactionId;
                  const isRzpEligibleForRefund = paid && paymentId && String(paymentId).startsWith('pay_');

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="font-bold text-slate-200">
                          {paymentId || `SD-${order.id}`}
                        </div>
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
                        <div className="font-semibold flex items-center gap-1">
                          {order.payment_gateway === 'Razorpay' || String(order.paymentMethod).includes('Razorpay') ? (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                              ⚡ RAZORPAY
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              COUNTER
                            </span>
                          )}
                          <span className="truncate max-w-[130px]">{order.paymentMethod || 'Dine-In Billing'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString()} • {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {refunded ? (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black inline-flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            <span>REFUNDED</span>
                          </span>
                        ) : paid ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                        ) : failed ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-black inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>FAILED</span>
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
                          {/* View Transaction Details Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(order)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                            title="View Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Collect Cash if pending */}
                          {!paid && !refunded && (
                            <button
                              type="button"
                              onClick={() => {
                                if (markOrderAsPaidByAdmin) {
                                  markOrderAsPaidByAdmin(order.id, 'Cash (Collected by Cashier)');
                                } else {
                                  markTableAsPaidByAdmin(order.tableNumber, 'Cash (Collected by Cashier)');
                                }
                                toast.success(`💰 Order #${order.id} marked as PAID!`);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                              title="Mark as Paid at Counter"
                            >
                              <Banknote className="w-3 h-3" />
                              <span className="hidden sm:inline">Cash</span>
                            </button>
                          )}

                          {/* Refund Button for Razorpay payments */}
                          {isRzpEligibleForRefund && (
                            <button
                              type="button"
                              disabled={isRefunding}
                              onClick={() => handleRefundPayment(order)}
                              className="px-2.5 py-1 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1 disabled:opacity-50"
                              title="Issue Razorpay Refund"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden sm:inline">Refund</span>
                            </button>
                          )}

                          <a
                            href={`/bill?table=${order.tableNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
                            title="View Customer Bill Receipt"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* ============================================================ */}
      {/* TRANSACTION DETAILS MODAL                                    */}
      {/* ============================================================ */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Transaction Details</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      #SD-{selectedOrderDetails.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Table {selectedOrderDetails.tableNumber} • {selectedOrderDetails.customerName || 'Guest'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment Status</span>
                  <span className="text-sm font-black text-white">
                    {selectedOrderDetails.paymentStatus || selectedOrderDetails.payment_status || 'PENDING'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Amount</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{selectedOrderDetails.total?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Gateway & Verification Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">Gateway & Security Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Payment Gateway</span>
                    <span className="font-bold text-white">
                      {selectedOrderDetails.payment_gateway || (String(selectedOrderDetails.paymentMethod).includes('Razorpay') ? 'Razorpay' : 'Counter / Offline')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Signature Verification</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      {selectedOrderDetails.razorpay_signature ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>HMAC-SHA256 Verified</span>
                        </>
                      ) : (
                        <span className="text-slate-500">N/A (Counter Bill)</span>
                      )}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-1 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Razorpay Payment ID</span>
                      <span className="font-mono font-bold text-white">
                        {selectedOrderDetails.razorpay_payment_id || selectedOrderDetails.transactionId || 'None'}
                      </span>
                    </div>
                    {selectedOrderDetails.razorpay_payment_id && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrderDetails.razorpay_payment_id);
                          toast.success('Copied Payment ID');
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {selectedOrderDetails.razorpay_order_id && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-1 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold">Razorpay Order ID</span>
                      <span className="font-mono text-slate-300">{selectedOrderDetails.razorpay_order_id}</span>
                    </div>
                  )}
                  {selectedOrderDetails.refund_id && (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800 col-span-1 sm:col-span-2">
                      <span className="text-[10px] text-purple-300 block font-semibold">Refund ID</span>
                      <span className="font-mono text-purple-200">{selectedOrderDetails.refund_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items in Order */}
              {selectedOrderDetails.items && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Ordered Dishes ({selectedOrderDetails.items.length})</span>
                  <div className="max-h-32 overflow-y-auto divide-y divide-slate-800/60 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    {selectedOrderDetails.items.map((it, idx) => (
                      <div key={idx} className="py-1 flex justify-between text-xs">
                        <span className="text-slate-300">{it.quantity}x {it.name}</span>
                        <span className="font-bold text-white">₹{(it.price * it.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Razorpay Refund Action */}
                {isOrderPaid(selectedOrderDetails) && selectedOrderDetails.razorpay_payment_id?.startsWith('pay_') && (
                  <button
                    disabled={isRefunding}
                    onClick={() => handleRefundPayment(selectedOrderDetails)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRefunding ? 'Refunding...' : 'Issue Refund'}</span>
                  </button>
                )}

                {/* Mark as Paid at Counter if Pending */}
                {!isOrderPaid(selectedOrderDetails) && !isOrderRefunded(selectedOrderDetails) && (
                  <button
                    onClick={() => {
                      if (markOrderAsPaidByAdmin) {
                        markOrderAsPaidByAdmin(selectedOrderDetails.id, 'Cash (Collected by Cashier)');
                      } else {
                        markTableAsPaidByAdmin(selectedOrderDetails.tableNumber, 'Cash (Collected by Cashier)');
                      }
                      setSelectedOrderDetails(prev => ({
                        ...prev,
                        paymentStatus: 'PAID',
                        payment_status: 'PAID'
                      }));
                      toast.success(`💰 Order #${selectedOrderDetails.id} marked as PAID!`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Mark Paid (Cash)</span>
                  </button>
                )}

                <a
                  href={`/bill?table=${selectedOrderDetails.tableNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
