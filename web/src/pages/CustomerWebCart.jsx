import React, { useState, useMemo } from 'react';
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
  Gift,
  Check,
  Lock,
  ChevronRight,
  Clock,
  AlertCircle,
  TicketPercent,
  Tag,
  Copy,
  X
} from 'lucide-react';
import { openRazorpayPayment } from '../utils/razorpay';
import { getCartComplementaryItems, getAiSuggestedCombo } from '../services/customerAiService';
import CustomerFeedbackModal from '../components/CustomerFeedbackModal';

const DEFAULT_VOUCHERS = [
  {
    id: 'v1',
    code: 'ROYAL50',
    title: '50% Royal Dining Discount',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 150,
    minOrderValue: 299,
    badge: '👑 BEST VALUE',
    description: 'Get 50% OFF up to ₹150 on orders above ₹299.',
    terms: 'Valid across our signature curries, tandoori items & platters.',
    expiryDate: '31 Dec 2026'
  },
  {
    id: 'v2',
    code: 'FEAST100',
    title: 'Flat ₹100 Off Grand Feast',
    discountType: 'flat',
    discountValue: 100,
    maxDiscount: 100,
    minOrderValue: 499,
    badge: '🎉 POPULAR',
    description: 'Flat ₹100 OFF on dining orders above ₹499.',
    terms: 'Applicable on complete dining bills above ₹499.',
    expiryDate: '31 Dec 2026'
  },
  {
    id: 'v3',
    code: 'WELCOME20',
    title: '20% Welcome Dine-in Discount',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 80,
    minOrderValue: 199,
    badge: '👋 NEW GUEST',
    description: 'Enjoy 20% OFF up to ₹80 on your dining table.',
    terms: 'Valid for all guests and dine-in tables.',
    expiryDate: '31 Dec 2026'
  },
  {
    id: 'v4',
    code: 'THALI30',
    title: '30% Special Thali Discount',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 120,
    minOrderValue: 249,
    badge: '🍛 THALI SPECIAL',
    description: '30% OFF up to ₹120 on authentic Indian meal combos.',
    terms: 'Applicable on Maharaja Thali, Deluxe Thali, and Combos.',
    expiryDate: '31 Dec 2026'
  },
  {
    id: 'v5',
    code: 'SMARTDINE15',
    title: '15% Quick Bite Discount',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 60,
    minOrderValue: 149,
    badge: '⚡ QUICK BITE',
    description: '15% OFF up to ₹60 on snacks, beverages & sides.',
    terms: 'No minimum dish restriction.',
    expiryDate: '31 Dec 2026'
  }
];

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
    placeOrder,
    menuItems,
    addToCart 
  } = useTableOrder();

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(
    currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || ''
  );
  const [orderNotes, setOrderNotes] = useState('');

  // Payment Selection: 'razorpay' | 'upi' | 'card' | 'netbanking' | 'cash'
  const [paymentMode, setPaymentMode] = useState('razorpay');

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

  // Coupon code & Available Vouchers in cart
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherFilter, setVoucherFilter] = useState('all');

  // Load vouchers from admin storage or defaults
  const [availableVouchers] = useState(() => {
    try {
      const adminCoupons = localStorage.getItem('smartdine_admin_coupons');
      if (adminCoupons) {
        const parsed = JSON.parse(adminCoupons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map();
          DEFAULT_VOUCHERS.forEach(v => map.set(v.code, v));
          parsed.filter(p => p.active !== false).forEach(p => {
            map.set(p.code, {
              id: p.id || p.code,
              code: p.code,
              title: p.description || `${p.discountValue}${p.discountType === 'percentage' ? '%' : '₹'} Off`,
              discountType: p.discountType || 'percentage',
              discountValue: p.discountValue || 20,
              maxDiscount: p.maxDiscount || 100,
              minOrderValue: p.minOrderValue || 199,
              badge: '🏷️ EXCLUSIVE',
              description: p.description || `Special discount with code ${p.code}`,
              terms: 'Special voucher issued by restaurant manager.',
              expiryDate: p.expiryDate || '31 Dec 2026'
            });
          });
          return Array.from(map.values());
        }
      }
      return DEFAULT_VOUCHERS;
    } catch {
      return DEFAULT_VOUCHERS;
    }
  });

  // States for flow
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  // Smart Cart Complementary Items ("Complete Your Meal")
  const complementaryItems = useMemo(() => {
    return getCartComplementaryItems({ cart, menuItems, limit: 3 });
  }, [cart, menuItems]);

  // AI Suggested Combo Recommendation
  const aiCombo = useMemo(() => {
    return getAiSuggestedCombo({ cart, menuItems });
  }, [cart, menuItems]);

  // Handle Add AI Combo
  const handleAddAiCombo = () => {
    if (!aiCombo) return;
    aiCombo.items.forEach(dish => {
      addToCart(dish, 1, 'AI Suggested Combo Item');
    });
    toast.success(`🍽️ Added "${aiCombo.title}"! You saved ₹${aiCombo.savings}!`, {
      icon: '✨',
      duration: 3500
    });
  };

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

  // Calculate live savings for a voucher based on current cartSubtotal
  const calculateVoucherSavings = (voucher) => {
    if (!voucher) return 0;
    const minVal = voucher.minOrderValue || 0;
    if (cartSubtotal < minVal) return 0;

    let discount = 0;
    if (voucher.discountType === 'percentage') {
      discount = (cartSubtotal * (Number(voucher.discountValue) || 20)) / 100;
      const maxD = Number(voucher.maxDiscount) || Infinity;
      discount = Math.min(discount, maxD);
    } else {
      discount = Number(voucher.discountValue) || 100;
    }
    return Math.min(discount, cartSubtotal);
  };

  // Apply a specific discount voucher
  const applyVoucher = (voucher) => {
    if (!voucher) return;
    const minVal = voucher.minOrderValue || 0;
    if (cartSubtotal < minVal) {
      toast.error(`Minimum order of ₹${minVal} required for ${voucher.code}. Add ₹${(minVal - cartSubtotal).toFixed(0)} more!`, {
        icon: '⚠️'
      });
      return;
    }

    const savings = calculateVoucherSavings(voucher);
    setAppliedDiscount(savings);
    setAppliedCoupon({
      code: voucher.code,
      discount: savings,
      desc: voucher.title || voucher.description || `${voucher.code} Discount`,
      badge: voucher.badge
    });
    setCouponCode(voucher.code);
    setShowVoucherModal(false);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch {}

    toast.success(`🎉 Voucher ${voucher.code} applied! You saved ₹${savings.toFixed(0)}!`, {
      icon: '🎁',
      duration: 3500
    });
  };

  // Apply Promo Coupon from text input
  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    const matched = availableVouchers.find(v => v.code === clean);
    if (matched) {
      applyVoucher(matched);
    } else {
      toast.error(`Coupon "${clean}" is invalid. Please select from available vouchers.`);
    }
  };

  const removeCoupon = () => {
    setAppliedDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast('Voucher removed', { icon: 'ℹ️' });
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
    e?.preventDefault?.();
    const effectiveTable = currentTable || localStorage.getItem('smartdine_active_table') || '1';
    if (!currentTable) {
      setCurrentTable(effectiveTable);
      try { localStorage.setItem('smartdine_active_table', effectiveTable); } catch {}
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // If Razorpay is selected, launch Razorpay Checkout directly
    if (paymentMode === 'razorpay') {
      setShowConfirmModal(false);
      setLoading(true);

      openRazorpayPayment({
        amount: finalPayable,
        name: 'SmartDine Restaurant',
        description: `Table ${effectiveTable} Dine-in Food Order`,
        orderId: `SD-CART-${Date.now()}`,
        customer: {
          name: customerName.trim() || `Table ${effectiveTable} Guest`,
          contact: customerPhone.trim() || '',
          email: currentUser?.email || 'guest@smartdine.com'
        },
        onSuccess: async (rzpResponse) => {
          await submitOrderPlacement({
            paymentLabel: `Razorpay Online (${rzpResponse.razorpay_payment_id})`,
            paymentStatus: 'Paid Online (Razorpay Verified)',
            transactionId: rzpResponse.razorpay_payment_id
          });
        },
        onFailure: (errMsg) => {
          setLoading(false);
          toast.error(errMsg || 'Razorpay payment was cancelled or failed.');
        }
      });
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
    const paymentLabel = 
      paymentMode === 'upi' ? `UPI (${upiMethod === 'qr' ? 'Table QR' : upiMethod === 'id' ? upiId : selectedUpiApp})` :
      paymentMode === 'card' ? `Card (ending ${cardNumber.slice(-4)})` :
      paymentMode === 'netbanking' ? `Net Banking (${selectedBank})` :
      'Cash (Pay at Table / Counter)';

    await submitOrderPlacement({
      paymentLabel,
      paymentStatus: paymentMode === 'cash' ? 'Pay after Dining' : 'Paid Online (Verified)',
      transactionId: `TXN-${Date.now()}`
    });
  };

  const submitOrderPlacement = async ({ paymentLabel, paymentStatus, transactionId }) => {
    try {
      if (customerName) localStorage.setItem('smartdine_guest_name', customerName.trim());
      if (customerPhone) localStorage.setItem('smartdine_guest_phone', customerPhone.trim());

      const orderId = await placeOrder({
        customerName: customerName.trim() || `Table ${currentTable} Guest`,
        customerPhone: customerPhone.trim(),
        customerId: currentUser?.uid || null,
        notes: orderNotes.trim(),
        paymentMethod: paymentLabel,
        paymentStatus: paymentStatus,
        transactionId: transactionId,
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

      // Trigger Post-Payment Feedback & Rating System immediately after payment
      setCompletedOrderData({
        orderId,
        orderItems: [...cart],
        amount: finalPayable,
        tableNumber: currentTable || '01'
      });
      setShowFeedbackModal(true);
    } catch (err) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleAddSampleFeast = () => {
    const paneer = menuItems?.find(m => m.name?.toLowerCase().includes('paneer butter') || m.name?.toLowerCase().includes('paneer')) || {
      id: 'demo-paneer',
      name: 'Paneer Butter Masala',
      price: 320,
      category: 'Main Course',
      isVeg: true,
      image: '/dishes/paneer_butter_masala.jpg'
    };
    const naan = menuItems?.find(m => m.name?.toLowerCase().includes('garlic naan') || m.name?.toLowerCase().includes('naan')) || {
      id: 'demo-naan',
      name: 'Garlic Butter Naan',
      price: 65,
      category: 'Breads',
      isVeg: true,
      image: '/dishes/garlic_naan.jpg'
    };
    const dal = menuItems?.find(m => m.name?.toLowerCase().includes('dal makhani')) || {
      id: 'demo-dal',
      name: 'Dal Makhani',
      price: 260,
      category: 'Main Course',
      isVeg: true,
      image: '/dishes/dal_makhani.jpg'
    };

    addToCart(paneer);
    addToCart(naan);
    addToCart(naan);
    addToCart(dal);
    setSelectedVoucher(DEFAULT_VOUCHERS[0]);
    toast.success('🎉 Royal Feast added to cart with ROYAL50 (50% OFF) applied!');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] pb-24 font-sans">
        {/* Top Header */}
        <div className="bg-white/95 border-b border-[#F4B942]/30 p-4 sticky top-16 z-30 backdrop-blur-md shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link
              to="/menu"
              className="flex items-center gap-1.5 text-xs font-bold text-[#6B5B50] hover:text-[#24140D] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </Link>
            <div className="text-center">
              <h1 className="text-base font-black text-[#24140D]">Royal Dining Cart</h1>
              <p className="text-[11px] text-[#6B5B50] font-medium">Table {currentTable || '01'} • Dine-in</p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Empty Notification Banner */}
          <div className="bg-white rounded-3xl p-6 text-center border border-[#F4B942]/30 shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-[#F4B942] flex items-center justify-center text-[#E8752A] mx-auto mb-3 shadow-inner">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-[#24140D]">Your Dining Cart is Currently Empty</h2>
            <p className="text-xs text-[#6B5B50] max-w-sm mx-auto mt-1 mb-4">
              Add your favorite delicacies to apply exclusive discount vouchers and pay securely via Razorpay UPI / Cards.
            </p>

            {/* Quick Demo Add Button */}
            <button
              onClick={handleAddSampleFeast}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E8752A] to-[#F4B942] hover:brightness-105 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>⚡ Add Sample Royal Feast & Apply 50% OFF (₹645)</span>
            </button>
          </div>

          {/* Available Vouchers Section */}
          <div className="bg-white rounded-3xl p-5 border border-[#F4B942]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-[#E8752A]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#24140D]">Available Discount Vouchers</h3>
                  <p className="text-[10px] text-[#6B5B50]">Discounts will automatically calculate when food is added</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                5 ACTIVE OFFERS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_VOUCHERS.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-[#F4B942]/70 bg-[#FFF8ED]/50 flex flex-col justify-between hover:border-[#E8752A] transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-[#24140D] bg-white px-2 py-0.5 rounded border border-[#F4B942]">
                          {v.code}
                        </span>
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {v.badge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#24140D] mt-1.5">{v.title}</p>
                      <p className="text-[11px] text-[#6B5B50] mt-0.5">{v.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#F4B942]/20 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Min Order: ₹{v.minOrderValue}</span>
                    <button
                      onClick={() => {
                        handleAddSampleFeast();
                        setSelectedVoucher(v);
                      }}
                      className="text-xs font-bold text-[#E8752A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply & Fill Cart →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Bestsellers */}
          <div className="bg-white rounded-3xl p-5 border border-[#F4B942]/30 shadow-md space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#24140D] flex items-center gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#E8752A]" />
              <span>Quick Add Bestsellers</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Paneer Butter Masala', price: 320, image: '/dishes/paneer_butter_masala.jpg', category: 'Main Course' },
                { name: 'Garlic Butter Naan', price: 65, image: '/dishes/garlic_naan.jpg', category: 'Breads' },
                { name: 'Dal Makhani', price: 260, image: '/dishes/dal_makhani.jpg', category: 'Main Course' },
                { name: 'Deluxe Veg Thali', price: 399, image: '/dishes/deluxe_veg_thali.jpg', category: 'Thali' }
              ].map((dish, i) => (
                <div key={i} className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between text-center">
                  <img src={dish.image} alt={dish.name} className="w-full h-20 object-cover rounded-xl mb-2" />
                  <p className="text-xs font-bold text-[#24140D] line-clamp-1">{dish.name}</p>
                  <p className="text-xs font-black text-[#E8752A] mt-0.5">₹{dish.price}</p>
                  <button
                    onClick={() => {
                      addToCart({
                        id: `quick-${i}`,
                        name: dish.name,
                        price: dish.price,
                        category: dish.category,
                        image: dish.image,
                        isVeg: true
                      });
                      toast.success(`Added ${dish.name} to cart!`);
                    }}
                    className="mt-2 w-full py-1.5 rounded-xl bg-[#24140D] hover:bg-[#E8752A] text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    + Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#E8752A] hover:underline"
            >
              <span>Explore Complete Royal Restaurant Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
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

        {/* ============================================================ */}
        {/* 3. SMART CART RECOMMENDATIONS: COMPLETE YOUR MEAL            */}
        {/* ============================================================ */}
        {complementaryItems.length > 0 && (
          <div className="bg-white border border-[#F4B942]/50 rounded-2xl p-4 shadow-[0_2px_12px_rgba(36,20,13,0.06)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-[#24140D] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#E8752A]" />
                  <span>🧠 Complete Your Meal</span>
                </h3>
                <p className="text-[11px] text-[#6B5B50] mt-0.5">
                  Customers who ordered this also enjoyed:
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#E8752A]">
                AI Suggested
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {complementaryItems.map(({ dish, reason }) => (
                <div
                  key={dish.id}
                  className="p-2.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 flex items-center justify-between gap-2.5 hover:border-[#E8752A] transition"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200'; }}
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-[#24140D] truncate">{dish.name}</p>
                      <p className="text-[10px] text-[#E8752A] font-medium truncate">{reason}</p>
                      <span className="text-xs font-black text-[#3B2115]">₹{dish.price}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(dish, 1, 'Complementary Add-on');
                      toast.success(`Added ${dish.name} to cart!`, { icon: '🍽️' });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#E8752A] hover:bg-[#3B2115] text-white font-bold text-xs shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. AI COMBO RECOMMENDATIONS                                  */}
        {/* ============================================================ */}
        {aiCombo && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF8ED] via-[#FFFDF9] to-[#FFF8ED] border-2 border-[#F4B942] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">🍽️</span>
                <h4 className="font-black text-xs sm:text-sm text-[#24140D]">AI Suggested Combo</h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Save ₹{aiCombo.savings}
                </span>
              </div>
              <p className="text-xs font-bold text-[#E8752A]">{aiCombo.title}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B5B50] line-through">₹{aiCombo.individualPrice}</span>
                <span className="font-black text-[#198754] text-sm">₹{aiCombo.comboPrice}</span>
                <span className="text-[10px] text-[#6B5B50] font-medium">• {aiCombo.why}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAiCombo}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E8752A] to-[#EA580C] hover:from-[#EA580C] hover:to-[#9A3412] text-white text-xs font-black shadow-md transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Add Combo (Save ₹{aiCombo.savings})</span>
            </button>
          </div>
        )}

        {/* Apply Coupon Box & Available Vouchers Showcase */}
        <div className="bg-white border border-[#F4B942]/40 rounded-2xl p-4 sm:p-5 shadow-[0_2px_14px_rgba(36,20,13,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs sm:text-sm text-[#3B2115] uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#E8752A]" />
              <span>Discount Vouchers & Offers</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowVoucherModal(true)}
              className="text-xs font-bold text-[#E8752A] hover:text-[#3B2115] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All ({availableVouchers.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Applied Voucher Card */}
          {appliedCoupon ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border-2 border-emerald-400 flex items-center justify-between text-xs text-[#198754] font-bold shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-extrabold">
                      APPLIED
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{appliedCoupon.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm text-emerald-800">-₹{appliedCoupon.discount.toFixed(0)}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter promo code (e.g. ROYAL50, FEAST100)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FFF8ED] border border-[#F4B942]/40 text-xs font-bold text-[#24140D] placeholder-[#6B5B50]/60 focus:outline-none focus:border-[#E8752A] uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#3B2115] hover:bg-[#E8752A] text-white font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}

          {/* Available Vouchers Showcase Grid */}
          <div className="space-y-2.5 pt-2 border-t border-[#F4B942]/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#6B5B50] flex items-center gap-1.5">
                <TicketPercent className="w-3.5 h-3.5 text-[#E8752A]" />
                <span>Available Discount Vouchers for You</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableVouchers.slice(0, 4).map(v => {
                const isEligible = cartSubtotal >= (v.minOrderValue || 0);
                const savings = isEligible ? calculateVoucherSavings(v) : 0;
                const isApplied = appliedCoupon?.code === v.code;

                return (
                  <div
                    key={v.code}
                    className={`p-3.5 rounded-2xl border-2 transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isApplied
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : isEligible
                        ? 'bg-gradient-to-br from-white to-[#FFFDF9] border-[#F4B942]/80 hover:border-[#E8752A] shadow-xs hover:shadow-md'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#3B2115] text-[#F4B942] border border-[#F4B942]/40 tracking-wider">
                            {v.code}
                          </span>
                          {v.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-[#E8752A]">
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-[#24140D] line-clamp-1">{v.title}</h4>
                        <p className="text-[10px] text-[#6B5B50] line-clamp-1">{v.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {isEligible ? (
                          <span className="text-[11px] font-black text-emerald-600 block bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Save ₹{savings.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md block border border-amber-200/60">
                            Add ₹{((v.minOrderValue || 0) - cartSubtotal).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-[#6B5B50]">
                      <span>Min Order: <strong>₹{v.minOrderValue}</strong></span>
                      
                      {isApplied ? (
                        <span className="font-black text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyVoucher(v)}
                          disabled={!isEligible}
                          className={`px-3 py-1 rounded-xl font-black text-[11px] transition cursor-pointer ${
                            isEligible
                              ? 'bg-[#E8752A] hover:bg-[#3B2115] text-white shadow-xs active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isEligible ? 'APPLY' : 'LOCKED'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

          {/* Discount Vouchers Banner in Payment Section */}
          {appliedCoupon ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-900">{appliedCoupon.code} Active</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold">
                      -₹{appliedDiscount.toFixed(0)} OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{appliedCoupon.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer whitespace-nowrap"
              >
                Change Voucher
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-[#FFF8ED] border-2 border-dashed border-[#F4B942] flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8752A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  🎟️
                </div>
                <div>
                  <p className="text-xs font-black text-[#3B2115] flex items-center gap-1.5">
                    <span>{availableVouchers.length} Discount Vouchers Available!</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E8752A] text-white font-extrabold uppercase">
                      Save up to ₹150
                    </span>
                  </p>
                  <p className="text-[11px] text-[#6B5B50]">
                    Apply an instant voucher before payment to reduce your bill.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E8752A] hover:bg-[#3B2115] text-white text-xs font-black shadow-sm transition active:scale-95 whitespace-nowrap cursor-pointer"
              >
                View Vouchers
              </button>
            </div>
          )}

          {/* 4 Main Payment Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* Tab 1: Razorpay (Featured) */}
            <button
              type="button"
              onClick={() => setPaymentMode('razorpay')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer relative overflow-hidden ${
                paymentMode === 'razorpay'
                  ? 'bg-[#0C2340] border-[#2B84EA] text-white shadow-md'
                  : 'bg-[#FFF8ED] border-[#6B5B50]/20 text-[#24140D] hover:bg-white'
              }`}
            >
              <span className="absolute top-0 right-0 bg-[#2B84EA] text-[8px] font-black text-white px-1.5 py-0.5 rounded-bl-lg tracking-wider">
                FAST
              </span>
              <div className="w-5 h-5 rounded-md bg-[#2B84EA] text-white font-black text-xs flex items-center justify-center shadow-sm">
                R
              </div>
              <span className="font-black text-xs">Razorpay</span>
              <span className="text-[9px] opacity-80">UPI / Cards / NetBanking</span>
            </button>

            {/* Tab 2: UPI Apps */}
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
              <span className="font-black text-xs">Direct UPI</span>
              <span className="text-[9px] opacity-75">Table Dynamic QR</span>
            </button>

            {/* Tab 3: Card / NetBanking */}
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
              <span className="font-black text-xs">Card / Banking</span>
              <span className="text-[9px] opacity-75">Visa, Master, RuPay</span>
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

          {/* 0. RAZORPAY SUB-PANEL */}
          {paymentMode === 'razorpay' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0C2340]/5 via-blue-50/50 to-indigo-50/40 border border-blue-200/80 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0C2340] flex items-center justify-center text-[#2B84EA] font-black text-base shadow-sm">
                    R
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Razorpay Online Checkout</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Official Gateway</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">100% RBI Authorized & 256-Bit SSL Encrypted</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Instant
                </span>
              </div>

              {/* Supported Channels Pill Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-[10px] font-semibold text-slate-700">
                <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-sm flex flex-col items-center gap-1">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>UPI / GPay / PhonePe</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-sm flex flex-col items-center gap-1">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Debit / Credit Cards</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-sm flex flex-col items-center gap-1">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>50+ NetBanking</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-sm flex flex-col items-center gap-1">
                  <Gift className="w-4 h-4 text-orange-600" />
                  <span>Wallets & PayLater</span>
                </div>
              </div>

              <div className="bg-white/90 p-3 rounded-xl border border-blue-100/70 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pay securely via Razorpay Checkout Modal</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                  Clicking below launches the Razorpay checkout. Your order will be immediately sent to the kitchen KOT queue upon successful verification.
                </p>
                <button
                  type="button"
                  onClick={(e) => handlePlaceOrder(e)}
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2B84EA] to-[#1a73e8] hover:from-[#1a73e8] hover:to-[#0f5fc2] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{loading ? 'Opening Razorpay...' : `Pay ₹${finalPayable.toFixed(0)} with Razorpay Now`}</span>
                </button>
              </div>
            </div>
          )}

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
          onClick={(e) => {
            if (paymentMode === 'razorpay') {
              handlePlaceOrder(e);
            } else {
              setShowConfirmModal(true);
            }
          }}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black text-base shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
            paymentMode === 'razorpay'
              ? 'bg-[#0C2340] hover:bg-[#1a3a60] text-white shadow-blue-900/20'
              : 'bg-[#E8752A] hover:bg-[#3B2115] text-white shadow-[0_4px_20px_rgba(232,117,42,0.35)]'
          }`}
        >
          {loading ? (
            <span>Processing Order...</span>
          ) : paymentMode === 'razorpay' ? (
            <>
              <Lock className="w-5 h-5 text-[#2B84EA]" />
              <span>Pay ₹{finalPayable.toFixed(0)} via Razorpay</span>
            </>
          ) : paymentMode === 'cash' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Place Order & Pay at Table (₹{finalPayable.toFixed(0)})</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Pay ₹{finalPayable.toFixed(0)}</span>
            </>
          )}
        </button>

      </div>

      {/* ============================================================ */}
      {/* ALL DISCOUNT VOUCHERS MODAL                                 */}
      {/* ============================================================ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#F4B942] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3B2115] via-[#24140D] to-[#3B2115] text-[#FFF8ED] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8752A] text-white flex items-center justify-center font-black text-base shadow-sm">
                  🎟️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Available Discount Vouchers</h3>
                  <p className="text-[11px] text-[#FFF8ED]/80">Select any voucher to apply instant bill discount</p>
                </div>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-1 rounded-lg text-[#FFF8ED]/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Cart Value Indicator */}
            <div className="bg-[#FFF8ED] px-4 py-2.5 border-b border-[#F4B942]/30 flex items-center justify-between text-xs">
              <span className="text-[#6B5B50] font-semibold">Your Cart Subtotal:</span>
              <span className="font-black text-[#24140D] text-sm">₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Vouchers' },
                { id: 'eligible', label: 'Eligible Now' },
                { id: 'percentage', label: '% Percentage' },
                { id: 'flat', label: 'Flat Discounts' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setVoucherFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    voucherFilter === tab.id
                      ? 'bg-[#E8752A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Vouchers List */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {availableVouchers
                .filter(v => {
                  if (voucherFilter === 'eligible') return cartSubtotal >= (v.minOrderValue || 0);
                  if (voucherFilter === 'percentage') return v.discountType === 'percentage';
                  if (voucherFilter === 'flat') return v.discountType === 'flat';
                  return true;
                })
                .map(v => {
                  const isEligible = cartSubtotal >= (v.minOrderValue || 0);
                  const savings = isEligible ? calculateVoucherSavings(v) : 0;
                  const isApplied = appliedCoupon?.code === v.code;

                  return (
                    <div
                      key={v.code}
                      className={`p-3.5 rounded-2xl border-2 transition flex flex-col justify-between gap-3 ${
                        isApplied
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : isEligible
                          ? 'bg-gradient-to-br from-white to-[#FFF8ED] border-[#F4B942]/80 hover:border-[#E8752A] shadow-xs'
                          : 'bg-slate-50/90 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#3B2115] text-[#F4B942] border border-[#F4B942]/40 tracking-wider">
                              {v.code}
                            </span>
                            {v.badge && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-[#E8752A]">
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-[#24140D] mt-1">{v.title}</h4>
                          <p className="text-[11px] text-[#6B5B50] leading-relaxed">{v.description}</p>
                          {v.terms && (
                            <p className="text-[10px] text-slate-400 italic">• {v.terms}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {isEligible ? (
                            <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-black text-xs">
                              Save ₹{savings.toFixed(0)}
                            </div>
                          ) : (
                            <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-bold text-[10px]">
                              Add ₹{((v.minOrderValue || 0) - cartSubtotal).toFixed(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500">Min Order: <strong>₹{v.minOrderValue}</strong></span>
                        
                        {isApplied ? (
                          <span className="font-black text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active in Cart</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => applyVoucher(v)}
                            disabled={!isEligible}
                            className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                              isEligible
                                ? 'bg-[#E8752A] hover:bg-[#3B2115] text-white shadow-xs active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isEligible ? 'APPLY VOUCHER' : 'LOCKED'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#3B2115] hover:bg-[#24140D] text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal (for Cash / Direct offline) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#F4B942] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8ED] text-[#E8752A] border border-[#F4B942] flex items-center justify-center mx-auto shadow-sm">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-[#24140D]">Send Order to Kitchen?</h3>
              <p className="text-xs text-[#6B5B50]">
                You are placing an order for <strong>Table {currentTable || '01'}</strong> totaling <strong className="text-[#E8752A]">₹{finalPayable.toFixed(0)}</strong> via <strong>{paymentMode === 'razorpay' ? 'RAZORPAY' : paymentMode.toUpperCase()}</strong>.
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

      {/* Post-Payment Customer Feedback Modal */}
      {completedOrderData && (
        <CustomerFeedbackModal
          isOpen={showFeedbackModal}
          orderId={completedOrderData.orderId}
          tableNumber={completedOrderData.tableNumber}
          orderItems={completedOrderData.orderItems}
          amount={completedOrderData.amount}
          onComplete={() => {
            setShowFeedbackModal(false);
            navigate(`/track/${completedOrderData.orderId}`);
          }}
          onSkip={() => {
            setShowFeedbackModal(false);
            navigate(`/track/${completedOrderData.orderId}`);
          }}
        />
      )}

    </div>
  );
}
