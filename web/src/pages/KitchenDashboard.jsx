import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import OrderCard from '../components/OrderCard';
import { useTableOrder } from '../context/TableOrderContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  playOrderBellSound, 
  showOrderNotification, 
  requestNotificationPermission 
} from '../utils/notificationSound';
import { 
  ChefHat, 
  Bell, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  ShoppingBag,
  BellRing
} from 'lucide-react';

export default function KitchenDashboard() {
  const { orders, updateOrderStatus, refreshOrders } = useTableOrder();
  const [activeTab, setActiveTab] = useState('all'); // all, pending, accepted, preparing, ready, completed
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const prevOrdersCountRef = useRef(orders.length);
  const prevOrderIdsRef = useRef(new Set(orders.map(o => o.id)));

  // 3-Second Active Auto-Refresh Interval
  useEffect(() => {
    const syncTimer = setInterval(async () => {
      setIsRefreshing(true);
      if (refreshOrders) {
        await refreshOrders();
      }
      setLastSyncTime(new Date().toLocaleTimeString());
      setTimeout(() => setIsRefreshing(false), 500);
    }, 3000);

    return () => clearInterval(syncTimer);
  }, [refreshOrders]);

  // Detect newly arrived orders
  useEffect(() => {
    // Check if new order arrived
    const currentIds = new Set(orders.map(o => o.id));
    const newOrders = orders.filter(o => !prevOrderIdsRef.current.has(o.id));

    if (newOrders.length > 0) {
      const latest = newOrders[0];
      if (soundEnabled) {
        showOrderNotification(
          `🔔 New Order from Table ${latest.tableNumber || '01'}!`,
          `Order #${latest.id} • ${latest.items?.length || 0} items • ₹${latest.total?.toFixed(0) || '0'}`
        );
      }
      setNewOrderAlert(latest);
      // Auto-hide banner after 8 seconds
      setTimeout(() => setNewOrderAlert(null), 8000);
    }

    prevOrdersCountRef.current = orders.length;
    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled]);

  const handleEnableNotifications = () => {
    requestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setNotifPermission(perm);
        playOrderBellSound();
      });
    }
  };

  const handleTestSound = () => {
    playOrderBellSound();
    setNewOrderAlert({
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: '01',
      customerName: 'Test Diner',
      total: 540,
      items: [{ name: 'Butter Chicken' }, { name: 'Paneer Tikka' }]
    });
    setTimeout(() => setNewOrderAlert(null), 5000);
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

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl relative">
        
        {/* Floating Top Alert Banner for Incoming Orders */}
        {newOrderAlert && (
          <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-in slide-in-from-top duration-300">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white shadow-glow-lg border-2 border-white/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-bold animate-bounce">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>New Order: Table {newOrderAlert.tableNumber || '01'}!</span>
                    <span className="text-xs font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded">#{newOrderAlert.id}</span>
                  </h4>
                  <p className="text-xs text-orange-100 mt-0.5">
                    {newOrderAlert.items?.length || 1} items • Total: ₹{newOrderAlert.total || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('pending');
                    setNewOrderAlert(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white text-orange-600 font-extrabold text-xs shadow hover:bg-orange-50"
                >
                  View
                </button>
                <button
                  onClick={() => setNewOrderAlert(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

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

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live 3s Auto-Sync Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Auto-Sync: 3s</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">({lastSyncTime})</span>
            </div>

            {/* Test Sound Bell */}
            <button
              onClick={handleTestSound}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-glow transition active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>Test Order Bell Sound</span>
            </button>

            {/* Notification Permission button if not granted */}
            {notifPermission !== 'granted' && (
              <button
                onClick={handleEnableNotifications}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Enable Desktop Popups</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderBellSound();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                soundEnabled 
                  ? 'bg-slate-800 text-orange-400 border-orange-500/30' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
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
              New dining orders placed by customers from mobile or QR web app will appear here instantly with sound chime.
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
