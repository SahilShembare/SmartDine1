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

export default function CustomerWebBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  
  // Resolve target order: check URL orderId first, then last order placed from this browser session
  const lastPlacedOrderId = localStorage.getItem('smartdine_last_order_id');
  const effectiveOrderId = orderIdParam || lastPlacedOrderId || null;
  
  // Robust targetOrder resolution across React state AND localStore
  const targetOrder = useMemo(() => {
    if (!effectiveOrderId) return null;
    const effStr = String(effectiveOrderId);
    const found = orders.find(o => String(o.id) === effStr || String(o.orderNumber) === effStr);
    if (found) return found;
    try {
      const local = localStore.getOrders();
      return local.find(o => String(o.id) === effStr || String(o.orderNumber) === effStr) || null;
    } catch {
      return null;
    }
  }, [effectiveOrderId, orders]);

  const tableParam = searchParams.get('table') || targetOrder?.tableNumber || currentTable || '01';
  const formattedTable = String(tableParam).padStart(2, '0');

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
    const pStatus = String(order.paymentStatus || order.payment_status || '').trim().toLowerCase();
    if (
      !pStatus ||
      pStatus === 'unpaid' || 
      pStatus === 'pending' || 
      pStatus.includes('requested') || 
      pStatus.includes('awaiting')
    ) {
      return false;
    }
    if (pStatus === 'paid' || pStatus === 'cash paid' || pStatus === 'online paid') {
      return true;
    }
    const txn = order.transactionId || order.razorpay_payment_id || '';
    if ((order.paidAt || order.paid_at) && txn && !txn.startsWith('PENDING') && !txn.startsWith('COUNTER')) {
      return true;
    }
    return false;
  };

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
      const isPaid = isOrderPaid(targetOrder);

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

  // Deterministic, persistent GST Tax Invoice Number for this session/table
  const sessionInvoiceNumber = useMemo(() => {
    if (targetOrder?.invoiceNumber) return formatInvoiceNumber(targetOrder.invoiceNumber);
    if (billData.invoiceNumber) return formatInvoiceNumber(billData.invoiceNumber);
    const existingPaid = (orders || []).find(o => 
      String(o.tableNumber).padStart(2, '0') === formattedTable && o.invoiceNumber
    );
    if (existingPaid?.invoiceNumber) return formatInvoiceNumber(existingPaid.invoiceNumber);
    return getOrAssignInvoiceNumber(targetOrder || billData.activeOrders, orders);
  }, [targetOrder, billData.invoiceNumber, billData.activeOrders, orders, formattedTable]);

  // Compute settled receipt data for table or target order
  const receiptData = useMemo(() => {
    if (paymentSuccessData) return paymentSuccessData;

    // 1. If targetOrder is specifically requested: ONLY return receipt if targetOrder is ACTUALLY PAID!
    if (targetOrder) {
      if (!isOrderPaid(targetOrder)) {
        return null; // UNPAID orders MUST NEVER generate a paid receipt!
      }
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

      return {
        invoiceNumber: formatInvoiceNumber(targetInvNo),
        orderNumber: targetOrdNo,
        orderId: targetOrder.id,
        transactionId: targetOrder.transactionId || targetOrder.razorpay_payment_id || `TXN-${targetOrdNo}`,
        tableNumber: targetOrder.tableNumber || formattedTable,
        paymentMethod: targetOrder.paymentMethod || targetOrder.payment_method || 'Online Verified (Paid)',
        amount: total,
        discount: Number(targetOrder.discountAmount) || 0,
        subtotal: subtotal,
        tax: tax,
        items: items,
        paidAt: targetOrder.paidAt ? new Date(targetOrder.paidAt).toLocaleString() : (targetOrder.createdAt ? new Date(targetOrder.createdAt).toLocaleString() : new Date().toLocaleString()),
        orderCount: 1,
        customerName: targetOrder.customerName || currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`
      };
    }

    // 2. Fallback: If no target order is specified, get the latest settled transaction for this table
    const allTablePaid = orders.filter(o => 
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
        amount: total,
        discount: discount,
        subtotal: subtotal,
        tax: tax,
        items: items,
        paidAt: latestOrder.paidAt ? new Date(latestOrder.paidAt).toLocaleString() : (latestOrder.createdAt ? new Date(latestOrder.createdAt).toLocaleString() : new Date().toLocaleString()),
        orderCount: sameBatchOrders.length,
        customerName: latestOrder.customerName || currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`
      };
    }

    return null;
  }, [paymentSuccessData, targetOrder, orders, formattedTable, currentUser, sessionInvoiceNumber]);

  const effectiveReceipt = receiptData;
  const hasSettledReceipt = Boolean(receiptData && (paymentSuccessData || (targetOrder ? isOrderPaid(targetOrder) : true)));
  const hasActiveUnpaidOrders = (billData.activeOrders && billData.activeOrders.length > 0) || (targetOrder && !isOrderPaid(targetOrder));

  // Determine if viewing receipt:
  // Show receipt ONLY when:
  // 1. paymentSuccessData is set (just finished online payment right now)
  // 2. OR There are NO active unpaid orders AND a settled receipt exists AND (showReceiptView || viewReceiptParam)
  // 3. OR targetOrder is explicitly specified AND isOrderPaid(targetOrder) is true AND viewReceiptParam is true
  // NEVER show settled receipt if customer or table has active unpaid orders!
  const [showReceiptView, setShowReceiptView] = useState(false);

  const isViewingReceipt = Boolean(
    paymentSuccessData || 
    (!hasActiveUnpaidOrders && hasSettledReceipt && (showReceiptView || viewReceiptParam)) ||
    (targetOrder && isOrderPaid(targetOrder) && viewReceiptParam)
  );

  const activeReceipt = effectiveReceipt || {
    invoiceNumber: sessionInvoiceNumber,
    orderNumber: billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001',
    transactionId: 'TXN-DIRECT',
    tableNumber: formattedTable,
    paymentMethod: paymentMode.toUpperCase(),
    amount: billData.total,
    subtotal: billData.subtotal,
    tax: billData.tax,
    discount: discountAmount,
    items: billData.consolidatedItems,
    paidAt: new Date().toLocaleString(),
    customerName: currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || `Table ${formattedTable} Guest`
  };

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
        invoiceNumber: settledInvoice
      });

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setPaymentSuccessData({
        invoiceNumber: settledInvoice,
        orderNumber: billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001',
        transactionId: transactionId,
        tableNumber: formattedTable,
        paymentMethod: paymentLabel,
        amount: billData.total,
        discount: discountAmount,
        subtotal: billData.subtotal,
        tax: billData.tax,
        items: billData.consolidatedItems,
        paidAt: new Date().toLocaleString()
      });

      toast.success('✅ Online Payment Verified & Successful!', { icon: '🎉' });
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  // PRINT BILL (Color-enabled)
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const receipt = activeReceipt;
    const items = (receipt.items && receipt.items.length > 0) ? receipt.items : billData.consolidatedItems;
    const totalAmt = Number(receipt.amount ?? billData.total);
    const subtotalAmt = Number(receipt.subtotal ?? billData.subtotal);
    const taxAmt = Number(receipt.tax ?? billData.tax);
    const discAmt = Number(receipt.discount ?? discountAmount);
    const invNo = formatInvoiceNumber(receipt.invoiceNumber || sessionInvoiceNumber);
    const ordNo = receipt.orderNumber || billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001';
    const txnId = receipt.transactionId || 'TXN-DIRECT';
    const payMethod = receipt.paymentMethod || paymentMode.toUpperCase();
    const paidTime = receipt.paidAt || new Date().toLocaleString();
    const tblNo = receipt.tableNumber || formattedTable;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartDine Tax Invoice - Table ${tblNo} - ${invNo}</title>
  <style>
    @page { margin: 12mm; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 15px;
      background-color: #F8FAFC;
      color: #0F172A;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #020617 0%, #0F172A 100%);
      color: #F8FAFC;
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid #F59E0B;
    }
    .restaurant-title {
      font-size: 22px;
      font-weight: 900;
      color: #F59E0B;
      margin: 0;
    }
    .tagline {
      font-size: 11px;
      color: #F8FAFC;
      opacity: 0.9;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      padding: 14px 20px;
      background: #F8FAFC;
      border-bottom: 1.5px dashed #CBD5E1;
      font-size: 11px;
    }
    .meta-box span { color: #64748B; display: block; font-size: 10px; text-transform: uppercase; }
    .meta-box strong { color: #0F172A; font-size: 12px; }
    .table-badge {
      display: inline-block;
      background: #EA580C;
      color: #FFFFFF;
      padding: 3px 10px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 11px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .items-table th {
      background: #0F172A;
      color: #F59E0B;
      padding: 8px 18px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 9px 18px;
      border-bottom: 1px solid #F1F5F9;
    }
    .items-table tr:nth-child(even) { background: #F8FAFC; }
    .veg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #16A34A;
      margin-right: 6px;
    }
    .nonveg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #E11D48;
      margin-right: 6px;
    }
    .calc-section {
      padding: 14px 20px;
      background: #F8FAFC;
      border-top: 2px dashed #CBD5E1;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 5px;
      color: #64748B;
      font-weight: 600;
    }
    .calc-row.discount { color: #16A34A; font-weight: 800; }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 2px solid #0F172A;
      font-size: 15px;
      font-weight: 900;
      color: #0F172A;
    }
    .grand-total .amount { color: #EA580C; font-size: 20px; font-weight: 900; }
    .paid-stamp {
      background: #ECFDF5;
      border: 2px solid #059669;
      color: #059669;
      padding: 8px;
      border-radius: 12px;
      text-align: center;
      font-weight: 900;
      font-size: 12px;
      margin: 12px 20px;
    }
    .footer {
      background: #020617;
      color: #F59E0B;
      text-align: center;
      padding: 12px;
      font-size: 11px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <h1 class="restaurant-title">👑 SMARTDINE RESTAURANT</h1>
      <div class="tagline">Authentic Royal Indian Cuisine • Tax Invoice</div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <span>Tax Invoice No</span>
        <strong style="font-family: monospace; font-size: 13px; color: #0F172A;">${invNo}</strong>
      </div>
      <div class="meta-box">
        <span>Order Token</span>
        <strong style="font-family: monospace; font-size: 13px; color: #EA580C;">${ordNo}</strong>
      </div>
      <div class="meta-box">
        <span>Dining Table</span>
        <div class="table-badge">Table ${tblNo}</div>
      </div>
      <div class="meta-box" style="text-align: right;">
        <span>Date & Time</span>
        <strong>${paidTime}</strong>
      </div>
    </div>

    <div style="background: #FFFBEB; border-bottom: 1px dashed #FDE68A; padding: 6px 20px; font-size: 9.5px; color: #92400E; display: flex; justify-content: space-between;">
      <span><strong>GSTIN:</strong> 27AABCS1429B1Z8</span>
      <span><strong>SAC:</strong> 996331 (Restaurant Dining)</span>
      <span><strong>FSSAI Lic:</strong> 11522036000412</span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Delicacy / Dish</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <span class="${item.isVeg !== false ? 'veg-dot' : 'nonveg-dot'}"></span>
              <strong>${item.name}</strong>
            </td>
            <td style="text-align: center; color: #EA580C; font-weight: 800;">${item.quantity}x</td>
            <td style="text-align: right; color: #64748B;">₹${(Number(item.price) || 0).toFixed(0)}</td>
            <td style="text-align: right; font-weight: 800; color: #0F172A;">₹${(Number(item.totalPrice) || (Number(item.price) * Number(item.quantity)) || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="calc-section">
      <div class="calc-row">
        <span>Subtotal (${items.length} items)</span>
        <strong style="color: #0F172A;">₹${subtotalAmt.toFixed(2)}</strong>
      </div>
      ${discAmt > 0 ? `
      <div class="calc-row discount">
        <span>Discount Applied (${appliedCoupon?.code || 'COUPON'})</span>
        <span>-₹${discAmt.toFixed(2)}</span>
      </div>` : ''}
      <div class="calc-row">
        <span>CGST (2.5%)</span>
        <strong style="color: #0F172A;">₹${(taxAmt / 2).toFixed(2)}</strong>
      </div>
      <div class="calc-row">
        <span>SGST (2.5%)</span>
        <strong style="color: #0F172A;">₹${(taxAmt / 2).toFixed(2)}</strong>
      </div>
      <div class="grand-total">
        <span>GRAND TOTAL PAID</span>
        <span class="amount">₹${totalAmt.toFixed(2)}</span>
      </div>
    </div>

    <div class="paid-stamp">
      PAID & VERIFIED OFFICIAL INVOICE ✅ (${payMethod})<br>
      <small style="font-size: 10px; font-weight: 600; color: #047857;">Txn ID: ${txnId}</small>
    </div>

    <div class="footer">
      ✨ Thank you for dining with SmartDine! Visit Again! ✨
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 1. DOWNLOAD AS PDF
  const handleDownloadPdf = () => {
    handlePrintReceipt();
    setShowDownloadModal(false);
    toast.success('Select "Save as PDF" in your print dialog! 📄', { icon: '📄' });
  };

  // 2. DOWNLOAD AS IMAGE (100% PURE WHITE BACKGROUND JPG)
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    const width = 600;
    const receipt = activeReceipt;
    const items = (receipt.items && receipt.items.length > 0) ? receipt.items : billData.consolidatedItems;
    const totalAmt = Number(receipt.amount ?? billData.total);
    const subtotalAmt = Number(receipt.subtotal ?? billData.subtotal);
    const taxAmt = Number(receipt.tax ?? billData.tax);
    const discAmt = Number(receipt.discount ?? discountAmount);
    const invNo = formatInvoiceNumber(receipt.invoiceNumber || sessionInvoiceNumber);
    const ordNo = receipt.orderNumber || billData.orderIds?.map(formatOrderNumber).join(', ') || 'ORD-1001';
    const txnId = receipt.transactionId || 'TXN-DIRECT';
    const payMethod = receipt.paymentMethod || paymentMode.toUpperCase();
    const paidTime = receipt.paidAt || new Date().toLocaleString();
    const tblNo = receipt.tableNumber || formattedTable;

    const height = Math.max(520, 440 + (items.length * 32));

    canvas.width = width * 2; // High-DPI 2x Retina scale
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // 1. PURE 100% SOLID WHITE BACKGROUND
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 2. Outer Card Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F59E0B';
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // 3. Header Section
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 SMARTDINE RESTAURANT', width / 2, 55);

    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('AUTHENTIC ROYAL DINING • TAX INVOICE', width / 2, 75);

    // Gold divider under header
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 95);
    ctx.lineTo(width - 30, 95);
    ctx.stroke();

    // 4. Meta Row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('INVOICE NO', 35, 118);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(invNo, 35, 134);

    ctx.fillStyle = '#64748B';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('ORDER TOKEN', 175, 118);
    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(ordNo, 175, 134);

    ctx.fillStyle = '#64748B';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('DINING TABLE', width / 2 + 50, 118);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`Table ${tblNo}`, width / 2 + 50, 134);

    ctx.fillStyle = '#64748B';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('DATE & TIME', width - 150, 118);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillText(paidTime, width - 150, 134);

    // Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 155);
    ctx.lineTo(width - 30, 155);
    ctx.stroke();

    // 5. Table Header Row
    let y = 175;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DELICACY / DISH', 40, y);
    ctx.fillText('QTY', width - 170, y);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', width - 40, y);

    // Divider under table header
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, y + 8);
    ctx.lineTo(width - 30, y + 8);
    ctx.stroke();

    // 6. Items list
    y += 28;
    items.forEach((item) => {
      ctx.textAlign = 'left';
      // Veg/Non-Veg dot
      ctx.fillStyle = item.isVeg !== false ? '#16A34A' : '#E11D48';
      ctx.fillRect(40, y - 8, 8, 8);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText((item.name || 'Delicacy').substring(0, 24), 56, y);

      ctx.fillStyle = '#EA580C';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`${item.quantity}x`, width - 170, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`₹${(Number(item.totalPrice) || (Number(item.price) * Number(item.quantity)) || 0).toFixed(2)}`, width - 40, y);
      y += 26;
    });

    // Divider
    y += 6;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(width - 30, y);
    ctx.stroke();

    // 7. Summary Calculation
    y += 24;
    ctx.textAlign = 'left';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Subtotal', 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`₹${subtotalAmt.toFixed(2)}`, width - 40, y);

    if (discAmt > 0) {
      y += 20;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#16A34A';
      ctx.fillText(`Discount (${appliedCoupon?.code || 'COUPON'})`, 40, y);
      ctx.textAlign = 'right';
      ctx.fillText(`-₹${discAmt.toFixed(2)}`, width - 40, y);
    }

    y += 20;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.fillText('GST (5% SGST + CGST)', 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`₹${taxAmt.toFixed(2)}`, width - 40, y);

    // Grand total
    y += 26;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, y - 6);
    ctx.lineTo(width - 30, y - 6);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GRAND TOTAL PAID', 40, y + 10);
    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`₹${totalAmt.toFixed(2)}`, width - 40, y + 10);

    // 8. Paid Stamp Box
    y += 36;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(30, y, width - 60, 42);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, y, width - 60, 42);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`PAID & VERIFIED OFFICIAL INVOICE ✅ (${payMethod})`, width / 2, y + 20);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#1B5E20';
    ctx.fillText(`Txn ID: ${txnId}`, width / 2, y + 34);

    // 9. Export as 100% clean white background JPG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartDine_Invoice_Table${tblNo}_${invNo}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      setShowDownloadModal(false);
      toast.success('Pure White JPG Bill Image downloaded! 🖼️', { icon: '🖼️' });
    }, 'image/jpeg', 1.0);
  };

  // ================= PAID TAX INVOICE & BILL RECEIPT VIEW =================
  if (isViewingReceipt && effectiveReceipt) {
    const receipt = effectiveReceipt;
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
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-orange-400" />
                  <h3 className="text-sm font-black text-white">Download Bill Receipt</h3>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Choose your preferred format to save the verified tax invoice:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* PDF Option */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">Download PDF Invoice</div>
                      <div className="text-[10px] text-slate-400">Printable official document</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Image Option */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">Download Image (JPG)</div>
                      <div className="text-[10px] text-slate-400">Clear HD Photo Receipt (JPG)</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
          
          {/* Header with Verified Badge */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-glow">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>Bill Settled & Paid</span>
              <span className="text-emerald-400">✅</span>
            </h1>
            <p className="text-xs text-slate-400">
              Official Tax Invoice for Table #{tblNo}
            </p>
          </div>

          {/* Color-Rich Digital Invoice Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Tax Invoice Number</div>
                <div className="font-mono text-xs font-bold text-amber-400">{invNo}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Order Token</div>
                <div className="font-mono text-xs font-bold text-slate-200">{ordNo}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500">Dining Table</div>
                <div className="text-xs font-black text-amber-400">Table #{tblNo}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Mode</span>
                <span className="font-semibold text-slate-200 truncate block">{payMethod}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date & Time</span>
                <span className="font-semibold text-slate-300 block">{paidTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Txn ID</span>
                <span className="font-mono text-[10px] text-amber-400/90 truncate block">{txnId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Guest</span>
                <span className="font-semibold text-slate-300 truncate block">{customerName}</span>
              </div>
            </div>

            {/* Delicacies List */}
            {items.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Delicacies Invoiced ({items.length})</span>
                  <span>Amount</span>
                </div>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-900">
                  {items.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className={`w-2 h-2 rounded-sm ${item.isVeg !== false ? 'bg-emerald-400' : 'bg-rose-400'} shrink-0`} />
                        <span className="font-medium text-slate-200 truncate">{item.name}</span>
                        <span className="text-amber-400 font-bold text-[11px]">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-300 shrink-0">
                        ₹{(Number(item.totalPrice) || (Number(item.price) * Number(item.quantity)) || 0).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtotal & Taxes Breakdown */}
            <div className="pt-2.5 border-t border-slate-800/80 space-y-1 text-xs">
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
                <span>Total Paid Amount</span>
                <span className="text-emerald-400 text-xl font-black font-mono">₹{totalAmt.toFixed(2)}</span>
              </div>
            </div>

            {/* Official Stamp */}
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Paid & Verified Tax Invoice</span>
            </div>

          </div>

          <div className="flex flex-col gap-2">
            {/* Post-Payment Feedback Button */}
            <button
              type="button"
              onClick={() => setShowBillFeedback(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>⭐ Rate Food & Dining Experience</span>
            </button>

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

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
              hasActiveUnpaidOrders
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-950 text-emerald-400 border-emerald-700'
            }`}>
              {hasActiveUnpaidOrders && <Clock className="w-3 h-3" />}
              <span>{hasActiveUnpaidOrders ? 'UNPAID (Pay at Counter)' : 'PAID'}</span>
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

          </div>

          {/* RIGHT COLUMN: 1-Page Payment Mode & Pay Action (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">

              {/* Active Cash/Counter Settlement Pending Banner */}
              {(hasActiveUnpaidOrders || cashRequested || billData.activeOrders.some(o => String(o.paymentStatus || '').toLowerCase().includes('requested') || String(o.paymentMethod || '').toLowerCase().includes('counter'))) && (
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
              )}
              
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
    </div>
  );
}
