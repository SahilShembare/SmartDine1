import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CheckCircle2, 
  UtensilsCrossed, 
  Receipt, 
  Phone, 
  User, 
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  Gift,
  Check,
  Lock,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function CustomerWebCart() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    currentTable, 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    cartSubtotal, 
    cartTax, 
    cartTotal, 
    placeOrder 
  } = useTableOrder();

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(
    currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || ''
  );
  const [orderNotes, setOrderNotes] = useState('');

  // Payment Selection: 'upi' | 'card' | 'netbanking' | 'cash'
  const [paymentMode, setPaymentMode] = useState('upi');

  // UPI sub-options
  const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' | 'id' | 'app'
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');

  // Card sub-options
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net Banking sub-options
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Coupon code in cart
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // States for flow
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Format Card Number input
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };

  // Apply Promo Coupon
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'ROYAL50') {
      if (cartSubtotal < 299) {
        toast.error('Minimum order of ₹299 required for ROYAL50');
        return;
      }
      const disc = Math.min(cartSubtotal * 0.5, 150);
      setAppliedDiscount(disc);
      setAppliedCoupon({ code: 'ROYAL50', discount: disc, desc: '50% Royal Discount Applied' });
      toast.success(`Coupon ROYAL50 applied! You saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else if (clean === 'FEAST100') {
      if (cartSubtotal < 499) {
        toast.error('Minimum order of ₹499 required for FEAST100');
        return;
      }
      setAppliedDiscount(100);
      setAppliedCoupon({ code: 'FEAST100', discount: 100, desc: '₹100 Feast Discount Applied' });
      toast.success('Coupon FEAST100 applied! You saved ₹100', { icon: '🎁' });
    } else if (clean === 'WELCOME20') {
      const disc = Math.min(cartSubtotal * 0.2, 80);
      setAppliedDiscount(disc);
      setAppliedCoupon({ code: 'WELCOME20', discount: disc, desc: '20% Welcome Discount Applied' });
      toast.success(`Coupon WELCOME20 applied! You saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else if (clean === 'THALI30') {
      const disc = Math.min(cartSubtotal * 0.3, 120);
      setAppliedDiscount(disc);
      setAppliedCoupon({ code: 'THALI30', discount: disc, desc: '30% Thali Special Discount Applied' });
      toast.success(`Coupon THALI30 applied! You saved ₹${disc.toFixed(0)}`, { icon: '🎁' });
    } else {
      toast.error('Invalid coupon code. Try ROYAL50, FEAST100, or WELCOME20');
    }
  };

  const removeCoupon = () => {
    setAppliedDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast('Coupon removed', { icon: 'ℹ️' });
  };

  // Final Payable amount calculation
  const calculatedTax = (cartSubtotal - appliedDiscount) * 0.05;
  const finalPayable = Math.max(0, (cartSubtotal - appliedDiscount) + calculatedTax);

  // Popular Indian Banks list
  const popularBanks = [
    { name: 'HDFC Bank', code: 'HDFC', badge: 'Popular' },
    { name: 'State Bank of India', code: 'SBI', badge: 'Popular' },
    { name: 'ICICI Bank', code: 'ICICI', badge: 'Popular' },
    { name: 'Axis Bank', code: 'AXIS', badge: '' },
    { name: 'Kotak Mahindra', code: 'KOTAK', badge: '' },
    { name: 'Punjab National Bank', code: 'PNB', badge: '' }
  ];

  // UPI Apps list
  const upiApps = [
    { name: 'Google Pay', icon: '⚡' },
    { name: 'PhonePe', icon: '🟣' },
    { name: 'Paytm UPI', icon: '🔷' },
    { name: 'BHIM UPI', icon: '🇮🇳' },
    { name: 'Cred UPI', icon: '💳' }
  ];

  // Place order & process payment
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!currentTable) {
      toast.error('Please scan your restaurant table QR first.');
      navigate('/scan');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // Validation for specific payment methods
    if (paymentMode === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
        toast.error('Please enter a valid 16-digit Card Number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error('Please enter card expiry date (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        toast.error('Please enter 3-digit CVV');
        return;
      }
    }

    if (paymentMode === 'upi' && upiMethod === 'id' && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. mobile@upi)');
      return;
    }

    setLoading(true);
    try {
      // Save customer contact info for convenience
      if (customerName) localStorage.setItem('smartdine_guest_name', customerName.trim());
      if (customerPhone) localStorage.setItem('smartdine_guest_phone', customerPhone.trim());

      const paymentLabel = 
        paymentMode === 'upi' ? `UPI (${upiMethod === 'qr' ? 'Table QR' : upiMethod === 'id' ? upiId : selectedUpiApp})` :
        paymentMode === 'card' ? `Card (ending ${cardNumber.slice(-4)})` :
        paymentMode === 'netbanking' ? `Net Banking (${selectedBank})` :
        'Cash (Pay at Table / Counter)';

      const orderId = await placeOrder({
        customerName: customerName.trim() || `Table ${currentTable} Guest`,
        customerPhone: customerPhone.trim(),
        customerId: currentUser?.uid || null,
        notes: orderNotes.trim(),
        paymentMethod: paymentLabel,
        paymentStatus: paymentMode === 'cash' ? 'Pay after Dining' : 'Paid Online (Verified)',
        discountAmount: appliedDiscount,
        couponCode: appliedCoupon?.code || null,
        total: finalPayable
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      toast.success('🎉 Order Placed & Sent to Kitchen!', {
        duration: 3500,
        icon: '👨‍🍳'
      });

      // Navigate to live tracking
      navigate(`/track/${orderId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-[#F4B942] flex items-center justify-center text-[#E8752A] mb-4 shadow-[0_4px_20px_rgba(59,33,21,0.08)]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-[#24140D]">Your Cart is Empty</h2>
        <p className="text-xs text-[#6B5B50] max-w-xs mt-1 mb-6">
          Looks like you haven't added any authentic delicacies yet. Check out our menu!
        </p>
        <Link
          to="/menu"
          className="px-6 py-3.5 rounded-2xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-sm shadow-md transition active:scale-95 flex items-center gap-2"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Explore Royal Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] pb-24 font-sans">
      
      {/* Top Header */}
      <div className="bg-white/95 border-b border-[#F4B942]/30 p-4 sticky top-16 z-30 backdrop-blur-md shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/menu"
            className="flex items-center gap-1 text-xs font-bold text-[#6B5B50] hover:text-[#E8752A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>

          <div className="px-3.5 py-1 rounded-xl bg-[#3B2115] text-[#FFF8ED] border border-[#F4B942]/60 font-black text-xs shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F4B942] animate-pulse" />
            <span>TABLE {currentTable || '01'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        
        {/* Table Warning if not set */}
        {!currentTable && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-[#F4B942] text-[#3B2115] text-xs font-semibold flex items-center justify-between shadow-sm">
            <span>No dining table connected. Please scan your table standee QR.</span>
            <Link to="/scan" className="font-bold underline text-[#E8752A]">Scan Table QR</Link>
          </div>
        )}

        {/* Cart Items List */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl overflow-hidden divide-y divide-[#FFF8ED] shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
          <div className="p-4 bg-[#FFF8ED]/60 flex items-center justify-between">
            <h2 className="font-black text-sm text-[#24140D] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#E8752A]" />
              <span>Order Items ({cart.length})</span>
            </h2>
            <button
              onClick={clearCart}
              className="text-xs font-bold text-[#D32F2F] hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          </div>

          {cart.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                {/* Thumb */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-[#FFF8ED] shrink-0 border border-[#6B5B50]/20"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                      item.isVeg !== false ? 'border-[#198754]' : 'border-[#D32F2F]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.isVeg !== false ? 'bg-[#198754]' : 'bg-[#D32F2F]'
                      }`} />
                    </span>
                    <h4 className="font-extrabold text-sm text-[#24140D]">{item.name}</h4>
                  </div>
                  <div className="text-xs font-black text-[#3B2115] mt-0.5">
                    ₹{item.price} each
                  </div>
                  {item.instructions && (
                    <p className="text-[11px] text-[#6B5B50] italic mt-0.5">
                      "{item.instructions}"
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2.5 bg-[#FFF8ED] px-2.5 py-1 rounded-xl border border-[#F4B942]/40">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="text-[#6B5B50] hover:text-[#E8752A] p-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs text-[#24140D] min-w-[14px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="text-[#6B5B50] hover:text-[#E8752A] p-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Apply Coupon Box */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl p-4 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs text-[#3B2115] uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#E8752A]" />
              <span>Apply Discount Coupon</span>
            </h3>
            {appliedCoupon && (
              <button
                onClick={removeCoupon}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {appliedCoupon ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-[#198754]/40 flex items-center justify-between text-xs text-[#198754] font-bold">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#198754]" />
                <span>{appliedCoupon.code} ({appliedCoupon.desc})</span>
              </div>
              <span className="font-black">-₹{appliedCoupon.discount.toFixed(0)}</span>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code (e.g. ROYAL50, FEAST100)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs font-bold text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#3B2115] hover:bg-[#E8752A] text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}
        </div>

        {/* Customer Details Form */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl p-5 space-y-3.5 shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
          <h3 className="font-black text-sm text-[#24140D] flex items-center gap-2">
            <User className="w-4 h-4 text-[#E8752A]" />
            <span>Dine-In Customer Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3B2115] mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh / Priya"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A] focus:bg-white transition font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B2115] mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A] focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3B2115] mb-1">Kitchen Instructions / Special Notes</label>
            <input
              type="text"
              placeholder="e.g. Medium spicy, extra papad, serve mocktail first..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A] focus:bg-white transition"
            />
          </div>
        </div>

        {/* REAL PAYMENT METHODS SECTION: UPI, Cards, NetBanking, Cash */}
        <div className="bg-white border-2 border-[#F4B942]/60 rounded-3xl p-5 sm:p-6 space-y-5 shadow-[0_4px_20px_rgba(59,33,21,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#24140D] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#198754]" />
              <span>Select Payment Method</span>
            </h3>
            <span className="text-[10px] font-bold text-[#198754] bg-emerald-50 px-2 py-0.5 rounded-full border border-[#198754]/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>100% Secure</span>
            </span>
          </div>

          {/* 4 Main Payment Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* Tab 1: UPI */}
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMode === 'upi'
                  ? 'bg-[#3B2115] border-[#F4B942] text-[#F4B942] shadow-md'
                  : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${paymentMode === 'upi' ? 'text-[#F4B942]' : 'text-[#E8752A]'}`} />
              <span className="font-black text-xs">UPI Apps</span>
              <span className="text-[9px] opacity-75">GPay/PhonePe/QR</span>
            </button>

            {/* Tab 2: Cards */}
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMode === 'card'
                  ? 'bg-[#3B2115] border-[#F4B942] text-[#F4B942] shadow-md'
                  : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentMode === 'card' ? 'text-[#F4B942]' : 'text-[#E8752A]'}`} />
              <span className="font-black text-xs">Debit / Credit</span>
              <span className="text-[9px] opacity-75">Visa, Master, RuPay</span>
            </button>

            {/* Tab 3: Net Banking */}
            <button
              type="button"
              onClick={() => setPaymentMode('netbanking')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMode === 'netbanking'
                  ? 'bg-[#3B2115] border-[#F4B942] text-[#F4B942] shadow-md'
                  : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
              }`}
            >
              <Building2 className={`w-5 h-5 ${paymentMode === 'netbanking' ? 'text-[#F4B942]' : 'text-[#E8752A]'}`} />
              <span className="font-black text-xs">Net Banking</span>
              <span className="text-[9px] opacity-75">All Major Banks</span>
            </button>

            {/* Tab 4: Cash */}
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMode === 'cash'
                  ? 'bg-[#3B2115] border-[#F4B942] text-[#F4B942] shadow-md'
                  : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
              }`}
            >
              <Banknote className={`w-5 h-5 ${paymentMode === 'cash' ? 'text-[#F4B942]' : 'text-[#E8752A]'}`} />
              <span className="font-black text-xs">Pay at Table</span>
              <span className="text-[9px] opacity-75">Cash / Counter</span>
            </button>

          </div>

          {/* Sub-panel details depending on paymentMode */}

          {/* 1. UPI DETAILS */}
          {paymentMode === 'upi' && (
            <div className="p-4 rounded-2xl bg-[#FFF8ED]/70 border border-[#F4B942]/40 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 border-b border-[#F4B942]/30 pb-2">
                <button
                  type="button"
                  onClick={() => setUpiMethod('qr')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    upiMethod === 'qr'
                      ? 'bg-[#E8752A] text-white shadow-sm font-black'
                      : 'bg-white text-[#6B5B50]'
                  }`}
                >
                  Dynamic UPI QR
                </button>
                <button
                  type="button"
                  onClick={() => setUpiMethod('app')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    upiMethod === 'app'
                      ? 'bg-[#E8752A] text-white shadow-sm font-black'
                      : 'bg-white text-[#6B5B50]'
                  }`}
                >
                  Pay via UPI App
                </button>
                <button
                  type="button"
                  onClick={() => setUpiMethod('id')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    upiMethod === 'id'
                      ? 'bg-[#E8752A] text-white shadow-sm font-black'
                      : 'bg-white text-[#6B5B50]'
                  }`}
                >
                  Enter UPI ID
                </button>
              </div>

              {/* Dynamic QR Code Mode */}
              {upiMethod === 'qr' && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-[#F4B942]/30">
                  <div className="w-36 h-36 bg-white border-2 border-[#3B2115] rounded-2xl p-2 flex flex-col items-center justify-center shrink-0 shadow-inner">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=smartdine@icici%26pn=SmartDine%20Restaurant%26am=${finalPayable.toFixed(2)}%26cu=INR`} 
                      alt="UPI QR Code"
                      className="w-28 h-28 object-contain"
                    />
                    <span className="text-[9px] font-black text-[#3B2115] uppercase tracking-wider mt-1">Scan & Pay UPI</span>
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="font-black text-sm text-[#24140D]">
                      Scan to Pay ₹{finalPayable.toFixed(2)}
                    </div>
                    <p className="text-xs text-[#6B5B50]">
                      Open Google Pay, PhonePe, Paytm or BHIM on your phone and scan this dynamic QR.
                    </p>
                    <div className="inline-flex items-center gap-1 text-[11px] text-[#198754] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Instant verification enabled for Table {currentTable || '01'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI App Selection */}
              {upiMethod === 'app' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#3B2115]">Choose UPI Application</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {upiApps.map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.name)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                          selectedUpiApp === app.name
                            ? 'bg-white border-[#E8752A] text-[#E8752A] shadow-sm ring-1 ring-[#E8752A]'
                            : 'bg-white border-[#6B5B50]/20 text-[#24140D]'
                        }`}
                      >
                        <span className="text-base">{app.icon}</span>
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* UPI ID input */}
              {upiMethod === 'id' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3B2115]">Virtual Payment Address (VPA / UPI ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank / 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-bold text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A]"
                  />
                  <p className="text-[10px] text-[#6B5B50]">
                    A payment request of ₹{finalPayable.toFixed(2)} will be prompted to your UPI app.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. CARD DETAILS */}
          {paymentMode === 'card' && (
            <div className="p-4 rounded-2xl bg-[#FFF8ED]/70 border border-[#F4B942]/40 space-y-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-[#3B2115] mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8910"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-mono font-bold text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FFF8ED] text-[#3B2115] border border-[#6B5B50]/20">
                      RuPay / Visa / MC
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-[#3B2115] mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-bold text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3B2115] mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-mono font-bold text-[#24140D] text-center focus:outline-none focus:border-[#E8752A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3B2115] mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F4B942]/60 text-xs font-mono font-bold text-[#24140D] text-center focus:outline-none focus:border-[#E8752A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#6B5B50] pt-1">
                <Lock className="w-3 h-3 text-[#198754]" />
                <span>Card data is encrypted with 256-bit bank grade security standard.</span>
              </div>
            </div>
          )}

          {/* 3. NET BANKING DETAILS */}
          {paymentMode === 'netbanking' && (
            <div className="p-4 rounded-2xl bg-[#FFF8ED]/70 border border-[#F4B942]/40 space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-[#3B2115]">Select Your Bank</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {popularBanks.map((bank) => (
                  <button
                    key={bank.name}
                    type="button"
                    onClick={() => setSelectedBank(bank.name)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between cursor-pointer ${
                      selectedBank === bank.name
                        ? 'bg-white border-[#E8752A] text-[#E8752A] shadow-sm ring-1 ring-[#E8752A]'
                        : 'bg-white border-[#6B5B50]/20 text-[#24140D]'
                    }`}
                  >
                    <span>{bank.name}</span>
                    {bank.badge && (
                      <span className="text-[9px] text-[#198754] font-extrabold mt-1">{bank.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. CASH DETAILS */}
          {paymentMode === 'cash' && (
            <div className="p-4 rounded-2xl bg-[#FFF8ED]/70 border border-[#F4B942]/40 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs text-[#24140D]">
                <Banknote className="w-4 h-4 text-[#198754]" />
                <span>Pay After Dining (Cash / Card at Table)</span>
              </div>
              <p className="text-xs text-[#6B5B50] leading-relaxed">
                Your order will be sent to the chef immediately. You can settle your total bill amount of <strong>₹{finalPayable.toFixed(2)}</strong> via Cash or Card with your restaurant captain after enjoying your meal.
              </p>
            </div>
          )}

        </div>

        {/* Bill Breakdown Summary */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
          <h3 className="font-black text-sm text-[#24140D] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#E8752A]" />
            <span>Bill Summary</span>
          </h3>

          <div className="space-y-2 text-xs text-[#6B5B50]">
            <div className="flex justify-between">
              <span>Item Subtotal ({cart.length} items)</span>
              <span className="text-[#24140D] font-bold">₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between text-[#198754] font-bold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{appliedDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Restaurant GST (5%)</span>
              <span className="text-[#24140D] font-bold">₹{calculatedTax.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-[#FFF8ED] flex justify-between text-base font-black text-[#24140D]">
              <span>Grand Total</span>
              <span className="text-[#E8752A] font-black text-xl">₹{finalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Place Order CTA Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full py-4 rounded-2xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-base shadow-[0_4px_20px_rgba(232,117,42,0.35)] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Confirm & Pay ₹{finalPayable.toFixed(0)}</span>
        </button>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#F4B942] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8ED] text-[#E8752A] border border-[#F4B942] flex items-center justify-center mx-auto shadow-sm">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-[#24140D]">Send Order to Kitchen?</h3>
              <p className="text-xs text-[#6B5B50]">
                You are placing an order for <strong>Table {currentTable || '01'}</strong> totaling <strong className="text-[#E8752A]">₹{finalPayable.toFixed(0)}</strong> via <strong>{paymentMode.toUpperCase()}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#FFF8ED] text-xs font-bold text-[#6B5B50] hover:text-[#24140D] border border-[#6B5B50]/20 transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePlaceOrder}
                className="flex-1 py-2.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-xs font-black text-white shadow-md transition cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
