import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Utensils, 
  CheckCircle2, 
  ChefHat, 
  BellRing, 
  CheckCheck, 
  XCircle, 
  User, 
  Phone, 
  Receipt,
  MessageSquare,
  AlertTriangle,
  Printer,
  Flame,
  Check,
  Timer,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function OrderCard({ 
  order, 
  onUpdateStatus, 
  onUpdateEta, 
  onOpenKotSlip,
  readOnly = false,
  stationFilter = 'all'
}) {
  // Live second-by-second elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!order?.createdAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
  });

  useEffect(() => {
    const updateTime = () => {
      if (!order?.createdAt) return;
      const secs = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000));
      setElapsedSeconds(secs);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [order?.createdAt]);

  // Line-cook item checklist state (persisted in localStorage for kitchen continuity)
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`smartdine_kds_checked_${order?.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleItemCheck = (idx) => {
    if (readOnly) return;
    setCheckedItems(prev => {
      const next = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`smartdine_kds_checked_${order?.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const totalItemsCount = order?.items?.length || 0;
  const platedItemsCount = Object.values(checkedItems).filter(Boolean).length;
  const isAllPlated = totalItemsCount > 0 && platedItemsCount >= totalItemsCount;

  // Format Elapsed Time (MM:SS or HH:MM)
  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}h ${remMins}m`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Status & Urgency Logic
  const statusStr = String(order?.status || '').toLowerCase().trim();
  const isActiveOrder = statusStr !== 'completed' && statusStr !== 'cancelled';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const targetPrepMinutes = order?.estimatedPrepMinutes || 20;

  // Overdue / Rush Alert threshold (>15m or exceeds target ETA)
  const isRush = isActiveOrder && (elapsedMinutes >= 15 || (targetPrepMinutes > 0 && elapsedMinutes >= targetPrepMinutes));
  const isCaution = isActiveOrder && elapsedMinutes >= 10 && !isRush;

  const getStatusBadge = () => {
    if (order?.waitingForTable) {
      return { 
        label: `Waiting #${order.queuePosition || 1}`, 
        tag: 'QUEUED',
        bg: 'bg-amber-500/20 border-amber-500/50 text-amber-300', 
        pulse: true 
      };
    }
    switch (statusStr) {
      case 'pending':
      case 'placed':
        return { 
          label: 'New Order', 
          tag: 'UNACCEPTED',
          bg: 'bg-orange-500/25 border-orange-500 text-orange-300 font-bold', 
          pulse: true 
        };
      case 'accepted':
      case 'preparing':
        return { 
          label: 'In Prep', 
          tag: 'COOKING',
          bg: 'bg-blue-500/25 border-blue-500 text-blue-300 font-bold', 
          pulse: true 
        };
      case 'ready':
        return { 
          label: 'Ready for Runner', 
          tag: 'EXPEDITE',
          bg: 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-bold', 
          pulse: true 
        };
      case 'served':
      case 'enjoying_meal':
      case 'enjoying meal':
        return { 
          label: 'Served (At Table)', 
          tag: 'DINING',
          bg: 'bg-teal-500/20 border-teal-500/40 text-teal-300', 
          pulse: false 
        };
      case 'bill requested':
      case 'bill_requested':
        return { 
          label: 'Bill Requested', 
          tag: 'BILLING',
          bg: 'bg-purple-500/25 border-purple-500 text-purple-300', 
          pulse: true 
        };
      case 'completed':
        return { 
          label: 'Completed', 
          tag: 'CLOSED',
          bg: 'bg-slate-800 border-slate-700 text-slate-400', 
          pulse: false 
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          tag: 'CANCELLED',
          bg: 'bg-red-500/20 border-red-500/40 text-red-400', 
          pulse: false 
        };
      default:
        return { 
          label: order?.status || 'Active', 
          tag: 'KDS',
          bg: 'bg-slate-800 border-slate-700 text-slate-300', 
          pulse: false 
        };
    }
  };

  const badge = getStatusBadge();

  // Helper to format placed time e.g. "8:42 PM"
  const getOrderTimeStr = (isoDate) => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Card Outer Glow & Border based on KDS Priority
  const getCardBorderClasses = () => {
    if (isRush) {
      return 'border-red-500 ring-2 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.25)] bg-slate-900/95';
    }
    if (statusStr === 'pending' || statusStr === 'placed') {
      return 'border-orange-500/80 ring-1 ring-orange-500/40 shadow-[0_0_20px_rgba(232,117,42,0.20)] bg-slate-900/95';
    }
    if (statusStr === 'preparing' || statusStr === 'accepted') {
      return 'border-blue-500/70 ring-1 ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.18)] bg-slate-900/95';
    }
    if (statusStr === 'ready') {
      return 'border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.20)] bg-slate-900/95';
    }
    if (statusStr === 'served' || statusStr === 'enjoying_meal') {
      return 'border-teal-500/50 shadow-md bg-slate-900/90';
    }
    return 'border-slate-800 hover:border-slate-700 bg-slate-900/80';
  };

  return (
    <div className={`rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between select-none ${getCardBorderClasses()}`}>
      
      {/* ==================================================================== */}
      {/* 1. KDS TICKET HEADER (High Contrast & Big Table Number)              */}
      {/* ==================================================================== */}
      <div className={`p-4 border-b flex flex-col gap-2.5 ${
        isRush ? 'bg-red-950/40 border-red-500/40' :
        statusStr === 'pending' || statusStr === 'placed' ? 'bg-orange-950/20 border-orange-500/30' :
        statusStr === 'preparing' ? 'bg-blue-950/20 border-blue-500/30' :
        statusStr === 'ready' ? 'bg-emerald-950/20 border-emerald-500/30' :
        'bg-slate-800/40 border-slate-800/80'
      }`}>
        
        {/* Top Row: Table Identification & Live Elapsed Clock */}
        <div className="flex items-center justify-between gap-2">
          {/* Big Restaurant Table Tag */}
          <div className="flex items-center gap-2">
            <div className={`px-3.5 py-1.5 rounded-xl font-black text-base lg:text-lg tracking-wider border shadow-md flex items-center gap-1.5 ${
              isRush 
                ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/50'
            }`}>
              <span>{order?.waitingForTable ? `QUEUE #${order.queuePosition || 1}` : `TABLE ${order?.tableNumber || '01'}`}</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-extrabold text-slate-300">
                  KOT #{String(order?.id || '').slice(-6).toUpperCase()}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  Dine-In
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                {getOrderTimeStr(order?.createdAt) || 'Just now'}
              </span>
            </div>
          </div>

          {/* Live Precision Kitchen Clock (Timer) */}
          <div className="flex flex-col items-end">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border flex items-center gap-1.5 shadow-sm ${
              isRush 
                ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' 
                : isCaution 
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' 
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}>
              <Timer className={`w-3.5 h-3.5 shrink-0 ${isRush ? 'animate-spin' : ''}`} />
              <span>{formatTimer(elapsedSeconds)}</span>
              {isRush && (
                <span className="text-[10px] uppercase font-black tracking-widest text-red-400 bg-red-950/60 px-1 rounded">
                  RUSH
                </span>
              )}
            </div>

            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                {badge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping shrink-0" />}
                <span>{badge.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Customer meta row (if provided) */}
        {(order?.customerName || order?.customerPhone) && (
          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate font-semibold text-slate-300">{order.customerName || 'Dine-in Guest'}</span>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-1 text-slate-400">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 2. KITCHEN PREPARATION NOTES / ALLERGY WARNING                       */}
      {/* ==================================================================== */}
      {order?.notes && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 shadow-inner">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="leading-snug">
            <span className="font-extrabold uppercase tracking-wide text-amber-300 mr-1">Chef Note:</span>
            <span className="font-semibold">{order.notes}</span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE DISH CHECKLIST (Cook Plating Progression)              */}
      {/* ==================================================================== */}
      <div className="p-4 space-y-3 flex-1">
        
        {/* Plating Progress Header */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-800/60">
          <span className="uppercase tracking-wider">
            Ticket Items ({totalItemsCount})
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
            isAllPlated 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-slate-800 text-slate-300'
          }`}>
            {platedItemsCount} / {totalItemsCount} Plated
          </span>
        </div>

        {/* Dish Items List */}
        <div className="space-y-1.5">
          {order?.items?.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <div 
                key={idx}
                onClick={() => toggleItemCheck(idx)}
                className={`p-2 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                  isChecked 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 opacity-75' 
                    : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700 text-slate-100'
                }`}
                title={readOnly ? undefined : "Click to mark this dish as Plated / Cooked"}
              >
                {/* Checkbox & Details */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Interactive Tap Checkbox */}
                  <button
                    type="button"
                    disabled={readOnly}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isChecked 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' 
                        : 'border-slate-600 bg-slate-900/60 hover:border-orange-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  {/* Veg / Non-Veg food indicator symbol */}
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    item.isVeg !== false ? 'border-emerald-500 bg-emerald-950/30' : 'border-red-500 bg-red-950/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </span>

                  {/* Dish Name & Quantity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded font-black text-xs shrink-0 ${
                        isChecked 
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      }`}>
                        {item.quantity}x
                      </span>
                      <span className={`font-bold text-sm tracking-tight truncate ${
                        isChecked ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}>
                        {item.name}
                      </span>
                    </div>

                    {/* Custom Line-Item Cooking Instruction */}
                    {item.instructions && (
                      <div className="text-[11px] text-amber-300 italic flex items-center gap-1 mt-1 pl-1">
                        <MessageSquare className="w-3 h-3 shrink-0 text-amber-400" />
                        <span className="truncate">{item.instructions}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plated Tag or Price */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {isChecked ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide">
                      Plated
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isAllPlated ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
            }`}
            style={{ width: `${totalItemsCount > 0 ? (platedItemsCount / totalItemsCount) * 100 : 0}%` }}
          />
        </div>

        {/* ================================================================== */}
        {/* PREPARATION ETA CONTROLS (Adjustable Target Cooking Time)           */}
        {/* ================================================================== */}
        {!readOnly && isActiveOrder && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Prep ETA:</span>
                <span className="font-extrabold text-amber-300">{targetPrepMinutes} min</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {order?.prepTimeRange || `${targetPrepMinutes}–${targetPrepMinutes + 5}m`}
              </span>
            </div>

            {onUpdateEta && (
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Adjust:</span>
                <button
                  type="button"
                  onClick={() => onUpdateEta(order.id, Math.max(5, targetPrepMinutes - 5))}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold border border-slate-700 transition cursor-pointer active:scale-95"
                  title="Reduce prep ETA by 5 minutes"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateEta(order.id, targetPrepMinutes + 5)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold border border-slate-700 transition cursor-pointer active:scale-95"
                  title="Increase prep ETA by 5 minutes"
                >
                  +5m
                </button>
                {[10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onUpdateEta(order.id, mins)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      targetPrepMinutes === mins
                        ? 'bg-amber-500/30 text-amber-300 border-amber-500/60 font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. TICKET FOOTER & RESTAURANT BUMP BAR ACTIONS                      */}
      {/* ==================================================================== */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-800/30 space-y-2.5">
        
        {/* Bill Total & Payment Status Row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300">Total:</span>
            <span className="text-white font-extrabold text-sm">₹{order?.total?.toFixed(0) || '0'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
              order?.paymentStatus === 'paid' || order?.paymentStatus === 'Paid'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              {order?.paymentStatus || 'Pending'}
            </span>

            {/* Print KOT Slip Button */}
            {onOpenKotSlip && (
              <button
                type="button"
                onClick={() => onOpenKotSlip(order)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Print Thermal KOT Slip"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Commercial KDS Bump Bar Action Buttons */}
        {readOnly ? (
          <div className="text-center py-2 px-3 rounded-xl bg-slate-900/80 text-slate-400 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Monitor (Read-Only Mode)</span>
          </div>
        ) : (
          <div className="space-y-2">
            
            {/* 1. New / Pending Order -> Start Cooking */}
            {(statusStr === 'pending' || statusStr === 'placed') && (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-glow transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <ChefHat className="w-4 h-4" />
                <span>🔥 Start Cooking (Accept KOT)</span>
              </button>
            )}

            {/* 2. In Prep -> Mark Ready for Runner */}
            {(statusStr === 'preparing' || statusStr === 'accepted') && (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'ready')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <BellRing className="w-4 h-4 animate-pulse" />
                <span>🛎️ Mark Ready for Service</span>
              </button>
            )}

            {/* 3. Ready -> Served to Table */}
            {statusStr === 'ready' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'served')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <Utensils className="w-4 h-4" />
                <span>🍽️ Served to Table</span>
              </button>
            )}

            {/* 4. Served / Bill Requested -> Complete Order */}
            {(statusStr === 'served' || statusStr === 'enjoying_meal' || statusStr === 'bill requested') && (
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'completed')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <CheckCheck className="w-4 h-4" />
                <span>✅ Complete Ticket</span>
              </button>
            )}

            {/* Secondary Option: Print KOT & Cancel Button */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              {onOpenKotSlip && (
                <button
                  type="button"
                  onClick={() => onOpenKotSlip(order)}
                  className="text-slate-400 hover:text-orange-400 flex items-center gap-1 transition cursor-pointer font-semibold"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print KOT</span>
                </button>
              )}

              {isActiveOrder && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to cancel Ticket KOT #${order?.id}?`)) {
                      onUpdateStatus(order.id, 'cancelled');
                    }
                  }}
                  className="text-slate-400 hover:text-red-400 transition cursor-pointer font-semibold ml-auto"
                >
                  Cancel Ticket
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
