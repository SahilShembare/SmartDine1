import React, { useState } from 'react';
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

export default function CustomerWebBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { 
    currentTable, 
    getCombinedTableBill, 
    requestTableBill, 
    requestCashPaymentForTable,
    payTableBill 
  } = useTableOrder();

  const tableParam = searchParams.get('table') || currentTable || '01';
  const formattedTable = String(tableParam).padStart(2, '0');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Payment method: 'upi' | 'card' | 'netbanking' | 'cash'
  const [paymentMode, setPaymentMode] = useState('upi');

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [invoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);

  const billData = getCombinedTableBill(formattedTable, discountAmount);

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

    // 2. ONLINE PAYMENT FLOW (UPI / Card / NetBanking)
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
    try {
      const paymentLabel = 
        paymentMode === 'upi' ? `Online UPI (${upiMethod === 'qr' ? 'Table Dynamic QR' : upiMethod === 'id' ? upiId : selectedUpiApp})` :
        paymentMode === 'card' ? `Online Card (ending ${cardNumber.slice(-4)})` :
        `Online Net Banking (${selectedBank})`;

      const txnId = `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      await payTableBill(formattedTable, {
        paymentMethod: paymentLabel,
        transactionId: txnId,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.code || null
      });

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setPaymentSuccessData({
        invoiceNumber,
        transactionId: txnId,
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

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartDine Tax Invoice - Table ${formattedTable} - ${invoiceNumber}</title>
  <style>
    @page { margin: 12mm; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 15px;
      background-color: #FFF8ED;
      color: #24140D;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 3px solid #F4B942;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(59, 33, 21, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3B2115 0%, #24140D 100%);
      color: #FFF8ED;
      padding: 20px;
      text-align: center;
      border-bottom: 3px solid #F4B942;
    }
    .restaurant-title {
      font-size: 22px;
      font-weight: 900;
      color: #F4B942;
      margin: 0;
    }
    .tagline {
      font-size: 11px;
      color: #FFF8ED;
      opacity: 0.9;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      padding: 14px 20px;
      background: #FFF8ED;
      border-bottom: 1.5px dashed #F4B942;
      font-size: 11px;
    }
    .meta-box span { color: #6B5B50; display: block; font-size: 10px; text-transform: uppercase; }
    .meta-box strong { color: #24140D; font-size: 12px; }
    .table-badge {
      display: inline-block;
      background: #E8752A;
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
      background: #3B2115;
      color: #F4B942;
      padding: 8px 18px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 9px 18px;
      border-bottom: 1px solid #FFF8ED;
    }
    .items-table tr:nth-child(even) { background: #FFFBF5; }
    .veg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #198754;
      margin-right: 6px;
    }
    .nonveg-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: #D32F2F;
      margin-right: 6px;
    }
    .calc-section {
      padding: 14px 20px;
      background: #FFF8ED;
      border-top: 2px dashed #F4B942;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 5px;
      color: #6B5B50;
      font-weight: 600;
    }
    .calc-row.discount { color: #198754; font-weight: 800; }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 2px solid #3B2115;
      font-size: 15px;
      font-weight: 900;
      color: #3B2115;
    }
    .grand-total .amount { color: #E8752A; font-size: 20px; font-weight: 900; }
    .paid-stamp {
      background: #E8F5E9;
      border: 2px solid #2E7D32;
      color: #2E7D32;
      padding: 8px;
      border-radius: 12px;
      text-align: center;
      font-weight: 900;
      font-size: 12px;
      margin: 12px 20px;
    }
    .footer {
      background: #3B2115;
      color: #F4B942;
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
        <span>Invoice No</span>
        <strong>${invoiceNumber}</strong>
      </div>
      <div class="meta-box">
        <span>Dining Table</span>
        <div class="table-badge">Table ${formattedTable}</div>
      </div>
      <div class="meta-box" style="text-align: right;">
        <span>Date & Time</span>
        <strong>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</strong>
      </div>
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
        ${billData.consolidatedItems.map(item => `
          <tr>
            <td>
              <span class="${item.isVeg ? 'veg-dot' : 'nonveg-dot'}"></span>
              <strong>${item.name}</strong>
            </td>
            <td style="text-align: center; color: #E8752A; font-weight: 800;">${item.quantity}x</td>
            <td style="text-align: right; color: #6B5B50;">₹${item.price.toFixed(0)}</td>
            <td style="text-align: right; font-weight: 800; color: #3B2115;">₹${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="calc-section">
      <div class="calc-row">
        <span>Subtotal (${billData.consolidatedItems.length} items)</span>
        <strong style="color: #24140D;">₹${billData.subtotal.toFixed(2)}</strong>
      </div>
      ${discountAmount > 0 ? `
      <div class="calc-row discount">
        <span>Discount Applied (${appliedCoupon?.code || 'COUPON'})</span>
        <span>-₹${discountAmount.toFixed(2)}</span>
      </div>` : ''}
      <div class="calc-row">
        <span>CGST (2.5%)</span>
        <strong style="color: #24140D;">₹${(billData.tax / 2).toFixed(2)}</strong>
      </div>
      <div class="calc-row">
        <span>SGST (2.5%)</span>
        <strong style="color: #24140D;">₹${(billData.tax / 2).toFixed(2)}</strong>
      </div>
      <div class="grand-total">
        <span>GRAND TOTAL PAID</span>
        <span class="amount">₹${billData.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="paid-stamp">
      PAID & VERIFIED ONLINE ✅ (${paymentSuccessData?.paymentMethod || paymentMode.toUpperCase()})<br>
      <small style="font-size: 10px; font-weight: 600; color: #1B5E20;">Txn ID: ${paymentSuccessData?.transactionId || 'TXN-DIRECT'}</small>
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
    const items = billData.consolidatedItems;
    const height = 450 + (items.length * 36);

    canvas.width = width * 2; // High-DPI 2x Retina scale
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // 1. PURE 100% SOLID WHITE BACKGROUND
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 2. Outer Card Border (Gold & Dark accents on pure white)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F4B942';
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // 3. Header Section (Pure White Background with Elegant Typography)
    ctx.fillStyle = '#3B2115';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 SMARTDINE RESTAURANT', width / 2, 55);

    ctx.fillStyle = '#E8752A';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('AUTHENTIC ROYAL DINING • TAX INVOICE', width / 2, 75);

    // Gold divider under header
    ctx.strokeStyle = '#F4B942';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 95);
    ctx.lineTo(width - 30, 95);
    ctx.stroke();

    // 4. Meta Row (Pure White Background)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6B5B50';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('INVOICE NO', 35, 120);
    ctx.fillStyle = '#24140D';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(invoiceNumber, 35, 138);

    ctx.fillStyle = '#6B5B50';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('DINING TABLE', width / 2 - 35, 120);
    ctx.fillStyle = '#E8752A';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`Table ${formattedTable}`, width / 2 - 35, 138);

    ctx.fillStyle = '#6B5B50';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('DATE & TIME', width - 155, 120);
    ctx.fillStyle = '#24140D';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(new Date().toLocaleDateString(), width - 155, 138);

    // Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 155);
    ctx.lineTo(width - 30, 155);
    ctx.stroke();

    // 5. Table Header Row (Pure White with Gold underline)
    let y = 175;
    ctx.fillStyle = '#3B2115';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DELICACY / DISH', 40, y);
    ctx.fillText('QTY', width - 170, y);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', width - 40, y);

    // Divider under table header
    ctx.strokeStyle = '#3B2115';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, y + 8);
    ctx.lineTo(width - 30, y + 8);
    ctx.stroke();

    // 6. Items list (100% Pure White background)
    y += 28;
    items.forEach((item) => {
      ctx.textAlign = 'left';
      // Veg/Non-Veg dot
      ctx.fillStyle = item.isVeg ? '#198754' : '#D32F2F';
      ctx.fillRect(40, y - 8, 8, 8);

      ctx.fillStyle = '#24140D';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(item.name.substring(0, 24), 56, y);

      ctx.fillStyle = '#E8752A';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`${item.quantity}x`, width - 170, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#3B2115';
      ctx.fillText(`₹${item.totalPrice.toFixed(2)}`, width - 40, y);
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

    // 7. Summary Calculation (Pure White Background)
    y += 24;
    ctx.textAlign = 'left';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#6B5B50';
    ctx.fillText('Subtotal', 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#24140D';
    ctx.fillText(`₹${billData.subtotal.toFixed(2)}`, width - 40, y);

    if (discountAmount > 0) {
      y += 20;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#198754';
      ctx.fillText(`Discount (${appliedCoupon?.code || 'COUPON'})`, 40, y);
      ctx.textAlign = 'right';
      ctx.fillText(`-₹${discountAmount.toFixed(2)}`, width - 40, y);
    }

    y += 20;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6B5B50';
    ctx.fillText('GST (5% SGST + CGST)', 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#24140D';
    ctx.fillText(`₹${billData.tax.toFixed(2)}`, width - 40, y);

    // Grand total
    y += 26;
    ctx.strokeStyle = '#3B2115';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, y - 6);
    ctx.lineTo(width - 30, y - 6);
    ctx.stroke();

    ctx.fillStyle = '#3B2115';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GRAND TOTAL PAID', 40, y + 10);
    ctx.fillStyle = '#E8752A';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`₹${billData.total.toFixed(2)}`, width - 40, y + 10);

    // 8. Paid Stamp Box (Clean Pure White with Green Border)
    y += 36;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(30, y, width - 60, 42);
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, y, width - 60, 42);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`PAID & VERIFIED ONLINE ✅ (${paymentSuccessData?.paymentMethod || paymentMode.toUpperCase()})`, width / 2, y + 20);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#1B5E20';
    ctx.fillText(`Txn ID: ${paymentSuccessData?.transactionId || 'TXN-DIRECT'}`, width / 2, y + 34);

    // 9. Export as 100% clean white background JPG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartDine_Invoice_Table${formattedTable}_${invoiceNumber}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      setShowDownloadModal(false);
      toast.success('Pure White JPG Bill Image downloaded! 🖼️', { icon: '🖼️' });
    }, 'image/jpeg', 1.0);
  };

  // ================= PAYMENT SUCCESS VIEW =================
  if (paymentSuccessData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FFF8ED] text-[#24140D] flex items-center justify-center p-4 font-sans relative">
        
        {/* Download Format Selector Modal (PDF vs Image) */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white border-2 border-[#F4B942] rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4B942]/30 pb-3">
                <div className="flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-[#E8752A]" />
                  <h3 className="text-sm font-black text-[#24140D]">Download Bill Receipt</h3>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-1 rounded-lg text-[#6B5B50] hover:text-[#24140D] hover:bg-[#FFF8ED] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#6B5B50]">
                Choose your preferred format to save the verified tax invoice:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* PDF Option */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full p-3.5 rounded-2xl bg-[#FFF8ED] hover:bg-[#E8752A] hover:text-white border border-[#F4B942] text-[#3B2115] transition flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-black">Download PDF Invoice</div>
                      <div className="text-[10px] text-[#6B5B50] group-hover:text-white/80">Printable official document</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Image Option */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="w-full p-3.5 rounded-2xl bg-[#FFF8ED] hover:bg-[#E8752A] hover:text-white border border-[#F4B942] text-[#3B2115] transition flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black">Download Image (JPG)</div>
                      <div className="text-[10px] text-[#6B5B50] group-hover:text-white/80">Clear HD Photo Receipt (JPG)</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-white border-2 border-[#F4B942] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-300">
          
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#198754] border-2 border-[#198754] flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h1 className="text-xl font-black text-[#24140D]">Payment Successful!</h1>
            <p className="text-xs text-[#6B5B50]">
              Table {paymentSuccessData.tableNumber} bill settled cleanly.
            </p>
          </div>

          {/* Color-Rich Digital Invoice Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8ED] to-white border border-[#F4B942]/80 space-y-2 font-mono text-xs shadow-inner">
            <div className="flex justify-between text-[#6B5B50]">
              <span>Invoice</span>
              <span className="font-bold text-[#24140D]">{paymentSuccessData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-[#6B5B50]">
              <span>Txn ID</span>
              <span className="font-bold text-[#E8752A]">{paymentSuccessData.transactionId}</span>
            </div>
            <div className="flex justify-between text-[#6B5B50]">
              <span>Mode</span>
              <span className="font-bold text-[#24140D]">{paymentSuccessData.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#F4B942]/40 text-sm font-black text-[#24140D]">
              <span>Amount Paid</span>
              <span className="text-[#198754] text-xl font-black">₹{paymentSuccessData.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              to={`/menu?table=${formattedTable}`}
              className="w-full py-3.5 rounded-2xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Back to Menu (Table {formattedTable})</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-3 rounded-xl bg-[#3B2115] hover:bg-[#E8752A] text-[#F4B942] hover:text-white border border-[#F4B942] font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="py-3 rounded-xl bg-[#FFF8ED] hover:bg-white text-[#3B2115] border border-[#F4B942] font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#E8752A]" />
                <span>Download Bill</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ================= 1-PAGE UNIFIED BILLING & PAYMENT VIEW =================
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FFF8ED] text-[#24140D] p-3 sm:p-5 font-sans flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white border-2 border-[#F4B942] rounded-3xl shadow-[0_8px_30px_rgba(59,33,21,0.12)] overflow-hidden flex flex-col my-auto">
        
        {/* Compact Top Bar */}
        <div className="bg-[#3B2115] text-[#FFF8ED] px-4 py-3 border-b border-[#F4B942]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/menu"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFF8ED] transition"
              title="Return to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>SmartDine Restaurant</span>
                <span className="text-[10px] text-[#F4B942] font-normal">• Table {formattedTable}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              billData.billStatus === 'Bill Requested'
                ? 'bg-amber-500/20 text-[#F4B942] border-[#F4B942] animate-pulse'
                : 'bg-white/10 text-[#FFF8ED] border-white/20'
            }`}>
              {billData.billStatus}
            </span>
            <span className="text-[11px] font-mono text-[#F4B942] hidden xs:inline">{invoiceNumber}</span>
          </div>
        </div>

        {/* 1-Page 2-Column Responsive Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#F4B942]/30 flex-1">
          
          {/* LEFT COLUMN: Consolidated Items & Bill Calculation (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-[#FFF8ED]/30 space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-[#3B2115] uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#E8752A]" />
                  <span>Order Delicacies ({billData.consolidatedItems.length})</span>
                </h2>

                {billData.orderCount > 1 && (
                  <span className="text-[10px] font-bold text-[#E8752A] bg-[#FFF8ED] px-2 py-0.5 rounded-md border border-[#F4B942]/60">
                    {billData.orderCount} Orders Combined
                  </span>
                )}
              </div>

              {/* Cleared Orders Notice */}
              {billData.clearedOrderCount > 0 && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-[#198754]/30 text-[11px] text-[#198754] font-bold flex items-center justify-between">
                  <span>Previous Orders Settled:</span>
                  <span>₹{billData.totalClearedAmount.toFixed(0)} (Paid ✅)</span>
                </div>
              )}

              {/* Items List (Scrollable if many dishes) */}
              {billData.consolidatedItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B5B50] space-y-2">
                  <p>No unpaid dishes on Table {formattedTable}.</p>
                  <Link to="/menu" className="text-[#E8752A] underline font-bold">Open Menu</Link>
                </div>
              ) : (
                <div className="max-h-[220px] lg:max-h-[260px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#F4B942]/20">
                  {billData.consolidatedItems.map((item, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center shrink-0 ${
                          item.isVeg ? 'border-[#198754]' : 'border-[#D32F2F]'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-[#198754]' : 'bg-[#D32F2F]'}`} />
                        </span>
                        <span className="font-bold text-[#24140D] truncate">{item.name}</span>
                        <span className="text-[#E8752A] font-extrabold text-[11px]">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-[#3B2115] shrink-0">₹{item.totalPrice.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal & Taxes Summary Box */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#F4B942]/50 shadow-sm space-y-1.5 text-xs text-[#6B5B50]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#24140D] font-bold">₹{billData.subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#198754] font-bold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px]">
                <span>GST (5% SGST + CGST)</span>
                <span className="text-[#24140D] font-medium">₹{billData.tax.toFixed(2)}</span>
              </div>

              <div className="pt-1.5 border-t border-[#FFF8ED] flex justify-between items-center text-sm font-black text-[#24140D]">
                <span>Payable Amount</span>
                <span className="text-[#E8752A] text-xl font-black">₹{billData.total.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: 1-Page Payment Mode & Pay Action (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              
              {/* Payment Mode Selector Tabs */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#3B2115] uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#198754]" />
                  <span>Choose Payment</span>
                </span>
                <span className="text-[10px] text-[#198754] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-[#198754]/30">
                  100% Encrypted
                </span>
              </div>

              {/* 4 Mode Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'netbanking', label: 'Banking', icon: Building2 },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        paymentMode === mode.id
                          ? 'bg-[#3B2115] border-[#F4B942] text-[#F4B942] shadow-sm'
                          : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mode Sub-View */}

              {/* 1. UPI */}
              {paymentMode === 'upi' && (
                <div className="p-3 rounded-2xl bg-[#FFF8ED]/60 border border-[#F4B942]/40 space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-[#F4B942]/30 pb-1.5">
                    {['qr', 'app', 'id'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setUpiMethod(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          upiMethod === sub
                            ? 'bg-[#E8752A] text-white font-black'
                            : 'bg-white text-[#6B5B50]'
                        }`}
                      >
                        {sub === 'qr' ? 'Dynamic QR' : sub === 'app' ? 'UPI Apps' : 'UPI ID'}
                      </button>
                    ))}
                  </div>

                  {upiMethod === 'qr' && (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-[#F4B942]/40">
                      <div className="w-24 h-24 bg-white border border-[#3B2115] rounded-xl p-1 shrink-0 flex items-center justify-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=upi://pay?pa=smartdine@icici%26pn=SmartDine%20Table${formattedTable}%26am=${billData.total.toFixed(2)}%26cu=INR`} 
                          alt="Dynamic UPI QR"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-black text-[#24140D]">Scan to Pay ₹{billData.total.toFixed(2)}</div>
                        <p className="text-[11px] text-[#6B5B50]">Open GPay, PhonePe, Paytm, or BHIM to scan.</p>
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
                              ? 'bg-white border-[#E8752A] text-[#E8752A] ring-1 ring-[#E8752A]'
                              : 'bg-white text-[#24140D] border-[#6B5B50]/20'
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
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-bold text-[#24140D] focus:outline-none"
                    />
                  )}
                </div>
              )}

              {/* 2. CARD */}
              {paymentMode === 'card' && (
                <div className="p-3 rounded-2xl bg-[#FFF8ED]/60 border border-[#F4B942]/40 space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B5B50] mb-0.5">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8910"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4B942]/60 font-mono font-bold text-[#24140D] text-xs focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B5B50] mb-0.5">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4B942]/60 font-mono font-bold text-[#24140D] text-center text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B5B50] mb-0.5">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#F4B942]/60 font-mono font-bold text-[#24140D] text-center text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NET BANKING */}
              {paymentMode === 'netbanking' && (
                <div className="p-3 rounded-2xl bg-[#FFF8ED]/60 border border-[#F4B942]/40 grid grid-cols-3 gap-1.5">
                  {['HDFC Bank', 'SBI Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB Bank'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition cursor-pointer ${
                        selectedBank === b
                          ? 'bg-white border-[#E8752A] text-[#E8752A] ring-1 ring-[#E8752A]'
                          : 'bg-white text-[#24140D] border-[#6B5B50]/20'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* 4. CASH */}
              {paymentMode === 'cash' && (
                <div className="p-3 rounded-2xl bg-[#FFF8ED]/60 border border-[#F4B942]/40 text-xs text-[#6B5B50] space-y-1">
                  <span className="font-bold text-[#24140D] flex items-center gap-1">
                    <Banknote className="w-4 h-4 text-[#198754]" />
                    <span>Pay at Cashier Counter / Captain</span>
                  </span>
                  <p className="text-[11px]">
                    Settle ₹{billData.total.toFixed(0)} via cash or card swipe with your table captain.
                  </p>
                </div>
              )}

              {/* Compact Coupon Form */}
              <div className="pt-1">
                {appliedCoupon ? (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-[#198754]/40 flex items-center justify-between text-xs text-[#198754] font-bold">
                    <span>{appliedCoupon.code} (-₹{appliedCoupon.discount.toFixed(0)})</span>
                    <button onClick={removeCoupon} className="text-red-600 underline text-[11px] cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Coupon (ROYAL50, FEAST100)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/60 text-xs font-bold text-[#24140D] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-[#3B2115] hover:bg-[#E8752A] text-white text-xs font-bold transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Bottom Pay Action */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePayNow}
                disabled={isPaying || billData.total <= 0}
                className="w-full py-3.5 rounded-2xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-sm sm:text-base shadow-[0_4px_20px_rgba(232,117,42,0.35)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-[#F4B942]" />
                <span>{isPaying ? 'Processing Payment...' : `Pay Now (₹${billData.total.toFixed(0)})`}</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-[#6B5B50] px-1">
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
