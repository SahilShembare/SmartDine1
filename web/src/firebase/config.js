import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_TABLES, DEMO_ORDERS } from '../../../firebase/seed-data.js';

// Firebase configuration from environment or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDEMO-KEY-SMART-DINE-2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-dine-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-dine-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-dine-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('your_api_key')
);

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

// In-Memory & LocalStorage Real-time Store
export const localStore = {
  getCategories: () => getLocalData('categories', DEMO_CATEGORIES),
  saveCategories: (categories) => setLocalData('categories', categories),
  
  getMenuItems: () => getLocalData('menuItems', DEMO_MENU_ITEMS),
  saveMenuItems: (items) => setLocalData('menuItems', items),
  
  getTables: () => getLocalData('tables', DEMO_TABLES),
  saveTables: (tables) => setLocalData('tables', tables),
  
  getOrders: () => getLocalData('orders', DEMO_ORDERS),
  saveOrders: (orders) => setLocalData('orders', orders),

  resetToDemoData: () => {
    setLocalData('categories', DEMO_CATEGORIES);
    setLocalData('menuItems', DEMO_MENU_ITEMS);
    setLocalData('tables', DEMO_TABLES);
    setLocalData('orders', DEMO_ORDERS);
  },

  addOrder: (orderData) => {
    const orders = getLocalData('orders', DEMO_ORDERS);
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      paymentStatus: 'pending',
      ...orderData
    };
    orders.unshift(newOrder);
    setLocalData('orders', orders);
    return newOrder;
  },

  updateOrderStatus: (orderId, newStatus) => {
    const orders = getLocalData('orders', DEMO_ORDERS);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = newStatus;
      orders[index].updatedAt = new Date().toISOString();
      setLocalData('orders', orders);
      return orders[index];
    }
    return null;
  }
};
