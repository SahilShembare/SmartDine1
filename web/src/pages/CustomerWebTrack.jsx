import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTableOrder } from '../context/TableOrderContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
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
  Users,
  AlertTriangle,
  Flame,
  PartyPopper,
  CreditCard,
  Smile
} from 'lucide-react';

export default function CustomerWebTrack() {
  const { orderId } = useParams();
  const { orders } = useTableOrder();
  
  const [order, setOrder] = useState(() => {
    return orders.find(o => o.id === orderId) || null;
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Sync order via Firestore snapshot (real-time) and local orders array
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

  // Fast 1-second clock ticker for live countdown and sync
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      const found = orders.find(o => o.id === orderId);
      if (found) {
        setOrder(prev => (JSON.stringify(prev) !== JSON.stringify(found) ? { ...found } : prev));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [orderId, orders]);

  // Calculate live preparation countdown
  const getPrepCountdown = () => {
    if (!order) return { minutes: 20, seconds: 0, text: '20 min remaining', isOverdue: false };
    
    const startTime = new Date(order.prepStartedAt || order.createdAt || Date.now()).getTime();
    const totalMinutes = order.estimatedPrepMinutes || 20;
    const targetTime = startTime + totalMinutes * 60 * 1000;
    const diffMs = targetTime - currentTime;

    if (diffMs <= 0) {
      return { minutes: 0, seconds: 0, text: 'Almost Ready! Final touches in progress...', isOverdue: true };
    }

    const totalSecsRemaining = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecsRemaining / 60);
    const secs = totalSecsRemaining % 60;

    return {
      minutes: mins,
      seconds: secs,
      text: mins > 0 ? `${mins} min remaining` : `${secs} sec remaining`,
      isOverdue: false
    };
  };

  const prepCountdown = getPrepCountdown();

  // Normalized status resolver
  const getNormalizedStatus = (rawStatus) => {
    const s = String(rawStatus || '').toLowerCase().trim();
    if (s === 'pending' || s === 'placed') return 'placed';
    if (s === 'accepted' || s === 'preparing') return 'preparing';
    if (s === 'ready') return 'ready';
    if (s === 'served' || s === 'enjoying_meal' || s === 'enjoying meal' || s.includes('bill')) return 'served';
    if (s === 'completed') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    return 'placed';
  };

  const normStatus = getNormalizedStatus(order?.status);

  // 5 Ordered table service status steps
  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Received & queued in kitchen', icon: CheckCircle2 },
    { key: 'preparing', label: 'Preparing', desc: 'Chef cooking fresh delicacies', icon: ChefHat },
    { key: 'ready', label: 'Ready', desc: 'Hot & ready for delivery', icon: BellRing },
    { key: 'served', label: 'Served & Enjoying Meal', desc: 'Served at your table • Enjoy your meal!', icon: UtensilsCrossed },
    { key: 'completed', label: 'Completed', desc: 'Payment settled • Thank you!', icon: CheckCheck }
  ];

  const getStepState = (stepKey) => {
    const orderRanks = {
      placed: 0,
      preparing: 1,
      ready: 2,
      served: 3,
      completed: 4,
      cancelled: -1
    };

    const stepRank = orderRanks[stepKey] ?? 0;
    const currentRank = orderRanks[normStatus] ?? 0;

    if (normStatus === 'cancelled') return 'cancelled';
    if (stepRank < currentRank) return 'completed';
    if (stepRank === currentRank) return 'active';
    return 'upcoming';
  };

  // Status Badge visual config
  const getBadgeConfig = () => {
    if (order?.waitingForTable) {
      return {
        label: 'Waiting for Table',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-500'
      };
    }

    if (order?.tableReady) {
      return {
        label: 'Table Ready',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        dot: 'bg-emerald-500'
      };
    }

    switch (normStatus) {
      case 'placed':
        return { label: 'Order Placed', bg: 'bg-orange-500/20 text-orange-400 border-orange-400/40', dot: 'bg-orange-500' };
      case 'preparing':
        return { label: 'Preparing', bg: 'bg-amber-500/20 text-amber-400 border-amber-400/40 animate-pulse', dot: 'bg-amber-500' };
      case 'ready':
        return { label: 'Ready', bg: 'bg-blue-500/20 text-blue-400 border-blue-400/40', dot: 'bg-blue-500' };
      case 'served':
        return { label: 'Enjoying Meal', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40', dot: 'bg-emerald-500' };
      case 'completed':
        return { label: 'Completed', bg: 'bg-slate-800 text-slate-400 border-slate-700', dot: 'bg-slate-500' };
      default:
        return { label: order?.status || 'Active', bg: 'bg-orange-500/20 text-orange-400 border-orange-400/40', dot: 'bg-orange-500' };
    }
  };

  const badgeConfig = getBadgeConfig();

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400 mb-4"></div>
        <h3 className="text-lg font-bold text-white">Locating Order #{orderId}...</h3>
        <p className="text-xs text-slate-400 mt-1">Connecting to live dining updates</p>
        <Link to="/menu" className="mt-6 text-xs text-amber-400 hover:text-amber-300 font-semibold underline">
          Back to Menu
        </Link>
      </div>
    );
  }

  const isTableAssigned = order.tableNumber && order.tableNumber !== 'Waiting for Table';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      
      {/* Top Sticky Header */}
      <div className="bg-slate-950/95 border-b border-slate-800/80 p-4 sticky top-16 z-30 backdrop-blur-md shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to={isTableAssigned ? `/menu?table=${order.tableNumber}` : '/menu'}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Digital Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            {isTableAssigned ? (
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/30 font-black text-xs">
                TABLE {order.tableNumber}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black text-xs flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Queue #{order.queuePosition || 1}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* 1. HERO TABLE WAITING ALERT (Shown ONLY when waiting for table) */}
        {order.waitingForTable && (
          <div className="rounded-3xl bg-slate-900/90 border border-amber-500/40 p-5 shadow-xl animate-in fade-in space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Dine-In Queue Status</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black">
                    Waiting for Table
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  No table is currently available.
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Our hosts will assign your table as soon as one is sanitized and ready.
                </p>
              </div>
            </div>

            {/* Waiting Time & Queue Position Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-center">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Estimated Waiting Time</p>
                <p className="text-lg font-black text-amber-400 mt-0.5">
                  {order.estimatedWaitingMinutes || 15} min
                </p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Queue Position</p>
                <p className="text-lg font-black text-amber-400 mt-0.5">
                  #{order.queuePosition || 1}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. TABLE READY NOTIFICATION (When table becomes assigned / available) */}
        {order.tableReady && isTableAssigned && (
          <div className="rounded-3xl bg-gradient-to-r from-emerald-800/90 to-teal-800/90 border border-emerald-500/40 text-white p-5 shadow-xl animate-in zoom-in-95 duration-300 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg shadow-sm">
                🎉
              </div>
              <div>
                <h3 className="text-lg font-black">Your Table is Ready!</h3>
                <p className="text-xs text-emerald-200">
                  Please proceed to <span className="font-extrabold text-amber-300 underline">Table {order.tableNumber}</span>. Our floor team is ready to welcome you!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. HERO ORDER STATUS CARD */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 text-center space-y-3 relative overflow-hidden shadow-2xl">
          
          {/* Status Badge Pill */}
          <div className="flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badgeConfig.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badgeConfig.dot} animate-ping`} />
              <span>{badgeConfig.label}</span>
            </span>
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-slate-500">ORDER #{order.id}</span>
            <h1 className="text-2xl font-black text-white mt-1">
              {normStatus === 'placed' && 'Order Received at Kitchen 🎉'}
              {normStatus === 'preparing' && 'Food is Being Prepared! 🔥'}
              {normStatus === 'ready' && 'Ready to Serve to Table! 🛎️'}
              {normStatus === 'served' && 'Your Order Has Been Served 🍽️'}
              {normStatus === 'completed' && 'Order Completed! Thank You 👑'}
            </h1>
            
            <p className="text-xs text-slate-400 mt-1">
              {normStatus === 'served' ? (
                <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span>Enjoy your meal! Relax and take your time.</span>
                </span>
              ) : isTableAssigned ? (
                `Assigned to Table ${order.tableNumber} • Authentic preparation`
              ) : (
                'Kitchen has started preparing your order'
              )}
            </p>
          </div>

          {/* 4. REAL-TIME PREPARATION ETA COUNTDOWN (During Placed / Preparing / Ready) */}
          {(normStatus === 'placed' || normStatus === 'preparing') && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Estimated Preparation Time:</span>
                </span>
                <span className="font-black text-white">
                  {order.prepTimeRange || `${order.estimatedPrepMinutes || 20}–${(order.estimatedPrepMinutes || 20) + 5} min`}
                </span>
              </div>

              {/* Countdown Bar */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Live Remaining:</span>
                <span className={`text-base font-black px-2.5 py-0.5 rounded-xl ${
                  prepCountdown.isOverdue ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-glow'
                }`}>
                  {prepCountdown.text}
                </span>
              </div>
            </div>
          )}

          {normStatus === 'ready' && (
            <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2">
              <BellRing className="w-4 h-4 text-blue-400 animate-bounce" />
              <span>Food is cooked and plated! Server is heading to your table.</span>
            </div>
          )}
        </div>

        {/* 5. TABLE SERVICE STATUS TIMELINE PROGRESSION */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Table Service Status
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Real-Time Flow</span>
          </div>

          <div className="space-y-6 relative pl-2">
            {/* Connecting line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-800 border-l-2 border-dashed border-amber-500/40"></div>

            {steps.map((step) => {
              const state = getStepState(step.key);
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  {/* Icon Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    state === 'completed' 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' :
                    state === 'active'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-amber-400 text-white shadow-glow animate-pulse' :
                      'bg-slate-950 border-slate-800 text-slate-500'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>

                  {/* Label & Description */}
                  <div className="pt-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-black ${
                        state === 'active' ? 'text-amber-400' :
                        state === 'completed' ? 'text-emerald-400' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </h4>
                      {state === 'active' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Current Status
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. ORDER ITEMS SUMMARY */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              Order Items ({order.items?.length || 0})
            </h3>
            <span className="text-xs font-black text-amber-400">Total: ₹{order.total?.toFixed(0)}</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {order.items?.map((item, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                    {item.quantity}x
                  </span>
                  <span className="font-semibold text-white">{item.name}</span>
                </div>
                <span className="text-slate-400 font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Payment Method: {order.paymentMethod || 'Dine-In Billing'}</span>
            <span className="text-emerald-400 font-black uppercase">{order.paymentStatus || 'Pending'}</span>
          </div>
        </div>

        {/* 7. ACTION BUTTONS: VIEW BILL RECEIPT & ORDER MORE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to={isTableAssigned ? `/bill?table=${order.tableNumber}` : `/bill?orderId=${order.id}`}
            className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white border border-amber-500/40 font-black text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>View Bill Receipt</span>
          </Link>

          <Link
            to={`/menu${isTableAssigned ? `?table=${order.tableNumber}` : ''}`}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-glow"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Order More Delicacies</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
