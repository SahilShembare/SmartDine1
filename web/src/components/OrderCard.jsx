import React from 'react';
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
  MessageSquare
} from 'lucide-react';

export default function OrderCard({ order, onUpdateStatus, readOnly = false }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'placed':
        return { label: 'New Order', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-300', pulse: true };
      case 'accepted':
        return { label: 'Accepted', bg: 'bg-blue-500/20 border-blue-500/40 text-blue-300', pulse: false };
      case 'preparing':
        return { label: 'Preparing', bg: 'bg-orange-500/20 border-orange-500/40 text-orange-300', pulse: true };
      case 'ready':
        return { label: 'Ready to Serve', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', pulse: true };
      case 'completed':
        return { label: 'Completed', bg: 'bg-slate-700/50 border-slate-600 text-slate-400', pulse: false };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-red-500/20 border-red-500/40 text-red-400', pulse: false };
      default:
        return { label: status, bg: 'bg-slate-800 border-slate-700 text-slate-300', pulse: false };
    }
  };

  const badge = getStatusBadge(order.status);

  // Time elapsed
  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return '0m';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff > 60) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    return `${diff} min ago`;
  };

  return (
    <div className={`rounded-2xl border transition-all duration-300 bg-slate-900/80 backdrop-blur-md overflow-hidden flex flex-col justify-between ${
      order.status === 'pending' ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40' :
      order.status === 'ready' ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40' :
      'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-base tracking-wide flex items-center gap-1.5">
            <span>Table {order.tableNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              #{order.id}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{getElapsedMinutes(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badge.bg}`}>
          {badge.pulse && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
          {badge.label}
        </span>
      </div>

      {/* Customer Info (if present) */}
      {(order.customerName || order.customerPhone) && (
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{order.customerName || 'Dine-in Customer'}</span>
          </div>
          {order.customerPhone && (
            <div className="flex items-center gap-1 text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{order.customerPhone}</span>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="p-4 space-y-3 flex-1">
        <div className="space-y-2">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 text-sm py-1 border-b border-slate-800/40 last:border-0">
              <div className="flex items-start gap-2.5">
                {/* Veg/NonVeg dot */}
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                  item.isVeg !== false ? 'border-emerald-500' : 'border-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'
                  }`} />
                </span>
                <div>
                  <div className="font-semibold text-slate-200">
                    <span className="text-orange-400 font-bold mr-1.5">{item.quantity}x</span>
                    {item.name}
                  </div>
                  {item.instructions && (
                    <div className="text-xs text-amber-300/90 italic flex items-center gap-1 mt-0.5">
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <span>{item.instructions}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="font-medium text-slate-300 text-xs shrink-0">
                ₹{(item.price * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
        </div>

        {/* Special order note */}
        {order.notes && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-semibold">Note:</span> {order.notes}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Status Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-800/20 space-y-3">
        {/* Total & Payment */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Receipt className="w-3.5 h-3.5" />
            <span>Total Bill:</span>
            <span className="text-slate-100 font-bold text-sm ml-1">₹{order.total?.toFixed(0) || '0'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
            order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
          }`}>
            {order.paymentStatus || 'Pending'}
          </span>
        </div>

        {/* Action Buttons based on status (Hidden if Read-Only Admin View) */}
        {readOnly ? (
          <div className="text-center py-2 px-3 rounded-xl bg-slate-900/80 text-slate-400 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Admin Monitor (Read-Only Mode)</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'accepted')}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept Order
                </button>
              </>
            )}

            {order.status === 'accepted' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'preparing')}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-glow transition active:scale-95"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  Start Preparing
                </button>
              </>
            )}

            {order.status === 'preparing' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  Mark as Ready
                </button>
              </>
            )}

            {order.status === 'ready' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-xs shadow-md transition active:scale-95"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Complete & Serve
                </button>
              </>
            )}

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to cancel order #${order.id}?`)) {
                    onUpdateStatus(order.id, 'cancelled');
                  }
                }}
                className="col-span-2 text-center text-[11px] text-slate-400 hover:text-red-400 py-1 transition"
              >
                Cancel Order
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
