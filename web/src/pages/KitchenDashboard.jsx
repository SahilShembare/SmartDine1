import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import OrderCard from '../components/OrderCard';
import { useTableOrder } from '../context/TableOrderContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  ChefHat, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  Sparkles
} from 'lucide-react';

export default function KitchenDashboard() {
  const { orders, updateOrderStatus } = useTableOrder();
  const [activeTab, setActiveTab] = useState('all'); // all, pending, accepted, preparing, ready, completed
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCountRef = useRef(orders.length);

  // Play audio chime when a new order arrives
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && soundEnabled) {
      playChime();
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, soundEnabled]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } else {
      updateOrderStatus(orderId, newStatus);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return order.status !== 'completed' && order.status !== 'cancelled';
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'placed';
    if (activeTab === 'accepted') return order.status === 'accepted';
    if (activeTab === 'preparing') return order.status === 'preparing';
    if (activeTab === 'ready') return order.status === 'ready';
    if (activeTab === 'completed') return order.status === 'completed';
    return true;
  });

  // Tab counters
  const counts = {
    pending: orders.filter(o => o.status === 'pending' || o.status === 'placed').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950">
      <Sidebar mode="kitchen" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Kitchen Live Order Station
              <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <ChefHat className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live orders received from customer table QR scans in real-time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                soundEnabled 
                  ? 'bg-slate-800 text-orange-400 border-orange-500/30' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Chime Alert ON' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
          
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>Active Queue</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
              {counts.pending + counts.accepted + counts.preparing + counts.ready}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>New Orders</span>
            {counts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] animate-bounce">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'accepted'
                ? 'bg-blue-500 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>Accepted</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
              {counts.accepted}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'preparing'
                ? 'bg-orange-600 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>Preparing (Cooking)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
              {counts.preparing}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'ready'
                ? 'bg-emerald-600 text-white shadow-glow'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>Ready to Serve</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
              {counts.ready}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950/50 text-[10px]">
              {counts.completed}
            </span>
          </button>

        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-3">
            <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-300">No orders in this stage</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              New dining orders placed by customers from mobile or QR web app will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleStatusUpdate}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
