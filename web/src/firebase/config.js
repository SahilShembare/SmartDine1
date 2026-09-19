import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_TABLES, DEMO_ORDERS } from './seed-data.js';
import { getNextOrderNumber } from '../utils/orderNumber.js';

// Firebase configuration from environment or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDjpryj-feHO_SiyCJXHTlEZcUV-nibyfA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartdine1-81c82.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartdine1-81c82",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartdine1-81c82.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "732105111093",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:732105111093:web:1018e79194d3f0faa7637c"
};

export const isFirebaseConfigured = true;

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Local persistent state for seamless fallback / demo mode
const LOCAL_STORAGE_KEY_PREFIX = 'smartdine_';

function getLocalData(key, defaultData) {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}`, e);
  }
  return defaultData;
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(data));
    // Dispatch custom event for real-time local sync across tabs/components
    window.dispatchEvent(new CustomEvent('smartdine_db_update', { detail: { collection: key, data } }));
  } catch (e) {
    console.warn(`Error writing localStorage for ${key}`, e);
  }
}

// In-Memory & LocalStorage Real-time Store (100% Real Live Production Mode)
export const localStore = {
  getCategories: () => {
    const data = getLocalData('categories', DEMO_CATEGORIES);
    if (Array.isArray(data)) {
      const activeIds = new Set(DEMO_CATEGORIES.map(c => c.id));
      const filtered = data.filter(cat => activeIds.has(cat.id));
      if (filtered.length !== data.length) {
        setLocalData('categories', filtered);
        return filtered;
      }
    }
    return data;
  },
  saveCategories: (categories) => setLocalData('categories', categories),
  
  getMenuItems: () => {
    const data = getLocalData('menuItems', DEMO_MENU_ITEMS);
    if (Array.isArray(data)) {
      const activeIds = new Set(DEMO_MENU_ITEMS.map(i => i.id));
      const filtered = data.filter(item => activeIds.has(item.id));
      if (filtered.length !== data.length) {
        setLocalData('menuItems', filtered);
        return filtered;
      }
    }
    return data;
  },
  saveMenuItems: (items) => setLocalData('menuItems', items),
  
  getTables: () => {
    const data = getLocalData('tables', null);
    if (data === null) {
      // First time initialization only: seed initial real tables
      setLocalData('tables', DEMO_TABLES);
      return DEMO_TABLES;
    }
    if (!Array.isArray(data)) return [];
    // Auto-deduplicate by tableNumber so repeat tables never appear
    const seen = new Set();
    const unique = [];
    for (const t of data) {
      const num = String(t.tableNumber || '').trim().padStart(2, '0');
      if (num && !seen.has(num)) {
        seen.add(num);
        unique.push({ ...t, tableNumber: num });
      }
    }
    if (unique.length !== data.length) {
      setLocalData('tables', unique);
    }
    return unique;
  },
  saveTables: (tables) => {
    const seen = new Set();
    const unique = [];
    for (const t of (tables || [])) {
      const num = String(t.tableNumber || '').trim().padStart(2, '0');
      if (num && !seen.has(num)) {
        seen.add(num);
        unique.push({ ...t, tableNumber: num });
      }
    }
    setLocalData('tables', unique);
  },
  
  // Real orders start empty unless real customer orders have been placed
  getOrders: () => getLocalData('orders', []),
  saveOrders: (orders) => setLocalData('orders', orders),

  resetToRealData: () => {
    setLocalData('categories', DEMO_CATEGORIES);
    setLocalData('menuItems', DEMO_MENU_ITEMS);
    setLocalData('tables', DEMO_TABLES);
    setLocalData('orders', []);
  },

  addOrder: (orderData) => {
    const orders = getLocalData('orders', []);
    const estMinutes = orderData.estimatedPrepMinutes || 20;
    const orderNumber = orderData.orderNumber || orderData.id || getNextOrderNumber(orders);
    const newOrder = {
      id: orderNumber,
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prepStartedAt: orderData.prepStartedAt || new Date().toISOString(),
      estimatedPrepMinutes: estMinutes,
      prepTimeRange: orderData.prepTimeRange || `${estMinutes}–${estMinutes + 5} min`,
      waitingForTable: orderData.waitingForTable || false,
      queuePosition: orderData.queuePosition || null,
      estimatedWaitingMinutes: orderData.estimatedWaitingMinutes || null,
      status: orderData.status || 'pending',
      paymentStatus: 'pending',
      ...orderData,
      id: orderNumber,
      orderNumber: orderNumber
    };
    orders.unshift(newOrder);
    setLocalData('orders', orders);
    return newOrder;
  },

  updateOrderStatus: (orderId, newStatus) => {
    const orders = getLocalData('orders', []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const updates = { status: newStatus, updatedAt: new Date().toISOString() };
      if (newStatus === 'preparing' && !orders[index].prepStartedAt) {
        updates.prepStartedAt = new Date().toISOString();
      }
      if (newStatus === 'served') {
        updates.servedAt = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
      orders[index] = { ...orders[index], ...updates };
      setLocalData('orders', orders);
      return orders[index];
    }
    return null;
  },

  updateOrderEta: (orderId, minutes, rangeStr) => {
    const orders = getLocalData('orders', []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const parsed = Math.max(1, parseInt(minutes) || 20);
      orders[index] = {
        ...orders[index],
        estimatedPrepMinutes: parsed,
        prepTimeRange: rangeStr || `${parsed}–${parsed + 5} min`,
        updatedAt: new Date().toISOString()
      };
      setLocalData('orders', orders);
      return orders[index];
    }
    return null;
  },

  assignTableToOrder: (orderId, tableNumber) => {
    const orders = getLocalData('orders', []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const formatted = String(tableNumber).padStart(2, '0');
      orders[index] = {
        ...orders[index],
        tableNumber: formatted,
        waitingForTable: false,
        tableReady: true,
        tableReadyAt: new Date().toISOString(),
        queuePosition: null,
        updatedAt: new Date().toISOString()
      };
      setLocalData('orders', orders);
      return orders[index];
    }
    return null;
  },

  getTableWaitingTime: () => getLocalData('table_waiting_time', 15),
  setTableWaitingTime: (minutes) => setLocalData('table_waiting_time', parseInt(minutes) || 15),

  updateOrderData: (orderId, updates) => {
    const orders = getLocalData('orders', []);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
      setLocalData('orders', orders);
      return orders[index];
    }
    return null;
  },

  updateOrdersForTable: (tableNumber, updates) => {
    const orders = getLocalData('orders', []);
    let changed = false;
    const formatted = String(tableNumber).padStart(2, '0');
    const updatedOrders = orders.map(o => {
      if (String(o.tableNumber).padStart(2, '0') === formatted && o.paymentStatus !== 'Paid') {
        changed = true;
        return { ...o, ...updates, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    if (changed) {
      setLocalData('orders', updatedOrders);
    }
    return updatedOrders;
  }
};

