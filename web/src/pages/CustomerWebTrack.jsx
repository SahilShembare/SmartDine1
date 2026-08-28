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

  const steps = [
    { key: 'placed', label: 'Order Received', desc: 'Sent to restaurant kitchen', icon: CheckCircle2 },
    { key: 'accepted', label: 'Order Accepted', desc: 'Chef acknowledged order', icon: Clock },
    { key: 'preparing', label: 'Cooking & Prep', desc: 'Freshly making your dishes', icon: ChefHat },
    { key: 'ready', label: 'Ready to Serve', desc: 'On its way to your table', icon: BellRing },
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <h3 className="text-lg font-bold text-white">Loading Order #{orderId}...</h3>
        <p className="text-xs text-slate-400 mt-1">Connecting to kitchen live updates</p>
        <Link to="/menu" className="mt-6 text-xs text-orange-400 font-semibold underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Top Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/menu"
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Digital Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-xs">
              TABLE {order.tableNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Status Card Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-orange-950/30 to-slate-900 border border-slate-800 p-6 text-center space-y-3 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>

          <div className="inline-flex p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-glow">
            <ChefHat className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-slate-400">ORDER #{order.id}</span>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">
              {order.status === 'pending' ? 'Order Sent to Kitchen 🎉' :
               order.status === 'accepted' ? 'Order Accepted by Chef 👨‍🍳' :
               order.status === 'preparing' ? 'Your Food is Sizzling! 🔥' :
               order.status === 'ready' ? 'Ready to Serve to Table! 🛎️' :
               order.status === 'completed' ? 'Order Completed! Enjoy Your Meal 🍽️' :
               'Order Cancelled'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Table {order.tableNumber} • Estimated prep time: ~15-20 min
            </p>
          </div>
        </div>

        {/* Live Stepper Tracker */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            Live Kitchen Progression
          </h3>

          <div className="space-y-6 relative pl-2">
            {/* Connecting vertical line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-800"></div>

            {steps.map((step, idx) => {
              const state = getStepStatus(step.key, order.status);
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  {/* Icon Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    state === 'completed' 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' :
                    state === 'active'
                      ? 'bg-orange-500 border-orange-400 text-white shadow-glow animate-pulse' :
                      'bg-slate-900 border-slate-800 text-slate-600'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>

                  {/* Label & Desc */}
                  <div className="pt-0.5">
                    <h4 className={`text-sm font-bold ${
                      state === 'active' ? 'text-orange-400' :
                      state === 'completed' ? 'text-slate-200' :
                      'text-slate-500'
                    }`}>
                      {step.label}
                    </h4>
                    <p className="text-xs text-slate-400">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Accordion */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-400" />
              Order Items ({order.items?.length || 0})
            </h3>
            <span className="text-xs font-bold text-orange-400">Total: ₹{order.total?.toFixed(0)}</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {order.items?.map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-400">{item.quantity}x</span>
                  <span className="font-semibold text-slate-200">{item.name}</span>
                </div>
                <span className="text-slate-400">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Payment: {order.paymentMethod || 'Pay at Counter'}</span>
            <span className="text-emerald-400 font-semibold uppercase">{order.paymentStatus || 'Pending'}</span>
          </div>
        </div>

        {/* Action button */}
        <Link
          to={`/menu?table=${order.tableNumber}`}
          className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition flex items-center justify-center gap-2"
        >
          <UtensilsCrossed className="w-4 h-4 text-orange-400" />
          <span>Order More Items for Table {order.tableNumber}</span>
        </Link>

      </div>
    </div>
  );
}
