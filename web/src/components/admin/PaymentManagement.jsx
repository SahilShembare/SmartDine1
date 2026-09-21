import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Receipt,
  Eye,
  X,
  Printer,
  Check,
  RotateCcw
} from 'lucide-react';
import { useTableOrder } from '../../context/TableOrderContext';
import toast from 'react-hot-toast';
import { formatOrderNumber, formatInvoiceNumber } from '../../utils/orderNumber';

export default function PaymentManagement() {
  const { 
    orders = [], 
    isOrderPaid: isContextOrderPaid, 
    isRealOrder: contextIsRealOrder,
    isOrderToday: contextIsOrderToday,
    markOrderAsPaidByAdmin, 
    markOrderAsUnpaidByAdmin
  } = useTableOrder();
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  const isOrderReal = (o) => {
    if (typeof contextIsRealOrder === 'function') return contextIsRealOrder(o);
    if (!o) return false;
    if (o.isDemo || o.demo) return false;
    const name = String(o.customerName || '').toLowerCase();
    if (name.includes('demo') || name.includes('test')) return false;
    return true;
  };

  const isTodayOrder = (o) => {
    if (typeof contextIsOrderToday === 'function') return contextIsOrderToday(o);
    if (!o?.createdAt) return false;
    try {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  };

  // Online verification helper (UPI, Card, NetBanking are online gateway types)
  const isOnlinePaymentMethod = (method) => {
    const m = String(method || '').toLowerCase();
    if (m.includes('counter') || m.includes('cash') || m.includes('desk')) return false;
    return m.includes('upi') || m.includes('card') || m.includes('netbanking') || m.includes('net banking') || m.includes('razorpay') || m.includes('online');
  };

  const isPaidOrder = (order) => {
    if (!order) return false;
    if (typeof isContextOrderPaid === 'function') return isContextOrderPaid(order);
    const p = String(order.paymentStatus || order.payment_status || '').toLowerCase().trim();
    if (!p || p === 'pending' || p === 'unpaid' || p.includes('requested') || p.includes('awaiting')) return false;
    if (p === 'paid' || p === 'cash paid' || p === 'online paid') return true;
    if (order.paidAt && order.transactionId && !order.transactionId.startsWith('PENDING') && !order.transactionId.startsWith('COUNTER')) return true;
    return false;
  };

  // 100% Real Orders (demo-free)
  const realOrders = useMemo(() => {
    return orders.filter(isOrderReal);
  }, [orders, contextIsRealOrder]);

  // Payment Metrics
  const metrics = useMemo(() => {
    let dailyRevenue = 0;
    let totalRevenue = 0;
    let todayCashTotal = 0;
    let cashTotal = 0;
    let todayOnlineTotal = 0;
    let onlineTotal = 0;
    let pendingCount = 0;
    let todayOrdersCount = 0;

    realOrders.forEach(o => {
      const method = String(o.paymentMethod || '').toLowerCase();
      const isPaid = isPaidOrder(o);
      const s = String(o.status || '').toLowerCase();
      const amt = Number(o.amount || o.total) || 0;
      const isFromToday = isTodayOrder(o) || (o.paidAt && isTodayOrder({ createdAt: o.paidAt }));

      if (s !== 'cancelled') {
        if (isTodayOrder(o)) {
          todayOrdersCount++;
        }

        if (isPaid) {
          totalRevenue += amt;
          const isCash = method.includes('cash') || method.includes('counter');

          if (isCash) {
            cashTotal += amt;
          } else {
            onlineTotal += amt;
          }

          if (isFromToday) {
            dailyRevenue += amt;
            if (isCash) todayCashTotal += amt;
            else todayOnlineTotal += amt;
          }
        } else {
          pendingCount++;
        }
      }
    });

    return { 
      dailyRevenue, 
      totalRevenue, 
      todayCashTotal, 
      cashTotal, 
      todayOnlineTotal, 
      onlineTotal, 
      pendingCount,
      todayOrdersCount 
    };
  }, [realOrders, isContextOrderPaid, contextIsOrderToday]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return realOrders.filter(o => {
      const isPaid = isPaidOrder(o);

      if (filterPaymentStatus === 'paid' && !isPaid) return false;
      if (filterPaymentStatus === 'pending' && isPaid) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const idMatch = String(o.id || o.orderNumber || '').toLowerCase().includes(q);
        const custMatch = String(o.customerName || '').toLowerCase().includes(q);
        const tblMatch = String(o.tableNumber || '').includes(q);
        const methodMatch = String(o.paymentMethod || '').toLowerCase().includes(q);
        if (!idMatch && !custMatch && !tblMatch && !methodMatch) return false;
      }

      return true;
    });
  }, [realOrders, filterPaymentStatus, searchQuery, isContextOrderPaid]);

  const handleMarkPaid = async (order, method = 'Cash (Collected at Counter)') => {
    try {
      const orderId = order.id || order.orderNumber;
      await markOrderAsPaidByAdmin(orderId, method);
      toast.success(`💰 Order #${orderId} marked as Paid (${method})!`, { icon: '✅' });
      if (selectedOrderModal && (selectedOrderModal.id === order.id || selectedOrderModal.orderNumber === order.orderNumber)) {
        setSelectedOrderModal(prev => prev ? { ...prev, paymentStatus: 'Paid', isPaid: true } : null);
      }
    } catch (err) {
      console.error('PaymentManagement handleMarkPaid error:', err);
      toast.error(err.message || 'Failed to update payment status');
    }
  };

  const handleMarkUnpaid = async (order) => {
    try {
      const orderId = order.id || order.orderNumber;
      if (markOrderAsUnpaidByAdmin) {
        await markOrderAsUnpaidByAdmin(orderId);
        toast.success(`Order #${orderId} marked as Unpaid (Pending)`, { icon: '🔄' });
        if (selectedOrderModal && (selectedOrderModal.id === order.id || selectedOrderModal.orderNumber === order.orderNumber)) {
          setSelectedOrderModal(prev => prev ? { ...prev, paymentStatus: 'pending', isPaid: false } : null);
        }
      }
    } catch (err) {
      console.error('PaymentManagement handleMarkUnpaid error:', err);
      toast.error(err.message || 'Failed to revert payment status');
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

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daily Revenue (Today)
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            ₹{metrics.dailyRevenue.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">All-time settled: ₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
        </div>

        {/* 2. Cash Collected Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cash Payments (Today)
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            ₹{metrics.todayCashTotal.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">All-time cash: ₹{metrics.cashTotal.toLocaleString('en-IN')}</p>
        </div>

        {/* 3. Online Payments Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Online / UPI (Today)
          </span>
          <div className="mt-3 text-2xl lg:text-3xl font-bold text-emerald-600 tracking-tight">
            ₹{metrics.todayOnlineTotal.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-slate-400">All-time online: ₹{metrics.onlineTotal.toLocaleString('en-IN')}</p>
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
                filterPaymentStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterPaymentStatus('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPaymentStatus === 'paid' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setFilterPaymentStatus('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterPaymentStatus === 'pending' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
              placeholder="Search order ID, guest, table..."
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
                    No payment records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((order) => {
                  const method = order.paymentMethod || 'Pay at Counter';
                  const isOnline = isOnlinePaymentMethod(method);
                  const isPaid = isPaidOrder(order);

                  return (
                    <tr key={order.id || order.orderNumber} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        #{order.orderNumber || order.id}
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
                            Unpaid {method ? `(${method})` : '(Pending)'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDateTime(order.paidAt || order.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMarkUnpaid(order)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-500 border border-slate-200 font-medium text-[10px] transition cursor-pointer"
                                title="Click to revert to Unpaid"
                              >
                                Revert
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(order, 'Cash (Collected at Counter)')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1 active:scale-95"
                                title="Mark as Paid (Cash Collected at Counter)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Paid</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(order, 'UPI (Collected at Counter)')}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1 active:scale-95"
                                title="Mark as Paid via UPI QR"
                              >
                                <span>UPI</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderModal(order)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                            title="View order details and bill"
                          >
                            <Eye className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Receipt Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Order #{selectedOrderModal.orderNumber || selectedOrderModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-400 block">Table / Type</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderModal.tableNumber ? `Table ${selectedOrderModal.tableNumber}` : 'Online'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrderModal.customerName || 'Guest'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Method</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrderModal.paymentMethod || 'Pay at Counter'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Status</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded-full text-[10px] ${
                    isPaidOrder(selectedOrderModal)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isPaidOrder(selectedOrderModal) ? '🟢 Paid' : '🟠 Unpaid (Pending)'}
                  </span>
                </div>
                {selectedOrderModal.invoiceNumber && (
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-400 block">Invoice Number</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedOrderModal.invoiceNumber}
                    </span>
                  </div>
                )}
                {selectedOrderModal.transactionId && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Transaction Reference</span>
                    <span className="font-mono text-slate-600">
                      {selectedOrderModal.transactionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">Ordered Items</span>
                <div className="space-y-1.5 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {(selectedOrderModal.items || []).map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-800">
                          {item.name}
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          × {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-200 space-y-1 font-medium text-slate-600">
                {selectedOrderModal.subtotal && (
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedOrderModal.subtotal).toFixed(0)}</span>
                  </div>
                )}
                {selectedOrderModal.tax && (
                  <div className="flex justify-between">
                    <span>GST (5%):</span>
                    <span>₹{Number(selectedOrderModal.tax).toFixed(0)}</span>
                  </div>
                )}
                {selectedOrderModal.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedOrderModal.discountAmount).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Bill:</span>
                  <span className="text-emerald-600">
                    ₹{Number(selectedOrderModal.amount || selectedOrderModal.total || 0).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              {!isPaidOrder(selectedOrderModal) ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(selectedOrderModal, 'Cash (Collected at Counter)')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Paid (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(selectedOrderModal, 'UPI (Collected at Counter)')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>UPI</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settled & Paid</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMarkUnpaid(selectedOrderModal)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-600 border border-slate-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                    title="Click to revert to Unpaid"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
