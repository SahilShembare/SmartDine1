import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  ArrowRight,
  Banknote,
  RefreshCw,
  XCircle,
  Wallet,
  Info,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

const PAYMENT_DASHBOARD_METHODS = [
  {
    id: 'upi',
    name: 'UPI & QR Code',
    shortName: 'UPI / QR',
    subtitle: 'Scan & Pay (GPay, PhonePe, Paytm)',
    icon: QrCode,
    badge: 'SCAN & PAY',
    isOnline: true
  },
  {
    id: 'cards',
    name: 'Debit / Credit Cards',
    shortName: 'Cards',
    subtitle: 'Visa, Master, RuPay',
    icon: CreditCard,
    badge: 'CARDS',
    isOnline: true
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    shortName: 'NetBanking',
    subtitle: 'HDFC, SBI, ICICI, 50+ Banks',
    icon: Building2,
    badge: '50+ BANKS',
    isOnline: true
  },
  {
    id: 'wallet',
    name: 'Wallets',
    shortName: 'Wallets',
    subtitle: 'Paytm, PhonePe, Mobikwik',
    icon: Wallet,
    badge: 'WALLETS',
    isOnline: true
  },
  {
    id: 'counter',
    name: 'Pay at Counter',
    shortName: 'Counter',
    subtitle: 'Cash / Card after meal',
    icon: Banknote,
    badge: 'DINE-IN',
    isOnline: false
  }
];

const STANDARD_PAYMENT_METHODS = PAYMENT_DASHBOARD_METHODS;

export default function CustomerWebCart() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    currentTable, 
    setTableSession,
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

  // Customer Contact Info - Auto-fetched from Profile
  const [customerName, setCustomerName] = useState(() => {
    return currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    return currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '';
  });
  // Kitchen instructions / special notes strictly kept blank
  const [orderNotes, setOrderNotes] = useState('');

  // Automatically fetch & sync customer details from Profile whenever user or localStorage updates
  useEffect(() => {
    const profileName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || '';
    const profilePhone = currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '';
    if (profileName) {
      setCustomerName(profileName);
    }
    if (profilePhone) {
      setCustomerPhone(profilePhone);
    }
  }, [currentUser]);

  // Payment Mode: 'upi' | 'cards' | 'netbanking' | 'wallet' | 'counter'
  const [paymentMode, setPaymentMode] = useState('upi');
  const [showMissingKeysModal, setShowMissingKeysModal] = useState(false);
  const [paymentFailedData, setPaymentFailedData] = useState(null);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState(null);

  // Card Payment Details
  const [cardType, setCardType] = useState('debit'); // 'debit' | 'credit'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(() => currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || '');
  const [saveCard, setSaveCard] = useState(false);

  // Net Banking Details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [otherBank, setOtherBank] = useState('');

  // Wallet Details
  const [selectedWallet, setSelectedWallet] = useState('Paytm Wallet');
  const [walletPhone, setWalletPhone] = useState(() => currentUser?.phoneNumber || localStorage.getItem('smartdine_guest_phone') || '');

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(val);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  const handleAutofillDemoCard = (type = cardType) => {
    setCardType(type);
    setCardNumber('4532 8912 3456 7890');
    setCardExpiry('12/28');
    setCardCvv('888');
    setCardHolder(customerName?.trim() || 'Sahil Shembare');
    toast.success(`Demo ${type === 'credit' ? 'Credit' : 'Debit'} Card details loaded!`);
  };

  const getSelectedPaymentMethodName = (mode = paymentMode) => {
    if (mode === 'upi') return 'UPI Dynamic QR (Verified)';
    if (mode === 'cards') {
      const typeLabel = cardType === 'credit' ? 'Credit Card' : 'Debit Card';
      const lastDigits = cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : '';
      return `${typeLabel}${lastDigits ? ` (•••• ${lastDigits})` : ''}`;
    }
    if (mode === 'netbanking') {
      return `Net Banking (${otherBank || selectedBank})`;
    }
    if (mode === 'wallet') {
      return `${selectedWallet}${walletPhone ? ` (${walletPhone})` : ''}`;
    }
    if (mode === 'counter') {
      return 'Pay at Counter (Cash / Card)';
    }
    return 'Razorpay Online';
  };

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

  // UPI Merchant Settings & Dynamic QR Payload (with exact bill amount)
  const upiMerchantId = useMemo(() => {
    try {
      const saved = localStorage.getItem('smartdine_admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.upiMerchantId) return parsed.upiMerchantId;
      }
    } catch {}
    return 'smartdine@icici';
  }, []);

  const restaurantName = useMemo(() => {
    try {
      const saved = localStorage.getItem('smartdine_admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.restaurantName) return parsed.restaurantName;
      }
    } catch {}
    return 'SmartDine Restaurant';
  }, []);

  // Live Dynamic Bill QR Payload (with customer's EXACT bill amount pre-filled)
  const upiQrUri = useMemo(() => {
    const effectiveTable = currentTable || localStorage.getItem('smartdine_active_table') || '01';
    const amountStr = finalPayable.toFixed(2);
    const payeeName = restaurantName.replace(/[^a-zA-Z0-9 ]/g, '');
    const note = `Table ${effectiveTable} Food Bill`;
    return `upi://pay?pa=${encodeURIComponent(upiMerchantId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [upiMerchantId, restaurantName, finalPayable, currentTable]);

  // Selected Standard Payment Method Configuration
  const activeMethodConfig = useMemo(() => {
    return STANDARD_PAYMENT_METHODS.find(m => m.id === paymentMode) || STANDARD_PAYMENT_METHODS[0];
  }, [paymentMode]);

  // Place order & process payment
  const handlePlaceOrder = async (e, overrideMode) => {
    e?.preventDefault?.();
    const mode = overrideMode || paymentMode;
    const selectedMethod = STANDARD_PAYMENT_METHODS.find(m => m.id === mode) || STANDARD_PAYMENT_METHODS[0];
    const effectiveTable = currentTable || localStorage.getItem('smartdine_active_table') || '1';
    if (!currentTable) {
      setTableSession(effectiveTable);
      try { localStorage.setItem('smartdine_active_table', effectiveTable); } catch {}
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    if (loading) return; // double-click protection

    // 1. PAY AT COUNTER (CASH / CARD AT DESK)
    if (mode === 'counter' || mode === 'cash') {
      setShowConfirmModal(false);
      setLoading(true);
      setPaymentFailedData(null);

      await submitOrderPlacement({
        mode: 'counter',
        paymentMethodName: 'Pay at Counter (Cash / Card)',
        paymentLabel: 'CASH / COUNTER',
        paymentStatus: 'PENDING',
        transactionId: `COUNTER-${Date.now()}`
      });
      return;
    }

    // 2. ONLINE PAYMENT VIA OFFICIAL RAZORPAY GATEWAY (UPI, Cards, NetBanking, Wallets)
    setShowConfirmModal(false);
    setLoading(true);
    setPaymentFailedData(null);

    const specificMethodName = getSelectedPaymentMethodName(mode);

    try {
      await openRazorpayPayment({
        amount: finalPayable,
        name: 'SmartDine Restaurant',
        description: `Table ${effectiveTable} - ${specificMethodName}`,
        orderRef: `SD-CART-${Date.now()}`,
        existingOrderId: activeRazorpayOrderId,
        onOrderCreated: (orderId) => {
          setActiveRazorpayOrderId(orderId);
        },
        customer: {
          name: customerName.trim() || `Table ${effectiveTable} Guest`,
          contact: customerPhone.trim() || '',
          email: currentUser?.email || 'guest@smartdine.com',
          tableNumber: effectiveTable
        },
        onSuccess: async (rzpResponse) => {
          await submitOrderPlacement({
            mode: selectedMethod.id,
            paymentMethodName: `${specificMethodName} (Razorpay)`,
            paymentLabel: `${specificMethodName} (${rzpResponse.razorpay_payment_id})`,
            paymentStatus: 'PAID',
            transactionId: rzpResponse.razorpay_payment_id,
            rzpResponse
          });
        },
        onFailure: (errMsg) => {
          setLoading(false);
          const reason = typeof errMsg === 'string' ? errMsg : errMsg?.message || 'Payment was cancelled or declined by bank / UPI.';
          
          // If keys are not configured in .env, seamlessly show setup fallback modal
          if (reason.toLowerCase().includes('not configured') || reason.toLowerCase().includes('key')) {
            setShowMissingKeysModal(true);
            return;
          }

          setPaymentFailedData({
            reason,
            amount: finalPayable,
            tableNumber: effectiveTable,
            methodName: specificMethodName
          });
          toast.error(reason, { duration: 4000 });
        }
      });
    } catch (err) {
      setLoading(false);
      const reason = err?.message || 'Failed to open payment gateway.';
      if (reason.toLowerCase().includes('not configured') || reason.toLowerCase().includes('key')) {
        setShowMissingKeysModal(true);
        return;
      }
      setPaymentFailedData({
        reason,
        amount: finalPayable,
        tableNumber: effectiveTable,
        methodName: specificMethodName
      });
      toast.error(reason);
    }
  };

  const submitOrderPlacement = async ({ mode, paymentMethodName, paymentLabel, paymentStatus, transactionId, rzpResponse }) => {
    try {
      if (customerName) localStorage.setItem('smartdine_guest_name', customerName.trim());
      if (customerPhone) localStorage.setItem('smartdine_guest_phone', customerPhone.trim());

      const orderItemsSnapshot = [...cart];
      const effectiveTable = currentTable || localStorage.getItem('smartdine_active_table') || '01';
      const isPaid = paymentStatus === 'PAID';
      const selectedMethod = STANDARD_PAYMENT_METHODS.find(m => m.id === mode);
      const methodLabel = paymentMethodName || (selectedMethod ? selectedMethod.name : isPaid ? 'Razorpay Online' : 'Pay at Counter');

      const orderId = await placeOrder({
        customerName: customerName.trim() || `Table ${effectiveTable} Guest`,
        customerPhone: customerPhone.trim(),
        customerId: currentUser?.uid || null,
        notes: orderNotes.trim(),
        paymentMethod: methodLabel,
        payment_method: methodLabel,
        payment_gateway: isPaid ? 'Razorpay' : 'None',
        paymentStatus: paymentStatus, // 'PAID' or 'PENDING'
        payment_status: paymentStatus,
        transactionId: rzpResponse?.razorpay_payment_id || transactionId,
        razorpay_order_id: rzpResponse?.razorpay_order_id || null,
        razorpay_payment_id: rzpResponse?.razorpay_payment_id || null,
        razorpay_signature: rzpResponse?.razorpay_signature || null,
        paid_at: isPaid ? new Date().toISOString() : null,
        refund_status: null,
        currency: 'INR',
        discountAmount: appliedDiscount,
        couponCode: appliedCoupon?.code || null,
        total: finalPayable
      });

      // Keep kitchen instructions / special notes blank after order placement
      setOrderNotes('');
      setActiveRazorpayOrderId(null);

      // Confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      toast.success(
        isPaid
          ? '🎉 Payment Verified! Order sent to kitchen.'
          : '👨‍🍳 Order sent to kitchen! Please pay at counter after dining.',
        { duration: 4000 }
      );

      // Set completed order data for receipt & tracking screen
      setCompletedOrderData({
        orderId,
        orderItems: orderItemsSnapshot,
        amount: finalPayable,
        tableNumber: effectiveTable,
        mode,
        paymentMethod: methodLabel,
        paymentStatus: paymentStatus,
        paymentId: rzpResponse?.razorpay_payment_id || transactionId || (isPaid ? 'Demo Online Payment' : 'Pay at Counter'),
        razorpayOrderId: rzpResponse?.razorpay_order_id || null,
        paidAt: isPaid ? new Date().toISOString() : null,
        estimatedPrepTime: '~15-20 mins'
      });
      setShowFeedbackModal(false);
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
    applyVoucher(DEFAULT_VOUCHERS[0]);
    toast.success('🎉 Royal Feast added to cart with ROYAL50 (50% OFF) applied!');
  };

  // Render Payment Failed / Cancelled Screen
  if (paymentFailedData && !completedOrderData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
        <div className="bg-slate-950/95 border-b border-red-900/50 p-4 sticky top-16 z-30 backdrop-blur-md shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setPaymentFailedData(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cart</span>
            </button>
            <span className="text-xs font-bold bg-red-950/80 text-red-400 px-2.5 py-1 rounded-full border border-red-500/30 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Payment Unsuccessful</span>
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-red-950/60 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-xl">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-red-950/80 text-red-400 font-mono font-bold text-xs border border-red-500/30">
              Table {paymentFailedData.tableNumber || currentTable || '01'}
            </span>
            <h2 className="text-2xl font-black text-white">Payment Failed or Cancelled</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              We couldn't process your payment of <strong className="text-red-400">₹{paymentFailedData.amount?.toFixed(2)}</strong>.
            </p>
          </div>

          {/* Error Reason Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <Info className="w-4 h-4 text-red-400" />
              <span>Gateway Reason</span>
            </div>
            <p className="text-xs text-slate-300 bg-red-950/40 p-2.5 rounded-xl border border-red-900/40 font-medium">
              {paymentFailedData.reason || 'Transaction was declined by bank or cancelled by user.'}
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              • No money has been deducted from your account.<br />
              • Your cart dishes and applied vouchers are preserved.
            </p>
          </div>

          {/* 3 Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* 1. Retry Payment */}
            <button
              onClick={(e) => handlePlaceOrder(e, 'razorpay')}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Re-opening Razorpay...' : 'Retry Payment with Razorpay'}</span>
            </button>

            {/* 2. Pay at Counter */}
            <button
              onClick={(e) => handlePlaceOrder(e, 'counter')}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>Pay at Counter (Send Order Now)</span>
            </button>

            {/* 3. Back to Order / Cart */}
            <button
              onClick={() => setPaymentFailedData(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Back to Order Cart</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Order Placed Confirmation & Feedback Screen when an order has just been placed
  if (completedOrderData) {
    const isPaid = completedOrderData.paymentStatus === 'PAID';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
        {/* Top Header */}
        <div className="bg-slate-950/95 border-b border-slate-800/80 p-4 sticky top-16 z-30 backdrop-blur-md shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="font-extrabold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isPaid ? 'Payment Successful' : 'Order Placed (Pay at Counter)'}</span>
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              isPaid
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isPaid ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{isPaid ? 'PAID' : 'PENDING'}</span>
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6 animate-in fade-in zoom-in-95">
          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center mx-auto shadow-xl ${
            isPaid
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          }`}>
            {isPaid ? <CheckCircle2 className="w-10 h-10" /> : <UtensilsCrossed className="w-10 h-10" />}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono font-bold text-xs border border-amber-500/20">
                Order #{completedOrderData.orderId}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 font-bold text-xs border border-slate-800">
                Table {completedOrderData.tableNumber}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {isPaid ? 'Payment Successful!' : 'Your Food is in the Kitchen!'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isPaid
                ? `Payment of ₹${completedOrderData.amount.toFixed(2)} verified via Razorpay. Order sent directly to chef queue.`
                : `Order for Table ${completedOrderData.tableNumber} is sent to kitchen. Please settle your bill of ₹${completedOrderData.amount.toFixed(2)} at the counter after dining.`}
            </p>
          </div>

          {/* Transaction & Order Details Grid */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-left space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Payment Details</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                isPaid ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {isPaid ? '🟢 VERIFIED PAID' : '🟠 PAY AT COUNTER'}
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Order ID</span>
                <span className="font-mono font-bold text-white">#SD-{completedOrderData.orderId}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Amount</span>
                <span className="font-black text-amber-400">₹{completedOrderData.amount.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Payment Method</span>
                <span className="font-bold text-white">{completedOrderData.paymentMethod}</span>
              </div>
              {completedOrderData.paymentId && (
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Transaction / Payment ID</span>
                    <span className="font-mono font-bold text-xs text-white">{completedOrderData.paymentId}</span>
                  </div>
                  {isPaid && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(completedOrderData.paymentId);
                        toast.success('Payment ID copied!');
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
                      title="Copy Payment ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">Preparation ETA</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{completedOrderData.estimatedPrepTime || '~15-20 mins'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Dishes List */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
              <span>Dishes Ordered:</span>
              <span className="text-amber-400">{completedOrderData.orderItems?.length || 0} Items</span>
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/80 text-xs text-slate-300">
              {completedOrderData.orderItems?.map((item, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <span className="font-medium text-white">{item.quantity}x {item.name}</span>
                  <span className="font-bold text-amber-400">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate(`/track/${completedOrderData.orderId}`)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Track Live Preparation Status →</span>
            </button>

            <a
              href={`/bill?table=${completedOrderData.tableNumber}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>View & Print Bill Receipt</span>
            </a>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/30 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Share Dining Feedback & Rating</span>
            </button>

            <Link
              to={currentTable ? `/menu?table=${currentTable}` : '/menu'}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Order More Delicacies</span>
            </Link>
          </div>
        </div>

        {/* Post-Payment Customer Feedback Modal */}
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
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
        {/* Top Header */}
        <div className="bg-slate-950/95 border-b border-slate-800/80 p-4 sticky top-16 z-30 backdrop-blur-md shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(currentTable ? `/menu?table=${currentTable}` : '/menu');
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>
            <div className="text-center">
              <h1 className="text-base font-black text-white">Royal Dining Cart</h1>
              <p className="text-[11px] text-slate-400 font-medium">Table {currentTable || '01'} • Dine-in</p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Empty Notification Banner */}
          <div className="bg-slate-900/90 rounded-3xl p-6 text-center border border-slate-800 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-inner">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-white">Your Dining Cart is Currently Empty</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your favorite delicacies to apply exclusive discount vouchers and pay securely via Razorpay UPI / Cards.
            </p>

            {/* Quick Demo Add Button */}
            <button
              onClick={handleAddSampleFeast}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>⚡ Add Sample Royal Feast & Apply 50% OFF (₹645)</span>
            </button>
          </div>

          {/* Available Vouchers Section */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Available Discount Vouchers</h3>
                  <p className="text-[10px] text-slate-400">Discounts will automatically calculate when food is added</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                5 ACTIVE OFFERS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_VOUCHERS.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-slate-950/80 flex flex-col justify-between hover:border-orange-500 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-amber-500/40">
                          {v.code}
                        </span>
                        <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                          {v.badge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1.5">{v.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{v.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Min Order: ₹{v.minOrderValue}</span>
                    <button
                      onClick={() => {
                        handleAddSampleFeast();
                        applyVoucher(v);
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply & Fill Cart →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Bestsellers */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Add Bestsellers</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Paneer Butter Masala', price: 320, image: '/dishes/paneer_butter_masala.jpg', category: 'Main Course' },
                { name: 'Garlic Butter Naan', price: 65, image: '/dishes/garlic_naan.jpg', category: 'Breads' },
                { name: 'Dal Makhani', price: 260, image: '/dishes/dal_makhani.jpg', category: 'Main Course' },
                { name: 'Deluxe Veg Thali', price: 399, image: '/dishes/deluxe_veg_thali.jpg', category: 'Thali' }
              ].map((dish, i) => (
                <div key={i} className="p-2.5 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between text-center">
                  <img src={dish.image} alt={dish.name} className="w-full h-20 object-cover rounded-xl mb-2" />
                  <p className="text-xs font-bold text-white line-clamp-1">{dish.name}</p>
                  <p className="text-xs font-black text-amber-400 mt-0.5">₹{dish.price}</p>
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
                    className="mt-2 w-full py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[11px] font-bold shadow-glow transition cursor-pointer"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Header */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 p-4 sticky top-16 z-30 backdrop-blur-md shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(currentTable ? `/menu?table=${currentTable}` : '/menu');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-amber-400 border border-amber-500/30 font-black text-xs shadow-glow flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>TABLE {currentTable || '01'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        
        {/* Table Warning if not set */}
        {!currentTable && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between shadow-sm">
            <span>No dining table connected. Please scan your table standee QR.</span>
            <Link to="/scan" className="font-bold underline text-amber-400 hover:text-orange-400">Scan Table QR</Link>
          </div>
        )}

        {/* Cart Items List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800/80 shadow-xl backdrop-blur-sm">
          <div className="p-4 bg-slate-950/60 flex items-center justify-between border-b border-slate-800/60">
            <h2 className="font-black text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-500" />
              <span>Order Items ({cart.length})</span>
            </h2>
            <button
              onClick={clearCart}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              Clear Cart
            </button>
          </div>

          {cart.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3 bg-slate-900/50 hover:bg-slate-900/80 transition">
              <div className="flex items-center gap-3">
                {/* Thumb */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                      item.isVeg !== false ? 'border-emerald-500 bg-emerald-950/60' : 'border-rose-500 bg-rose-950/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.isVeg !== false ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                    </span>
                    <h4 className="font-extrabold text-sm text-white">{item.name}</h4>
                  </div>
                  <div className="text-xs font-black text-amber-400 mt-0.5">
                    ₹{item.price} each
                  </div>
                  {item.instructions && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">
                      "{item.instructions}"
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs text-white min-w-[14px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>🧠 Complete Your Meal</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Customers who ordered this also enjoyed:
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                AI Suggested
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {complementaryItems.map(({ dish, reason }) => (
                <div
                  key={dish.id}
                  className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2.5 hover:border-amber-500/50 transition"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200'; }}
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-white truncate">{dish.name}</p>
                      <p className="text-[10px] text-amber-400 font-medium truncate">{reason}</p>
                      <span className="text-xs font-black text-amber-400">₹{dish.price}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(dish, 1, 'Complementary Add-on');
                      toast.success(`Added ${dish.name} to cart!`, { icon: '🍽️' });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
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
          <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/40 shadow-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">🍽️</span>
                <h4 className="font-black text-xs sm:text-sm text-white">AI Suggested Combo</h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  Save ₹{aiCombo.savings}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-400">{aiCombo.title}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 line-through">₹{aiCombo.individualPrice}</span>
                <span className="font-black text-emerald-400 text-sm">₹{aiCombo.comboPrice}</span>
                <span className="text-[10px] text-slate-400 font-medium">• {aiCombo.why}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAiCombo}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-glow transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Add Combo (Save ₹{aiCombo.savings})</span>
            </button>
          </div>
        )}

        {/* Apply Coupon Box & Available Vouchers Showcase */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs sm:text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4 text-orange-500" />
              <span>Discount Vouchers & Offers</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowVoucherModal(true)}
              className="text-xs font-bold text-amber-400 hover:text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All ({availableVouchers.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Applied Voucher Card */}
          {appliedCoupon ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/60 flex items-center justify-between text-xs text-emerald-400 font-bold shadow-glow animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                      APPLIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{appliedCoupon.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm text-emerald-400">-₹{appliedCoupon.discount.toFixed(0)}</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter promo code (e.g. ROYAL50, FEAST100)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition active:scale-95 cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}

          {/* Available Vouchers Showcase Grid */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TicketPercent className="w-3.5 h-3.5 text-orange-500" />
                <span>Available Discount Vouchers for You</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableVouchers.slice(0, 4).map(v => {
                const isEligible = cartSubtotal >= (v.minOrderValue || 0);
                const savings = isEligible ? calculateVoucherSavings(v) : 0;
                const isApplied = appliedCoupon?.code === v.code;

                return (
                  <div
                    key={v.code}
                    className={`p-3.5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isApplied
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-glow ring-1 ring-emerald-500'
                        : isEligible
                        ? 'bg-slate-950/90 border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 border border-amber-500/30 tracking-wider">
                            {v.code}
                          </span>
                          {v.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-white line-clamp-1">{v.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{v.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {isEligible ? (
                          <span className="text-[11px] font-black text-emerald-400 block bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            Save ₹{savings.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded-md block border border-amber-500/30">
                            Add ₹{((v.minOrderValue || 0) - cartSubtotal).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                      <span>Min Order: <strong className="text-slate-200">₹{v.minOrderValue}</strong></span>
                      
                      {isApplied ? (
                        <span className="font-black text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyVoucher(v)}
                          disabled={!isEligible}
                          className={`px-3 py-1 rounded-xl font-black text-[11px] transition cursor-pointer ${
                            isEligible
                              ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-glow active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Dine-In Customer Details</span>
            </h3>
            {(customerName || customerPhone) && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Auto-fetched from Profile</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh / Priya"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  try { localStorage.setItem('smartdine_guest_name', e.target.value); } catch {}
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  try { localStorage.setItem('smartdine_guest_phone', e.target.value); } catch {}
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kitchen Instructions / Special Notes</label>
            <input
              type="text"
              placeholder="e.g. Medium spicy, extra papad, serve mocktail first..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* COMPACT PAYMENT DASHBOARD WITH DYNAMIC BILL QR CODE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Payment Dashboard</h3>
                <p className="text-[10px] text-slate-400">Select payment mode or scan dynamic bill QR</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% RBI Authorized</span>
            </span>
          </div>

          {/* 1. CHOTA DASHBOARD (5 COMPACT TILES GRID) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PAYMENT_DASHBOARD_METHODS.map((method) => {
              const isSelected = paymentMode === method.id;
              const IconComp = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMode(method.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-br from-orange-600/20 via-amber-600/10 to-slate-900 border-amber-500 shadow-glow ring-1 ring-amber-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <span className={`font-black text-xs block leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {method.shortName}
                    </span>
                    <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                      {method.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. ACTIVE PAYMENT CONTENT BOX */}
          {paymentMode === 'upi' && (
            /* ============================================================ */
            /* DYNAMIC BILL QR CODE FOR CUSTOMER'S EXACT BILL AMOUNT        */
            /* ============================================================ */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border-2 border-dashed border-amber-500/40 text-center space-y-3.5 shadow-inner animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
                <div className="text-left">
                  <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    ⚡ Live Bill QR Code
                  </span>
                  <h4 className="text-sm font-black text-white">Scan & Pay Exact Bill</h4>
                  <p className="text-[10px] text-slate-400">Amount is pre-filled automatically on scan</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Payable Total</span>
                  <span className="text-xl font-black text-amber-400 font-mono">₹{finalPayable.toFixed(2)}</span>
                </div>
              </div>

              {/* High-Resolution SVG QR Code with exact bill amount embedded */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-300 inline-block shadow-lg mx-auto">
                <QRCodeSVG
                  value={upiQrUri}
                  size={190}
                  level="H"
                  includeMargin={false}
                  className="mx-auto rounded-lg"
                />
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    UPI ID: {upiMerchantId}
                  </span>
                </div>
              </div>

              {/* Supported Apps Chips */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-300">
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">Google Pay</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">PhonePe</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">Paytm</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">BHIM UPI</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">Cred</span>
              </div>

              {/* Mobile Direct UPI Intent & Copy UPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={upiQrUri}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open in UPI App (Pay ₹{finalPayable.toFixed(0)})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(upiMerchantId);
                    toast.success(`UPI ID copied: ${upiMerchantId}`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy UPI ID</span>
                </button>
              </div>

              {/* Real-time Payment Auto-Detection Notice */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center justify-center gap-2.5 text-xs shadow-2xs">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-[11px] sm:text-xs">
                  ⚡ Auto-Detect Active: Scan with any UPI app. Payment verifies automatically on receipt!
                </span>
              </div>
            </div>
          )}

          {paymentMode === 'cards' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-4 shadow-inner animate-in fade-in duration-200">
              {/* Header & Quick Action */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-orange-400" />
                    <span>Card Payment Options:</span>
                  </span>
                  <p className="text-[10px] text-slate-400">Select debit or credit card & enter details</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutofillDemoCard(cardType)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1 transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>⚡ Auto-fill Test Card</span>
                </button>
              </div>

              {/* 1. Clear Card Type Options Selection (Debit vs Credit) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCardType('debit')}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    cardType === 'debit'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-glow ring-1 ring-amber-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-white">💳 Debit Card</span>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                        ATM / RuPay
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">SBI, HDFC, ICICI, RuPay, Visa, Master</p>
                  </div>
                  {cardType === 'debit' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('credit')}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    cardType === 'credit'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-glow ring-1 ring-amber-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-white">💳 Credit Card</span>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                        REWARDS / EMI
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visa, MasterCard, Amex, RuPay Credit</p>
                  </div>
                  {cardType === 'credit' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              </div>

              {/* 2. Virtual Interactive Card Preview */}
              <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Chip */}
                    <div className="w-7 h-5 rounded bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-500/80 shadow-inner flex items-center justify-center">
                      <div className="w-3.5 h-2.5 border-y border-amber-600/50"></div>
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                      {cardType === 'credit' ? 'CREDIT CARD' : 'DEBIT CARD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black italic tracking-wider text-amber-300">
                      {cardNumber.startsWith('4') ? 'VISA' : cardNumber.startsWith('5') ? 'Mastercard' : cardNumber.startsWith('6') ? 'RuPay' : 'CARD'}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-slate-100 my-2">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-300 pt-1">
                  <div>
                    <span className="block text-[7px] text-slate-400">CARD HOLDER</span>
                    <span className="font-bold tracking-wider text-white">
                      {cardHolder?.trim() || 'VALUED GUEST'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[7px] text-slate-400">EXPIRES</span>
                    <span className="font-bold tracking-wider text-white">
                      {cardExpiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Card Input Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-300">Card Number</label>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <span className="px-1.5 py-0.2 bg-slate-900 rounded border border-slate-800">Visa</span>
                      <span className="px-1.5 py-0.2 bg-slate-900 rounded border border-slate-800">MasterCard</span>
                      <span className="px-1.5 py-0.2 bg-slate-900 rounded border border-slate-800">RuPay</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8910"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400 shadow-xs"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-xs text-center focus:outline-none focus:border-amber-400 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">CVV / CVC</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-xs text-center focus:outline-none focus:border-amber-400 shadow-xs"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Name on Card</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-white text-xs focus:outline-none focus:border-amber-400 shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    id="save-card-check"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="w-3.5 h-3.5 text-orange-500 accent-orange-500 rounded cursor-pointer"
                  />
                  <label htmlFor="save-card-check" className="cursor-pointer font-medium">
                    Save card securely for future restaurant dining (RBI tokenized)
                  </label>
                </div>
              </div>
            </div>
          )}

          {paymentMode === 'netbanking' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-4 shadow-inner animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-orange-400" />
                    <span>Select Bank for Net Banking:</span>
                  </span>
                  <p className="text-[10px] text-slate-400">50+ Indian banks supported with direct internet banking</p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Active: {otherBank || selectedBank}
                </span>
              </div>

              {/* 8 Popular Indian Banks Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'HDFC Bank', code: 'HDFC', badgeColor: 'bg-blue-700' },
                  { name: 'State Bank of India', code: 'SBI', badgeColor: 'bg-cyan-700' },
                  { name: 'ICICI Bank', code: 'ICICI', badgeColor: 'bg-amber-600' },
                  { name: 'Axis Bank', code: 'AXIS', badgeColor: 'bg-rose-700' },
                  { name: 'Kotak Mahindra', code: 'KOTAK', badgeColor: 'bg-red-600' },
                  { name: 'Punjab National Bank', code: 'PNB', badgeColor: 'bg-yellow-700' },
                  { name: 'Bank of Baroda', code: 'BOB', badgeColor: 'bg-orange-600' },
                  { name: 'Canara Bank', code: 'CANARA', badgeColor: 'bg-blue-600' }
                ].map(b => {
                  const isBankSelected = selectedBank === b.name && !otherBank;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setSelectedBank(b.name);
                        setOtherBank('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isBankSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-glow ring-1 ring-amber-500'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] text-white shrink-0 ${b.badgeColor}`}>
                          {b.code.slice(0, 3)}
                        </div>
                        <span className="font-bold text-[11px] truncate">{b.name}</span>
                      </div>
                      {isBankSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Other Banks Dropdown */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Or Select from 50+ Other Indian Banks:
                </label>
                <select
                  value={otherBank}
                  onChange={(e) => {
                    setOtherBank(e.target.value);
                    if (e.target.value) setSelectedBank(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-white text-xs focus:outline-none focus:border-amber-400 shadow-xs cursor-pointer"
                >
                  <option value="">-- Click to choose another Indian bank --</option>
                  {[
                    'Bank of Baroda',
                    'Canara Bank',
                    'Union Bank of India',
                    'IndusInd Bank',
                    'IDFC First Bank',
                    'Yes Bank',
                    'Federal Bank',
                    'Central Bank of India',
                    'Indian Bank',
                    'Bank of India',
                    'RBL Bank',
                    'AU Small Finance Bank',
                    'South Indian Bank',
                    'Jammu & Kashmir Bank',
                    'Karur Vysya Bank',
                    'Karnataka Bank',
                    'UCO Bank',
                    'Indian Overseas Bank',
                    'Saraswat Bank',
                    'Standard Chartered Bank'
                  ].map(ob => (
                    <option key={ob} value={ob} className="bg-slate-900 text-white">{ob}</option>
                  ))}
                </select>
              </div>

              {/* Confirmation Note */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  You will be securely redirected to <strong className="text-white">{otherBank || selectedBank}</strong> Net Banking to authorize ₹{finalPayable.toFixed(2)}.
                </span>
              </div>
            </div>
          )}

          {paymentMode === 'wallet' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-4 shadow-inner animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-orange-400" />
                    <span>Select Digital Wallet Option:</span>
                  </span>
                  <p className="text-[10px] text-slate-400">Pay instantly using your digital wallet balance</p>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Selected: {selectedWallet}
                </span>
              </div>

              {/* 6 Top Wallets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Paytm Wallet', desc: 'Instant OTP payment', tag: 'POPULAR', icon: '🟠' },
                  { name: 'PhonePe Wallet', desc: 'Direct wallet balance', tag: 'FAST', icon: '🟣' },
                  { name: 'Amazon Pay Balance', desc: '1-Click checkout', tag: 'OFFERS', icon: '🟡' },
                  { name: 'Mobikwik Wallet', desc: 'SuperCash & balance', tag: null, icon: '🔵' },
                  { name: 'Airtel Money', desc: 'Airtel Payments Bank', tag: null, icon: '🔴' },
                  { name: 'JioMoney', desc: 'Reliance Jio wallet', tag: null, icon: '🟢' }
                ].map(w => {
                  const isWSelected = selectedWallet === w.name;
                  return (
                    <button
                      key={w.name}
                      type="button"
                      onClick={() => setSelectedWallet(w.name)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isWSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-glow ring-1 ring-amber-500'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{w.icon}</span>
                          <span className="font-black text-xs text-white">{w.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{w.desc}</p>
                        {w.tag && (
                          <span className="inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-1">
                            {w.tag}
                          </span>
                        )}
                      </div>
                      {isWSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Linked Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Mobile Number Registered with {selectedWallet}
                  </label>
                  {customerPhone && walletPhone !== customerPhone && (
                    <button
                      type="button"
                      onClick={() => setWalletPhone(customerPhone)}
                      className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      Use {customerPhone}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white text-xs focus:outline-none focus:border-amber-400 shadow-xs"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  • An instant verification OTP will be sent to this number to authorize ₹{finalPayable.toFixed(2)}.
                </p>
              </div>
            </div>
          )}

          {paymentMode === 'counter' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-left space-y-1.5 animate-in fade-in duration-200">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-orange-400" />
                <span>Pay After Dining at Reception Counter</span>
              </span>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Order goes straight to the chef's queue now. Settle your bill of <strong className="text-white">₹{finalPayable.toFixed(2)}</strong> via cash or card after enjoying your meal.
              </p>
            </div>
          )}

        </div>

        {/* Bill Breakdown Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            <span>Bill Summary</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Item Subtotal ({cart.length} items)</span>
              <span className="text-white font-bold">₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{appliedDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Restaurant GST (5%)</span>
              <span className="text-white font-bold">₹{calculatedTax.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black text-white">
              <span>Grand Total</span>
              <span className="text-amber-400 font-black text-xl font-mono">₹{finalPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Place Order CTA Button */}
        <button
          id="checkout-order-btn"
          onClick={(e) => handlePlaceOrder(e)}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black text-base shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : activeMethodConfig.isOnline ? (
            <>
              <Lock className="w-5 h-5 text-amber-200" />
              <span>
                {paymentMode === 'upi'
                  ? `Pay ₹${finalPayable.toFixed(0)} via UPI & QR`
                  : paymentMode === 'cards'
                  ? `Pay ₹${finalPayable.toFixed(0)} via ${cardType === 'credit' ? 'Credit Card' : 'Debit Card'}`
                  : paymentMode === 'netbanking'
                  ? `Pay ₹${finalPayable.toFixed(0)} via ${otherBank || selectedBank}`
                  : paymentMode === 'wallet'
                  ? `Pay ₹${finalPayable.toFixed(0)} via ${selectedWallet}`
                  : `Pay ₹${finalPayable.toFixed(0)} via ${activeMethodConfig.name}`}
              </span>
            </>
          ) : (
            <>
              <UtensilsCrossed className="w-5 h-5" />
              <span>Place Order (Pay at Counter • ₹{finalPayable.toFixed(0)})</span>
            </>
          )}
        </button>

      </div>

      {/* ============================================================ */}
      {/* ALL DISCOUNT VOUCHERS MODAL                                 */}
      {/* ============================================================ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-glow">
                  🎟️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Available Discount Vouchers</h3>
                  <p className="text-[11px] text-slate-400">Select any voucher to apply instant bill discount</p>
                </div>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Cart Value Indicator */}
            <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Your Cart Subtotal:</span>
              <span className="font-black text-amber-400 text-sm font-mono">₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                        isApplied
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-glow ring-1 ring-emerald-500'
                          : isEligible
                          ? 'bg-slate-950 border border-slate-800 hover:border-amber-500/50 shadow-md'
                          : 'bg-slate-950/50 border border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 border border-amber-500/30 tracking-wider">
                              {v.code}
                            </span>
                            {v.badge && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                {v.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-white mt-1">{v.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{v.description}</p>
                          {v.terms && (
                            <p className="text-[10px] text-slate-500 italic">• {v.terms}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {isEligible ? (
                            <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg font-black text-xs">
                              Save ₹{savings.toFixed(0)}
                            </div>
                          ) : (
                            <div className="bg-amber-950/40 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg font-bold text-[10px]">
                              Add ₹{((v.minOrderValue || 0) - cartSubtotal).toFixed(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">Min Order: <strong className="text-slate-200">₹{v.minOrderValue}</strong></span>
                        
                        {isApplied ? (
                          <span className="font-black text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Active in Cart</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => applyVoucher(v)}
                            disabled={!isEligible}
                            className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                              isEligible
                                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-glow active:scale-95'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal (for Cash / Direct offline) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-white">Send Order to Kitchen?</h3>
              <p className="text-xs text-slate-400">
                You are placing an order for <strong className="text-white">Table {currentTable || '01'}</strong> totaling <strong className="text-amber-400">₹{finalPayable.toFixed(0)}</strong> via <strong className="text-slate-200">{activeMethodConfig.name}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePlaceOrder}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-black text-white shadow-glow transition cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Gateway Notice Modal (when live keys are not yet entered in .env) */}
      {showMissingKeysModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-black text-lg text-white">Razorpay Payment Gateway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selected method: <strong className="text-amber-400">{getSelectedPaymentMethodName()}</strong> for <strong className="text-amber-400">₹{finalPayable.toFixed(2)}</strong>.
              </p>
              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/40 text-[11px] text-amber-300 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Razorpay API Keys Setup Notice</span>
                </p>
                <p className="text-amber-200/80">
                  Live API keys are not yet set in <code className="bg-slate-950 px-1 rounded font-mono text-amber-400">.env</code>. You can simulate an instant verified payment to test order flow, or switch to Pay at Counter.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Complete Demo Payment */}
              <button
                type="button"
                onClick={async () => {
                  setShowMissingKeysModal(false);
                  const specificLabel = getSelectedPaymentMethodName();
                  await submitOrderPlacement({
                    mode: paymentMode,
                    paymentMethodName: `${specificLabel} (Simulated Online)`,
                    paymentLabel: `${specificLabel} (Verified)`,
                    paymentStatus: 'PAID',
                    transactionId: `DEMO_RZP_${Date.now()}`,
                    rzpResponse: {
                      razorpay_payment_id: `pay_demo_${Date.now()}`,
                      razorpay_order_id: `order_demo_${Date.now()}`,
                      razorpay_signature: 'demo_verified_signature'
                    }
                  });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-black text-white shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Payment (Send to Kitchen)</span>
              </button>

              {/* Option 2: Pay at Counter */}
              <button
                type="button"
                onClick={async () => {
                  setShowMissingKeysModal(false);
                  await handlePlaceOrder(null, 'counter');
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-amber-400 border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Switch to Pay at Counter (Cash / Card)</span>
              </button>

              {/* Option 3: Cancel / Back */}
              <button
                type="button"
                onClick={() => setShowMissingKeysModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
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
