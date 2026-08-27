import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
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
  CreditCard
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

  const [customerName, setCustomerName] = useState(currentUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pay after Dining');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!currentTable) {
      alert('Please connect to a restaurant table first.');
      navigate('/menu');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      const orderId = await placeOrder({
        customerName: customerName.trim() || `Table ${currentTable} Guest`,
        customerPhone: customerPhone.trim(),
        customerId: currentUser?.uid || null,
        notes: orderNotes.trim(),
        paymentMethod: paymentMethod
      });

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Navigate to live tracking
      navigate(`/track/${orderId}`);
    } catch (err) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
          Looks like you haven't added any dishes yet. Check out our delicious menu!
        </p>
        <Link
          to="/menu"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-sm shadow-glow transition active:scale-95 flex items-center gap-2"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Browse Menu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Top Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/menu"
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>

          <div className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-xs">
            TABLE {currentTable || '01'}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Table Warning if not set */}
        {!currentTable && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span>No table attached. Please set your table before placing order.</span>
            <Link to="/menu" className="font-bold underline text-amber-400">Set Table</Link>
          </div>
        )}

        {/* Cart Items List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60 shadow-lg">
          <div className="p-4 bg-slate-800/30 flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              Order Items ({cart.length})
            </h2>
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:underline"
            >
              Clear Cart
            </button>
          </div>

          {cart.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Thumb */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                      item.isVeg !== false ? 'border-emerald-500' : 'border-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    </span>
                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  </div>
                  <div className="text-xs font-semibold text-orange-400 mt-0.5">
                    ₹{item.price} each
                  </div>
                  {item.instructions && (
                    <p className="text-[11px] text-amber-300/80 italic mt-0.5">
                      "{item.instructions}"
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs text-white min-w-[14px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Details Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            Dine-In Customer Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul / Priya"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Order Notes / Allergies</label>
            <input
              type="text"
              placeholder="e.g. Please bring water, less chili in curry"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {['Pay after Dining', 'Pay at Counter / UPI'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    paymentMethod === m 
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-400" />
            Bill Details
          </h3>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="text-slate-200 font-semibold">₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Restaurant GST (5%)</span>
              <span className="text-slate-200 font-semibold">₹{cartTax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-extrabold text-white">
              <span>Grand Total</span>
              <span className="text-orange-400">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Place Order CTA */}
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-base shadow-glow transition active:scale-95 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Confirm & Place Order (₹{cartTotal.toFixed(0)})</span>
        </button>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Send Order to Kitchen?</h3>
              <p className="text-xs text-slate-400">
                You are placing an order for <strong>Table {currentTable}</strong> totaling <strong>₹{cartTotal.toFixed(0)}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePlaceOrder}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-xs font-extrabold text-white shadow-glow"
              >
                {loading ? 'Sending...' : 'Yes, Order Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
