import React, { useState, useEffect } from 'react';
import { useTableOrder } from '../context/TableOrderContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { 
  Bell, 
  X, 
  Droplets, 
  Utensils, 
  Sparkles, 
  Receipt, 
  HandMetal, 
  MessageSquareText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  XCircle,
  Flame,
  Coffee,
  Check
} from 'lucide-react';

// Web Audio API authentic restaurant bell chime
function playRestaurantBellChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic 1: Crisp primary ding
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1480, now);
    osc1.frequency.exponentialRampToValueAtTime(1460, now + 0.9);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Harmonic 2: Shimmering overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2960, now);
    osc2.frequency.exponentialRampToValueAtTime(2920, now + 0.6);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.6);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

const SERVICE_REASONS = [
  { id: 'water', label: 'Water Refill', icon: Droplets, desc: 'Drinking water for table' },
  { id: 'cutlery', label: 'Extra Cutlery', icon: Utensils, desc: 'Spoons, forks, plates' },
  { id: 'clean', label: 'Clean Table', icon: Sparkles, desc: 'Wipe / clear dishes' },
  { id: 'condiments', label: 'Sauces & Spices', icon: Flame, desc: 'Chutneys, salt, pepper' },
  { id: 'menu', label: 'Menu Suggestions', icon: HelpCircle, desc: 'Chef recommendations' },
  { id: 'bill', label: 'Bill Assistance', icon: Receipt, desc: 'Payment / invoice query' },
  { id: 'general', label: 'Call Waiter', icon: Bell, desc: 'General floor service' },
];

export default function CallWaiterModal({ isOpen, onClose, defaultTable = null }) {
  const { 
    currentTable, 
    setTableSession, 
    callWaiter, 
    cancelWaiterCall, 
    getActiveWaiterCallForTable,
    tables = []
  } = useTableOrder();
  const { currentUser } = useAuth();

  const [selectedTable, setSelectedTable] = useState(defaultTable || currentTable || '01');
  const [selectedReason, setSelectedReason] = useState('water');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync table if currentTable changes
  useEffect(() => {
    if (defaultTable) setSelectedTable(defaultTable);
    else if (currentTable) setSelectedTable(currentTable);
  }, [defaultTable, currentTable]);

  const formattedTable = String(selectedTable || '01').padStart(2, '0');
  const activeCall = getActiveWaiterCallForTable(formattedTable);

  if (!isOpen) return null;

  const handleCallWaiter = async (e) => {
    e?.preventDefault?.();
    setIsSubmitting(true);

    try {
      const reasonObj = SERVICE_REASONS.find(r => r.id === selectedReason);
      const reasonLabel = reasonObj ? reasonObj.label : 'General Assistance';
      const guestName = currentUser?.displayName || localStorage.getItem('smartdine_guest_name') || 'Guest';

      await callWaiter({
        tableNumber: formattedTable,
        reason: reasonLabel,
        notes: customNote,
        customerName: guestName
      });

      // Also set table session if not yet active
      if (!currentTable) {
        setTableSession(formattedTable);
      }

      // Play bell chime
      playRestaurantBellChime();

      // Confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      toast.success(`🔔 Floor staff alerted for Table ${formattedTable}! Waiter is arriving.`, {
        duration: 5000,
        icon: '🛎️'
      });
      setCustomNote('');
    } catch (err) {
      toast.error('Failed to notify waiter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCall = async () => {
    if (activeCall) {
      await cancelWaiterCall(activeCall.id);
      toast('Waiter request cancelled', { icon: 'ℹ️' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Glow ambient background element */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-glow">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            {activeCall && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Call Waiter</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Floor Service
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Table <strong className="text-white">{formattedTable}</strong> • Floor staff will arrive at your table
            </p>
          </div>
        </div>

        {/* ACTIVE CALL STATE (If already alerted) */}
        {activeCall ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900 border border-amber-500/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-white">
                Floor Staff Alerted! 🏃‍♂️
              </h3>
              <p className="text-xs text-amber-300/90 font-medium">
                A waiter is on their way to <strong>Table {formattedTable}</strong> for <span className="underline font-bold">{activeCall.reason}</span>.
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Estimated arrival: <strong>~1-2 minutes</strong></span>
              </div>
            </div>

            {activeCall.notes && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Special Instructions:</span>
                "{activeCall.notes}"
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCancelCall}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cancel Waiter Request</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-glow transition cursor-pointer"
              >
                Done & Return to Table
              </button>
            </div>
          </div>
        ) : (
          /* NEW REQUEST FORM */
          <form onSubmit={handleCallWaiter} className="space-y-4">
            
            {/* Table Selector */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 text-xs">
              <span className="font-semibold text-slate-300 pl-1">Seated Table:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-900 text-amber-400 font-black px-2.5 py-1 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {tables.length > 0 ? (
                    tables.map(t => (
                      <option key={t.id || t.tableNumber} value={t.tableNumber}>
                        Table {String(t.tableNumber).padStart(2, '0')}
                      </option>
                    ))
                  ) : (
                    ['01', '02', '03', '04', '05', '06', '07', '08'].map(num => (
                      <option key={num} value={num}>Table {num}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Quick Reason Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                What do you need assistance with?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_REASONS.map((reason) => {
                  const Icon = reason.icon;
                  const isSelected = selectedReason === reason.id;
                  return (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500 text-white shadow-md'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-700/70 text-amber-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-black truncate">{reason.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{reason.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Custom Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Specific Request / Note <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <MessageSquareText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Need extra napkins, baby chair, etc."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-glow transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>{isSubmitting ? 'Notifying Floor Staff...' : `Ring Waiter for Table ${formattedTable}`}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
