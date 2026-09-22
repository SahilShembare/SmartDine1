import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Banknote, 
  Download, 
  Printer, 
  ArrowLeft, 
  Sparkles, 
  Gift, 
  Check, 
  Lock, 
  UtensilsCrossed, 
  AlertCircle,
  FileText,
  Copy,
  Layers,
  ChevronRight,
  User,
  Crown,
  Image as ImageIcon,
  FileDown,
  X
} from 'lucide-react';
import { openRazorpayPayment } from '../utils/razorpay';
import CustomerFeedbackModal from '../components/CustomerFeedbackModal';
import { formatOrderNumber, formatInvoiceNumber, getOrAssignInvoiceNumber, getNextInvoiceNumber } from '../utils/orderNumber';
import { localStore } from '../firebase/config';
import BillDownloadModal from '../components/BillDownloadModal';
import { printBill, downloadBillAsPdf, downloadBillAsJpg } from '../utils/billReceipt';

export default function CustomerWebBill() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { 
    orders = [],
    currentTable, 
    getCombinedTableBill, 
    requestTableBill, 
    requestCashPaymentForTable,
    payTableBill 
  } = useTableOrder();

  const orderIdParam = searchParams.get('orderId');
  const viewReceiptParam = searchParams.get('view') === 'receipt';
  
  // Resolve target table
  const tableParam = searchParams.get('table') || currentTable || localStorage.getItem('smartdine_active_table') || '01';
  const formattedTable = String(tableParam).padStart(2, '0');

  // Resolve target order: check URL orderId first, then last order placed from this browser session
  const lastPlacedOrderId = localStorage.getItem('smartdine_last_order_id');
  const effectiveOrderId = orderIdParam || lastPlacedOrderId || null;
  
  // Robust targetOrder resolution across React state AND localStore
  const targetOrder = useMemo(() => {
    const allKnownOrders = (orders && orders.length > 0) ? orders : (() => {
      try { return localStore.getOrders() || []; } catch { return []; }
    })();

    if (effectiveOrderId) {
      const effStr = String(effectiveOrderId).trim();
      const matchOrder = (o) => (
        String(o.id) === effStr || 
        String(o.orderNumber) === effStr ||
        (o.firestoreDocId && String(o.firestoreDocId) === effStr) ||
        (o.orderNumber && formatOrderNumber(o.orderNumber) === effStr) ||
        (o.id && formatOrderNumber(o.id) === effStr)
      );

      const found = allKnownOrders.find(matchOrder);
      if (found) return found;
    }

    // Also check smartdine_customer_order_ids from localStorage
    try {
      const savedIds = JSON.parse(localStorage.getItem('smartdine_customer_order_ids') || '[]');
      if (Array.isArray(savedIds) && savedIds.length > 0) {
        for (const sid of savedIds) {
          const sStr = String(sid).trim();
          const foundSaved = allKnownOrders.find(o => 
            String(o.id) === sStr || 
            String(o.orderNumber) === sStr || 
            (o.firestoreDocId && String(o.firestoreDocId) === sStr)
          );
          if (foundSaved) return foundSaved;
        }
      }
    } catch {}

    // Fallback: If table has any orders, pick the latest order for this table
    const tableOrders = allKnownOrders.filter(o => 
      String(o.tableNumber).padStart(2, '0') === formattedTable
    );
    if (tableOrders.length > 0) {
      return [...tableOrders].sort((a, b) => {
        const tA = new Date(a.createdAt || a.paidAt || 0).getTime();
        const tB = new Date(b.createdAt || b.paidAt || 0).getTime();
        return tB - tA;
      })[0];
    }

    return null;
  }, [effectiveOrderId, orders, formattedTable]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Payment method: 'razorpay' | 'upi' | 'card' | 'netbanking' | 'cash'
  const [paymentMode, setPaymentMode] = useState('razorpay');

  // UPI sub-options
  const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' | 'app' | 'id'
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');

  // Card sub-options
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net Banking sub-options
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Flow states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [cashRequested, setCashRequested] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [showBillFeedback, setShowBillFeedback] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const rawBillData = getCombinedTableBill(formattedTable, discountAmount);

  // Helper to check if order is paid (defined before billData calculation)
  const isOrderPaid = (order) => {
    if (!order) return false;
    if (order.isPaid === true) return true;

    // Direct check for Razorpay or online UPI transaction proof
    const txn = String(order.transactionId || order.razorpay_payment_id || '').trim();
    if (txn && (txn.startsWith('pay_') || txn.startsWith('TXN_PAY') || (txn.startsWith('TXN-') && !txn.includes('COUNTER') && !txn.includes('PENDING')) || (order.paymentGateway && String(order.paymentGateway).toLowerCase() === 'razorpay' && !txn.startsWith('PENDING') && !txn.startsWith('COUNTER')))) {
      return true;
    }

    const pStatus = String(order.paymentStatus || order.payment_status || '').trim().toLowerCase();
    if (pStatus === 'paid' || pStatus.includes('paid') || pStatus === 'settled' || pStatus === 'completed') {
      if (!pStatus.includes('unpaid') && !pStatus.includes('not paid') && !pStatus.includes('cash payment requested')) {
        return true;
      }
    }

    if (
      !pStatus ||
      pStatus === 'unpaid' || 
      pStatus === 'pending' || 
      pStatus.includes('requested') || 
      pStatus.includes('awaiting')
    ) {
      return false;
    }

    if ((order.paidAt || order.paid_at) && txn && !txn.startsWith('PENDING') && !txn.startsWith('COUNTER')) {
      return true;
    }
    return false;
  };

  // Deterministic, persistent GST Tax Invoice Number for this session/table (Declared BEFORE billData to eliminate TDZ error)
  const sessionInvoiceNumber = useMemo(() => {
    if (targetOrder?.invoiceNumber) return formatInvoiceNumber(targetOrder.invoiceNumber);
    const existingPaid = (orders || []).find(o => 
      String(o.tableNumber).padStart(2, '0') === formattedTable && o.invoiceNumber
    );
    if (existingPaid?.invoiceNumber) return formatInvoiceNumber(existingPaid.invoiceNumber);
    return getOrAssignInvoiceNumber(targetOrder, orders);
  }, [targetOrder, orders, formattedTable]);

  // If targetOrder is known, display specifically targetOrder so other orders on this table do not pollute the bill
  const billData = useMemo(() => {
    if (targetOrder) {
      const items = (targetOrder.items || []).map(i => ({
        itemId: i.itemId || i.id,
        name: i.name,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        totalPrice: (Number(i.price) || 0) * (Number(i.quantity) || 1),
        isVeg: i.isVeg !== false
      }));
      const subtotal = Number(targetOrder.subtotal) || items.reduce((sum, i) => sum + i.totalPrice, 0);
      const disc = Number(targetOrder.discountAmount) || discountAmount || 0;
      const discountedSub = Math.max(0, subtotal - disc);
      const tax = Number(targetOrder.tax) || Math.round(discountedSub * 0.05 * 100) / 100;
      const total = Number(targetOrder.total) || Math.round((discountedSub + tax) * 100) / 100;
      const txn = String(targetOrder.transactionId || targetOrder.razorpay_payment_id || '').trim();
      const hasOnlineProof = txn.startsWith('pay_') || txn.startsWith('TXN_PAY') || (txn.startsWith('TXN-') && !txn.includes('COUNTER') && !txn.includes('PENDING'));
      const isPaid = isOrderPaid(targetOrder) || hasOnlineProof;

      return {
        tableNumber: targetOrder.tableNumber || formattedTable,
        activeOrders: isPaid ? [] : [targetOrder],
        clearedOrders: isPaid ? [targetOrder] : [],
        clearedOrderCount: 0,
        totalClearedAmount: 0,
        orderCount: 1,
        orderIds: [targetOrder.orderNumber || targetOrder.id],
        invoiceNumber: targetOrder.invoiceNumber || sessionInvoiceNumber,
        consolidatedItems: items,
        subtotal,
        discountAmount: disc,
        tax,
        total,
        isPaid,
        hasUnpaid: !isPaid,
        billStatus: isPaid ? 'Paid' : 'Unpaid (Pay at Counter)'
      };
    }

    return {
      ...rawBillData,
      clearedOrderCount: 0,
      totalClearedAmount: 0
    };
  }, [rawBillData, targetOrder, discountAmount, formattedTable, sessionInvoiceNumber]);

  // Compute settled receipt data for table or target order
  const receiptData = useMemo(() => {
    if (paymentSuccessData) return paymentSuccessData;

    // 1. If targetOrder is specifically requested: ALWAYS return receipt for targetOrder whether paid or counter pending
    if (targetOrder) {
      const txn = String(targetOrder.transactionId || targetOrder.razorpay_payment_id || '').trim();
      const hasOnlineProof = txn.startsWith('pay_') || txn.startsWith('TXN_PAY') || (txn.startsWith('TXN-') && !txn.includes('COUNTER') && !txn.includes('PENDING'));
      const isPaid = isOrderPaid(targetOrder) || hasOnlineProof;
      const items = (targetOrder.items || []).map(i => ({
        itemId: i.itemId || i.id,
        name: i.name,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        totalPrice: (Number(i.price) || 0) * (Number(i.quantity) || 1),
        isVeg: i.isVeg !== false
      }));
      const total = Number(targetOrder.total || targetOrder.amount || 0);
      const subtotal = Number(targetOrder.subtotal) || (total * 0.95);
      const tax = Number(targetOrder.tax) || (total * 0.05);
      const targetInvNo = targetOrder.invoiceNumber || sessionInvoiceNumber;
      const targetOrdNo = formatOrderNumber(targetOrder.orderNumber || targetOrder.id);

      const resolvedPaymentMethod = isPaid
        ? (targetOrder.paymentMethod && !targetOrder.paymentMethod.toLowerCase().includes('counter')
            ? targetOrder.paymentMethod
            : (hasOnlineProof ? 'Online UPI (Verified)' : 'Online Payment (Paid)'))
        : (targetOrder.paymentMethod || 'Pay at Counter');

      const resolvedPaymentStatus = isPaid ? 'PAID' : (targetOrder.paymentStatus || 'PENDING');

      return {
        invoiceNumber: formatInvoiceNumber(targetInvNo),
        orderNumber: targetOrdNo,
        orderId: targetOrder.id,
        transactionId: txn || `TXN-${targetOrdNo}`,
        tableNumber: targetOrder.tableNumber || formattedTable,
        paymentMethod: resolvedPaymentMethod,
        paymentStatus: resolvedPaymentStatus,
        amount: total,
        discount: Number(targetOrder.discountAmount) || 0,
        subtotal: subtotal,
        tax: tax,
        items: items,
        paidAt: targetOrder.paidAt ? new Date(targetOrder.paidAt).toLocaleString() : (targetOrder.createdAt ? new Date(targetOrder.createdAt).toLocaleString() : new Date().toLocaleString()),
        orderCount: 1,
        customerName: targetOrder.customerName || currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`,
        isPaid: isPaid
      };
    }

    // 2. Fallback: If no target order is specified, get the latest settled transaction for this table
    const allTablePaid = (orders || []).filter(o => 
      String(o.tableNumber).padStart(2, '0') === formattedTable && isOrderPaid(o)
    );

    if (allTablePaid.length > 0) {
      // Sort newest first
      const sortedPaid = [...allTablePaid].sort((a, b) => {
        const timeA = new Date(a.paidAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.paidAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const latestOrder = sortedPaid[0];
      const targetTxnId = latestOrder.transactionId || latestOrder.razorpay_payment_id;

      // Group ONLY orders that share the EXACT same settlement transaction ID (e.g. combined table payment)
      const sameBatchOrders = (targetTxnId && !targetTxnId.startsWith('TXN-'))
        ? sortedPaid.filter(o => (o.transactionId || o.razorpay_payment_id) === targetTxnId)
        : [latestOrder];

      const itemMap = new Map();
      sameBatchOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const key = item.itemId || item.name;
          if (itemMap.has(key)) {
            const exist = itemMap.get(key);
            exist.quantity += (Number(item.quantity) || 1);
            exist.totalPrice += ((Number(item.price) || 0) * (Number(item.quantity) || 1));
          } else {
            itemMap.set(key, {
              itemId: item.itemId || item.id,
              name: item.name,
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1,
              totalPrice: (Number(item.price) || 0) * (Number(item.quantity) || 1),
              isVeg: item.isVeg !== false
            });
          }
        });
      });

      const items = Array.from(itemMap.values());
      const total = sameBatchOrders.reduce((sum, o) => sum + (Number(o.total || o.amount) || 0), 0);
      const subtotal = sameBatchOrders.reduce((sum, o) => sum + (Number(o.subtotal) || ((Number(o.total || o.amount) || 0) * 0.95) || 0), 0);
      const tax = sameBatchOrders.reduce((sum, o) => sum + (Number(o.tax) || ((Number(o.total || o.amount) || 0) * 0.05) || 0), 0);
      const discount = sameBatchOrders.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);
      const batchInvNo = latestOrder.invoiceNumber || sessionInvoiceNumber;
      const batchOrdNos = sameBatchOrders.map(o => formatOrderNumber(o.orderNumber || o.id)).join(', ');

      return {
        invoiceNumber: formatInvoiceNumber(batchInvNo),
        orderNumber: batchOrdNos,
        orderId: latestOrder.id,
        transactionId: targetTxnId || `TXN-${formatOrderNumber(latestOrder.id)}`,
        tableNumber: formattedTable,
        paymentMethod: latestOrder.paymentMethod || 'Online / Settle at Counter (Paid)',
        paymentStatus: 'PAID',
        amount: total,
        discount: discount,
        subtotal: subtotal,
        tax: tax,
        items: items,
        paidAt: latestOrder.paidAt ? new Date(latestOrder.paidAt).toLocaleString() : (latestOrder.createdAt ? new Date(latestOrder.createdAt).toLocaleString() : new Date().toLocaleString()),
        orderCount: sameBatchOrders.length,
        customerName: latestOrder.customerName || currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`,
        isPaid: true
      };
    }

    // 3. Fallback: If table has active items and user requested receipt, create table session receipt
    if (billData && billData.consolidatedItems && billData.consolidatedItems.length > 0) {
      return {
        invoiceNumber: sessionInvoiceNumber,
        orderNumber: billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-TABLE',
        orderId: billData.orderIds?.[0] || 'ORD-TABLE',
        transactionId: 'TXN-COUNTER',
        tableNumber: formattedTable,
        paymentMethod: 'Pay at Counter',
        paymentStatus: 'PENDING',
        amount: billData.total,
        discount: billData.discountAmount || 0,
        subtotal: billData.subtotal,
        tax: billData.tax,
        items: billData.consolidatedItems,
        paidAt: new Date().toLocaleString(),
        orderCount: billData.orderCount || 1,
        customerName: currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`,
        isPaid: false
      };
    }

    // 4. Default guaranteed fallback receipt so receipt is NEVER null
    return {
      invoiceNumber: sessionInvoiceNumber,
      orderNumber: `ORD-${formattedTable}-01`,
      orderId: `ORD-${formattedTable}-01`,
      transactionId: 'TXN-COUNTER',
      tableNumber: formattedTable,
      paymentMethod: 'Pay at Counter',
      paymentStatus: 'PENDING',
      amount: billData?.total || 0,
      discount: billData?.discountAmount || 0,
      subtotal: billData?.subtotal || 0,
      tax: billData?.tax || 0,
      items: billData?.consolidatedItems || [],
      paidAt: new Date().toLocaleString(),
      orderCount: billData?.orderCount || 1,
      customerName: currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`,
      isPaid: false
    };
  }, [paymentSuccessData, targetOrder, orders, formattedTable, currentUser, sessionInvoiceNumber, billData]);

  const effectiveReceipt = receiptData;
  const activeReceipt = effectiveReceipt;
  const hasSettledReceipt = Boolean(receiptData && (paymentSuccessData || receiptData.isPaid));
  const hasActiveUnpaidOrders = (billData.activeOrders && billData.activeOrders.length > 0) || (targetOrder && !isOrderPaid(targetOrder));

  // Determine if viewing receipt
  const [showReceiptView, setShowReceiptView] = useState(false);

  const isViewingReceipt = Boolean(
    paymentSuccessData || 
    viewReceiptParam || 
    showReceiptView || 
    (!hasActiveUnpaidOrders && hasSettledReceipt)
  );

  // Format Card Number
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'ROYAL50') {
      if (billData.subtotal < 299) {
        toast.error('Min order ₹299 required for ROYAL50');
        return;
      }
      const disc = Math.min(billData.subtotal * 0.5, 150);
      setDiscountAmount(disc);
      setAppliedCoupon({ code: 'ROYAL50', discount: disc, desc: '50% Royal Discount' });
      toast.success(`ROYAL50 applied! Saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else if (clean === 'FEAST100') {
      if (billData.subtotal < 499) {
        toast.error('Min order ₹499 required for FEAST100');
        return;
      }
      setDiscountAmount(100);
      setAppliedCoupon({ code: 'FEAST100', discount: 100, desc: '₹100 Feast Discount' });
      toast.success('FEAST100 applied! Saved ₹100', { icon: '🎁' });
    } else if (clean === 'WELCOME20') {
      const disc = Math.min(billData.subtotal * 0.2, 80);
      setDiscountAmount(disc);
      setAppliedCoupon({ code: 'WELCOME20', discount: disc, desc: '20% Welcome Discount' });
      toast.success(`WELCOME20 applied! Saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else if (clean === 'THALI30') {
      const disc = Math.min(billData.subtotal * 0.3, 120);
      setDiscountAmount(disc);
      setAppliedCoupon({ code: 'THALI30', discount: disc, desc: '30% Thali Special Discount' });
      toast.success(`THALI30 applied! Saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else {
      toast.error('Invalid coupon. Try ROYAL50, FEAST100, or WELCOME20');
    }
  };

  const removeCoupon = () => {
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast('Coupon removed', { icon: 'ℹ️' });
  };

  // Request final bill
  const handleRequestBill = async () => {
    setIsRequesting(true);
    try {
      await requestTableBill(formattedTable);
      toast.success('🛎️ Final Bill Requested! Captain notified.', { icon: '📄' });
    } catch (err) {
      toast.error(err.message || 'Failed to request bill');
    } finally {
      setIsRequesting(false);
    }
  };

  // Pay Now or Request Cash Collection
  const handlePayNow = async () => {
    if (billData.total <= 0) {
      toast.error('No pending bill amount to pay.');
      return;
    }

    // 1. CASH PAYMENT FLOW: Customer requests cash collection from cashier/captain
    if (paymentMode === 'cash') {
      setIsPaying(true);
      try {
        await requestCashPaymentForTable(formattedTable);
        setCashRequested(true);
        toast.success(`💵 Cash Payment Requested! Please hand ₹${billData.total.toFixed(0)} to Captain / Cashier counter.`, {
          duration: 6000,
          icon: '🛎️'
        });
      } catch (err) {
        toast.error(err.message || 'Failed to request cash payment');
      } finally {
        setIsPaying(false);
      }
      return;
    }

    // 2. RAZORPAY ONLINE GATEWAY PAYMENT FLOW
    if (paymentMode === 'razorpay') {
      setIsPaying(true);
      openRazorpayPayment({
        amount: billData.total,
        name: 'SmartDine Restaurant',
        description: `Table ${formattedTable} Final Bill Settlement`,
        orderId: `SD-BILL-${formattedTable}-${Date.now()}`,
        customer: {
          name: currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`,
          contact: currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '',
          email: currentUser?.email || 'guest@smartdine.com'
        },
        onSuccess: async (rzpResponse) => {
          await executeBillPaymentSuccess({
            paymentLabel: `Razorpay Online (${rzpResponse.razorpay_payment_id})`,
            transactionId: rzpResponse.razorpay_payment_id
          });
        },
        onFailure: (errMsg) => {
          setIsPaying(false);
          toast.error(errMsg || 'Razorpay payment was cancelled or failed.');
        }
      });
      return;
    }

    // 3. OTHER ONLINE PAYMENT FLOWS (UPI / Card / NetBanking)
    if (paymentMode === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
        toast.error('Enter valid 16-digit Card Number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error('Enter expiry MM/YY');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        toast.error('Enter 3-digit CVV');
        return;
      }
    }

    if (paymentMode === 'upi' && upiMethod === 'id' && !upiId.includes('@')) {
      toast.error('Enter valid UPI ID (e.g. name@upi)');
      return;
    }

    setIsPaying(true);
    const paymentLabel = 
      paymentMode === 'upi' ? `Online UPI (${upiMethod === 'qr' ? 'Table Dynamic QR' : upiMethod === 'id' ? upiId : selectedUpiApp})` :
      paymentMode === 'card' ? `Online Card (ending ${cardNumber.slice(-4)})` :
      `Online Net Banking (${selectedBank})`;

    const txnId = `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    await executeBillPaymentSuccess({ paymentLabel, transactionId: txnId });
  };

  const executeBillPaymentSuccess = async ({ paymentLabel, transactionId }) => {
    try {
      const settledInvoice = sessionInvoiceNumber;
      await payTableBill(formattedTable, {
        paymentMethod: paymentLabel,
        transactionId: transactionId,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        invoiceNumber: settledInvoice,
        orderId: targetOrder?.id || effectiveOrderId
      });

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setCashRequested(false);

      setPaymentSuccessData({
        invoiceNumber: settledInvoice,
        orderNumber: billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001',
        transactionId: transactionId,
        tableNumber: formattedTable,
        paymentMethod: paymentLabel,
        paymentStatus: 'PAID',
        isPaid: true,
        amount: billData.total,
        discount: discountAmount,
        subtotal: billData.subtotal,
        tax: billData.tax,
        items: billData.consolidatedItems,
        paidAt: new Date().toLocaleString()
      });

      setShowReceiptView(true);

      toast.success('✅ Online Payment Verified & Successful!', { icon: '🎉' });
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  // PRINT BILL (High-compatibility print)
  const handlePrintReceipt = () => {
    printBill(activeReceipt);
  };

  // 1. DOWNLOAD AS PDF (Real .pdf file download)
  const handleDownloadPdf = () => {
    downloadBillAsPdf(activeReceipt);
    setShowDownloadModal(false);
  };

  // 2. DOWNLOAD AS IMAGE (Pure White JPG file download)
  const handleDownloadImage = () => {
    downloadBillAsJpg(activeReceipt);
    setShowDownloadModal(false);
  };
  const handleDownloadJpg = handleDownloadImage;

  // ================= PAID TAX INVOICE & BILL RECEIPT VIEW =================
  if (isViewingReceipt && (effectiveReceipt || activeReceipt)) {
    const receipt = effectiveReceipt || activeReceipt;
    const items = (receipt.items && receipt.items.length > 0) ? receipt.items : [];
    const totalAmt = Number(receipt.amount ?? 0);
    const subtotalAmt = Number(receipt.subtotal ?? (totalAmt * 0.95));
    const taxAmt = Number(receipt.tax ?? (totalAmt * 0.05));
    const discAmt = Number(receipt.discount ?? 0);
    const invNo = formatInvoiceNumber(receipt.invoiceNumber || sessionInvoiceNumber);
    const ordNo = receipt.orderNumber || billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001';
    const txnId = receipt.transactionId || 'TXN-SETTLED';
    const payMethod = receipt.paymentMethod || 'Online / Counter Settle (Paid)';
    const paidTime = receipt.paidAt || new Date().toLocaleString();
    const tblNo = receipt.tableNumber || formattedTable;
    const customerName = receipt.customerName || currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${tblNo} Guest`;

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-5 font-sans relative selection:bg-orange-500 selection:text-white">
        
        {/* Download Format Selector Modal (PDF vs Image) */}
        <BillDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          receipt={receipt}
        />

        {/* Outer Receipt Container */}
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-800 pb-4">
            <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-inner">
              <Receipt className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">SmartDine Restaurant</h1>
            <p className="text-[11px] text-slate-400">GSTIN: 27AABCS1429B1ZB • FSSAI Lic: 11521034000452</p>
            <p className="text-[10px] text-slate-500">Fine Dining & Authentic Delicacies • Table {tblNo}</p>
          </div>

          {/* Meta Information Bar */}
          <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Invoice No</span>
              <span className="font-mono text-amber-400 font-black text-[11px]">{invNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Order No</span>
              <span className="font-mono text-slate-200 font-bold text-[11px]">{ordNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Table / Guest</span>
              <span className="text-slate-200 font-bold text-[11px]">Table {tblNo} • {customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Date & Time</span>
              <span className="text-slate-300 text-[10px]">{paidTime}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-900 flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-bold uppercase">Txn ID</span>
              <span className="font-mono text-slate-400">{txnId}</span>
            </div>
          </div>

          {/* Consolidated Ordered Items List */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 border-b border-slate-800 pb-1.5">
              <span>Item & Quantity</span>
              <span>Amount</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900/50">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.isVeg !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-slate-200 font-medium truncate">{item.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">×{item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300 text-xs shrink-0">
                    ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-200 font-bold">₹{subtotalAmt.toFixed(2)}</span>
              </div>
              {discAmt > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount</span>
                  <span>-₹{discAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>GST (5% SGST + CGST)</span>
                <span className="text-slate-300">₹{taxAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-black text-white">
                <span>{receipt.isPaid ? 'Total Paid Amount' : 'Total Bill Amount'}</span>
                <span className={`${receipt.isPaid ? 'text-emerald-400' : 'text-amber-400'} text-xl font-black font-mono`}>₹{totalAmt.toFixed(2)}</span>
              </div>
            </div>

            {/* Official Status Stamp */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-center text-xs font-bold ${
              receipt.isPaid
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              {receipt.isPaid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Paid & Verified Tax Invoice</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>Pay at Counter (Pending Cash Settlement)</span>
                </>
              )}
            </div>

          </div>

          <div className="flex flex-col gap-2">
            {!receipt.isPaid && (
              <button
                type="button"
                onClick={() => {
                  setShowReceiptView(false);
                  setSearchParams(prev => {
                    const n = new URLSearchParams(prev);
                    n.delete('view');
                    return n;
                  });
                  navigate(`/bill?table=${tblNo}${receipt.orderId ? `&orderId=${receipt.orderId}` : ''}`);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>Pay Bill Online (UPI / Card / NetBanking)</span>
              </button>
            )}

            {/* Post-Payment Feedback Button */}
            {receipt.isPaid && (
              <button
                type="button"
                onClick={() => setShowBillFeedback(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>⭐ Rate Food & Dining Experience</span>
              </button>
            )}

            {/* Back to Billing / Checkout View */}
            <button
              type="button"
              onClick={() => {
                setShowReceiptView(false);
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.delete('view');
                  return n;
                });
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-slate-800 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Bill Checkout & Settlement</span>
            </button>

            {(receipt.orderId || billData.orderIds?.[0] || targetOrder?.id) && (
              <Link
                to={`/track/${receipt.orderId || billData.orderIds?.[0] || targetOrder?.id}`}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Track Food Preparation & Kitchen Status →</span>
              </Link>
            )}

            <Link
              to={`/menu?table=${tblNo}`}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Back to Menu (Table {tblNo})</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Download Bill</span>
              </button>
            </div>
          </div>

        </div>

        {/* Post-Payment Feedback Modal */}
        <CustomerFeedbackModal
          isOpen={showBillFeedback}
          orderId={receipt.orderId || invNo || 'SD1024'}
          tableNumber={tblNo}
          orderItems={items}
          amount={totalAmt}
          onComplete={() => setShowBillFeedback(false)}
          onSkip={() => setShowBillFeedback(false)}
        />
      </div>
    );
  }

  // ================= EMPTY TABLE STATE (NO ACTIVE & NO CLEARED ORDERS) =================
  if (billData.activeOrders.length === 0 && !hasSettledReceipt && !targetOrder) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">No Active Orders on Table {formattedTable}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              There are currently no dishes ordered or pending payment for this dining table.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to={`/menu?table=${formattedTable}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Browse Menu & Order Dishes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ================= 1-PAGE UNIFIED BILLING & PAYMENT VIEW =================
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 p-3 sm:p-5 font-sans flex items-center justify-center selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-5xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Compact Top Bar */}
        <div className="bg-slate-950 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to={formattedTable ? `/menu?table=${formattedTable}` : '/menu'}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Return to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>SmartDine Restaurant</span>
                <span className="text-[10px] text-amber-400 font-normal">• Table {formattedTable}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowReceiptView(true);
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.set('view', 'receipt');
                  return n;
                });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] border border-slate-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="View full tax invoice receipt"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>View Receipt</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReceipt}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="Print Bill to physical printer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-[11px] border border-slate-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="Download Bill as PDF or JPG"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
              hasActiveUnpaidOrders
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-950 text-emerald-400 border-emerald-700'
            }`}>
              {hasActiveUnpaidOrders && <Clock className="w-3 h-3" />}
              <span>{hasActiveUnpaidOrders ? 'UNPAID' : 'PAID'}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden xs:inline">{sessionInvoiceNumber}</span>
          </div>
        </div>

        {/* 1-Page 2-Column Responsive Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1">
          
          {/* LEFT COLUMN: Consolidated Items & Bill Calculation (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-slate-950/40 space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-orange-500" />
                  <span>Order Delicacies ({billData.consolidatedItems.length})</span>
                </h2>

                {billData.orderCount > 1 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {billData.orderCount} Orders Combined
                  </span>
                )}
              </div>

              {/* Items List (Scrollable if many dishes) */}
              {billData.consolidatedItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <p>No unpaid dishes on Table {formattedTable}.</p>
                  <Link to="/menu" className="text-amber-400 underline font-bold">Open Menu</Link>
                </div>
              ) : (
                <div className="max-h-[220px] lg:max-h-[260px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/60">
                  {billData.consolidatedItems.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center shrink-0 ${
                          item.isVeg ? 'border-emerald-500 bg-emerald-950/60' : 'border-rose-500 bg-rose-950/60'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        </span>
                        <span className="font-bold text-slate-200 truncate">{item.name}</span>
                        <span className="text-amber-400 font-extrabold text-[11px]">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-300 shrink-0">₹{item.totalPrice.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal & Taxes Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-bold">₹{billData.subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>GST (5% SGST + CGST)</span>
                <span className="text-slate-300 font-medium">₹{billData.tax.toFixed(2)}</span>
              </div>

              <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
                <span>Payable Amount</span>
                <span className="text-amber-400 text-xl font-black font-mono">₹{billData.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick Bill Actions (Print & Download PDF/JPG) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Print current bill"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-orange-400 border border-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Download bill as PDF or JPG"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Download Bill</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: 1-Page Payment Mode & Pay Action (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">

              {/* Active Cash/Counter Settlement Pending Banner */}
              {(!effectiveReceipt?.isPaid && !billData.isPaid && (hasActiveUnpaidOrders || (cashRequested && !effectiveReceipt?.isPaid) || billData.activeOrders.some(o => !isOrderPaid(o) && (String(o.paymentStatus || '').toLowerCase().includes('requested') || String(o.paymentMethod || '').toLowerCase().includes('counter'))))) ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 animate-in fade-in">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>🟠 Bill Status: UNPAID (Pay at Counter)</span>
                      {targetOrder && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                          #{formatOrderNumber(targetOrder.orderNumber || targetOrder.id)}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-200/90 text-[11px] leading-relaxed">
                      Order sent to kitchen! Table #{formattedTable} bill of <strong className="text-white font-mono">₹{billData.total.toFixed(0)}</strong> is currently <strong>UNPAID</strong>. Please settle at the reception / cash counter or complete payment online below.
                    </p>
                  </div>
                </div>
              ) : (effectiveReceipt?.isPaid || billData.isPaid) ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>🟢 Bill Status: PAID & VERIFIED</span>
                      {targetOrder && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          #{formatOrderNumber(targetOrder.orderNumber || targetOrder.id)}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                      Payment verified and settled! Thank you for dining with SmartDine.
                    </p>
                  </div>
                </div>
              ) : null}
              
              {/* Payment Mode Selector Tabs */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Choose Payment</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  100% Encrypted
                </span>
              </div>

              {/* 4 Mode Pills with Razorpay Featured */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'razorpay', label: 'Razorpay', icon: ShieldCheck, badge: 'FAST' },
                  { id: 'upi', label: 'Direct QR', icon: Smartphone },
                  { id: 'card', label: 'Cards', icon: CreditCard },
                  { id: 'cash', label: 'Pay at Counter', icon: Banknote },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer relative overflow-hidden ${
                        paymentMode === mode.id
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {mode.badge && (
                        <span className="absolute top-0 right-0 bg-amber-500 text-[7px] font-black text-slate-950 px-1 py-0.2 rounded-bl">
                          {mode.badge}
                        </span>
                      )}
                      <Icon className={`w-4 h-4 ${paymentMode === mode.id ? 'text-white' : 'text-orange-400'}`} />
                      <span className="text-[10px] font-black">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mode Sub-View */}

              {/* 0. RAZORPAY */}
              {paymentMode === 'razorpay' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow">
                        R
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Razorpay Payment Gateway</h4>
                        <p className="text-[10px] text-slate-400">Instant UPI, Cards & NetBanking</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      Auto-Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold text-slate-300">
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col items-center gap-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>UPI & QR</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col items-center gap-0.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>All Cards</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col items-center gap-0.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>NetBanking</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-slate-800 leading-relaxed">
                    Click <strong>Pay Bill via Razorpay</strong> below to settle Table #{formattedTable}. Upon verification, your table bill will be automatically cleared.
                  </p>
                </div>
              )}

              {/* 1. UPI */}
              {paymentMode === 'upi' && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    {['qr', 'app', 'id'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setUpiMethod(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          upiMethod === sub
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black shadow-glow'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sub === 'qr' ? 'Dynamic QR' : sub === 'app' ? 'UPI Apps' : 'UPI ID'}
                      </button>
                    ))}
                  </div>

                  {upiMethod === 'qr' && (
                    <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="w-24 h-24 bg-white border border-slate-300 rounded-xl p-1 shrink-0 flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=upi://pay?pa=smartdine@icici%26pn=SmartDine%20Table${formattedTable}%26am=${billData.total.toFixed(2)}%26cu=INR`} 
                          alt="Dynamic UPI QR"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-black text-white">Scan to Pay <span className="text-amber-400 font-mono">₹{billData.total.toFixed(2)}</span></div>
                        <p className="text-[11px] text-slate-400">Open GPay, PhonePe, Paytm, or BHIM to scan.</p>
                      </div>
                    </div>
                  )}

                  {upiMethod === 'app' && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Amazon Pay'].map(app => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSelectedUpiApp(app)}
                          className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                            selectedUpiApp === app
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  )}

                  {upiMethod === 'id' && (
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi / yourname@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>
              )}

              {/* 2. CARD */}
              {paymentMode === 'card' && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8910"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-center text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-center text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NET BANKING */}
              {paymentMode === 'netbanking' && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-1.5">
                  {['HDFC Bank', 'SBI Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB Bank'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                        selectedBank === b
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* 4. PAY AT COUNTER */}
              {paymentMode === 'cash' && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-orange-400" />
                      <span>Pay at Reception / Cash Counter</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      Offline Settle
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Settle ₹{billData.total.toFixed(0)} via Cash, Table QR, or Card Swipe directly at the cash counter or with your table captain.
                  </p>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/20 text-[11px] text-slate-300">
                    ℹ️ Your bill remains <strong>Unpaid</strong> until the cashier receives payment and marks it as Paid in the admin dashboard.
                  </div>
                </div>
              )}

              {/* Compact Coupon Form */}
              <div className="pt-1">
                {appliedCoupon ? (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>{appliedCoupon.code} (-₹{appliedCoupon.discount.toFixed(0)})</span>
                    <button onClick={removeCoupon} className="text-rose-400 underline text-[11px] cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter coupon (ROYAL50, FEAST100)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-glow"
                      >
                        Apply
                      </button>
                    </form>

                    {/* Quick Available Vouchers Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-[10px] font-bold text-slate-400">Vouchers:</span>
                      {[
                        { code: 'ROYAL50', label: '50% OFF' },
                        { code: 'FEAST100', label: '₹100 FLAT' },
                        { code: 'WELCOME20', label: '20% OFF' },
                        { code: 'THALI30', label: '30% OFF' }
                      ].map(v => (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => {
                            setCouponCode(v.code);
                            const disc = v.code === 'ROYAL50' ? Math.min(billData.subtotal * 0.5, 150)
                              : v.code === 'FEAST100' ? 100
                              : v.code === 'THALI30' ? Math.min(billData.subtotal * 0.3, 120)
                              : Math.min(billData.subtotal * 0.2, 80);
                            setDiscountAmount(disc);
                            setAppliedCoupon({ code: v.code, discount: disc, desc: `${v.label} Discount` });
                            toast.success(`Coupon ${v.code} applied! Saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-400 text-[10px] font-bold transition cursor-pointer"
                        >
                          {v.code} ({v.label})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Pay Action */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePayNow}
                disabled={isPaying || billData.total <= 0}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
              >
                <Lock className="w-4 h-4 text-amber-200" />
                <span>
                  {isPaying 
                    ? 'Processing Payment...' 
                    : paymentMode === 'razorpay' 
                    ? `Pay Bill via Razorpay (₹${billData.total.toFixed(0)})` 
                    : paymentMode === 'cash' 
                    ? (cashRequested ? `Counter Settlement Requested (₹${billData.total.toFixed(0)})` : `Pay at Counter (Request Settlement • ₹${billData.total.toFixed(0)})`) 
                    : `Pay Bill (₹${billData.total.toFixed(0)})`}
                </span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>Safe 256-bit SSL Checkout</span>
                <span>SmartDine Royal Indian Dining</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Download Format Selector Modal (PDF vs JPG) for checkout view */}
      <BillDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        receipt={activeReceipt}
      />
    </div>
  );
}
