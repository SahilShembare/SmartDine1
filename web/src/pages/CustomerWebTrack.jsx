import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  CheckCircle2, 
  ChefHat, 
  Clock, 
  Sparkles, 
  UtensilsCrossed, 
  BellRing, 
  CheckCheck, 
  ArrowLeft,
  Receipt,
  PhoneCall
} from 'lucide-react';

export default function CustomerWebTrack() {
  const { orderId } = useParams();
  const { orders } = useTableOrder();
  const [order, setOrder] = useState(() => {
    return orders.find(o => o.id === orderId) || null;
  });

  useEffect(() => {
    if (isFirebaseConfigured && orderId) {
      const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      });
      return () => unsub();
    } else {
      const found = orders.find(o => o.id === orderId);
      if (found) setOrder(found);
    }
  }, [orderId, orders]);

  // Guaranteed 3-Second Active Sync
  useEffect(() => {
    const timer = setInterval(() => {
      const found = orders.find(o => o.id === orderId);
      if (found) {
        setOrder({ ...found });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId, orders]);

  const steps = [
    { key: 'placed', label: 'Order Received', desc: 'Sent to restaurant kitchen', icon: CheckCircle2 },
    { key: 'accepted', label: 'Order Accepted', desc: 'Chef acknowledged order', icon: Clock },
    { key: 'preparing', label: 'Cooking & Preparation', desc: 'Freshly making your dishes', icon: ChefHat },
    { key: 'ready', label: 'Ready to Serve', desc: 'On its way to your dining table', icon: BellRing },
    { key: 'completed', label: 'Served & Enjoyed', desc: 'Thank you for dining with us!', icon: CheckCheck }
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const orderIndexMap = {
      'pending': 0,
      'placed': 0,
      'accepted': 1,
      'preparing': 2,
      'ready': 3,
      'completed': 4,
      'cancelled': -1
    };

    const targetIdx = steps.findIndex(s => s.key === stepKey);
    const currentIdx = orderIndexMap[currentStatus] !== undefined ? orderIndexMap[currentStatus] : 0;

    if (currentStatus === 'cancelled') return 'cancelled';
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] flex flex-col items-center justify-center p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E8752A] mb-4"></div>
        <h3 className="text-lg font-bold text-[#24140D]">Loading Order #{orderId}...</h3>
        <p className="text-xs text-[#6B5B50] mt-1">Connecting to kitchen live updates</p>
        <Link to="/menu" className="mt-6 text-xs text-[#E8752A] font-semibold underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-[#24140D] pb-20 font-sans">
      
      {/* Top Bar */}
      <div className="bg-white/95 border-b border-[#F4B942]/30 p-4 sticky top-16 z-30 backdrop-blur-md shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/menu"
            className="flex items-center gap-1 text-xs font-bold text-[#6B5B50] hover:text-[#E8752A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Digital Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#3B2115] text-[#FFF8ED] border border-[#F4B942]/60 font-black text-xs">
              TABLE {order.tableNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Status Card Hero */}
        <div className="rounded-3xl bg-white border-2 border-[#F4B942] p-6 text-center space-y-3 relative overflow-hidden shadow-[0_4px_20px_rgba(59,33,21,0.08)]">
          <div className="inline-flex p-3 rounded-2xl bg-[#FFF8ED] text-[#E8752A] border border-[#F4B942] shadow-sm">
            <ChefHat className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-[#6B5B50]">ORDER #{order.id}</span>
            <h1 className="text-2xl font-black text-[#24140D] mt-0.5">
              {order.status === 'pending' ? 'Order Sent to Kitchen 🎉' :
               order.status === 'accepted' ? 'Order Accepted by Chef 👨‍🍳' :
               order.status === 'preparing' ? 'Food is Being Prepared! 🔥' :
               order.status === 'ready' ? 'Ready to Serve to Table! 🛎️' :
               order.status === 'completed' ? 'Order Completed! Enjoy Your Meal 🍽️' :
               'Order Cancelled'}
            </h1>
            <p className="text-xs text-[#6B5B50] mt-1">
              Table {order.tableNumber} • Authentic preparation in progress
            </p>
          </div>
        </div>

        {/* Live Stepper Tracker */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl p-6 space-y-6 shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
          <h3 className="font-black text-sm text-[#24140D] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E8752A]" />
            Live Kitchen Progression
          </h3>

          <div className="space-y-6 relative pl-2">
            {/* Connecting vertical line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-[#FFF8ED] border-l border-dashed border-[#F4B942]"></div>

            {steps.map((step) => {
              const state = getStepStatus(step.key, order.status);
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  {/* Icon Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    state === 'completed' 
                      ? 'bg-[#198754] border-[#198754] text-white shadow-sm' :
                    state === 'active'
                      ? 'bg-[#E8752A] border-[#F4B942] text-white shadow-md animate-pulse' :
                      'bg-[#FFF8ED] border-[#6B5B50]/30 text-[#6B5B50]'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>

                  {/* Label & Desc */}
                  <div className="pt-0.5">
                    <h4 className={`text-sm font-black ${
                      state === 'active' ? 'text-[#E8752A]' :
                      state === 'completed' ? 'text-[#198754]' :
                      'text-[#6B5B50]'
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-xs text-[#6B5B50]">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-[#F4B942]/30 rounded-2xl p-5 space-y-4 shadow-[0_2px_12px_rgba(36,20,13,0.06)]">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-[#24140D] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#E8752A]" />
              Order Items ({order.items?.length || 0})
            </h3>
            <span className="text-xs font-black text-[#E8752A]">Total: ₹{order.total?.toFixed(0)}</span>
          </div>

          <div className="divide-y divide-[#FFF8ED]">
            {order.items?.map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#E8752A]">{item.quantity}x</span>
                  <span className="font-semibold text-[#24140D]">{item.name}</span>
                </div>
                <span className="text-[#6B5B50] font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#FFF8ED] flex justify-between text-xs text-[#6B5B50]">
            <span>Payment: {order.paymentMethod || 'Dine-In Billing'}</span>
            <span className="text-[#198754] font-black uppercase">{order.paymentStatus || 'Pending'}</span>
          </div>
        </div>

        {/* Action Buttons: Request Bill / Pay Bill & Order More */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to={`/bill?table=${order.tableNumber}`}
            className="py-3.5 px-4 rounded-2xl bg-[#3B2115] hover:bg-[#E8752A] text-[#FFF8ED] font-black text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer border border-[#F4B942]/60"
          >
            <Receipt className="w-4 h-4 text-[#F4B942]" />
            <span>Request & Pay Final Bill</span>
          </Link>

          <Link
            to={`/menu?table=${order.tableNumber}`}
            className="py-3.5 px-4 rounded-2xl bg-[#E8752A] hover:bg-[#3B2115] text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Order More Dishes</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
