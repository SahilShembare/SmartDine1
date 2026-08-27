import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_TABLES, DEMO_ORDERS } from '../../firebase/seed-data.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEMO-KEY-SMART-DINE-2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "smart-dine-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "smart-dine-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "smart-dine-app.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:android:abcdef123456"
};

export const isFirebaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY && 
  !process.env.EXPO_PUBLIC_FIREBASE_API_KEY.includes('your_api_key')
);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Mobile local store helpers
export const mobileStore = {
  getInitialCategories: () => DEMO_CATEGORIES,
  getInitialMenuItems: () => DEMO_MENU_ITEMS,
  getInitialTables: () => DEMO_TABLES,
  getInitialOrders: () => DEMO_ORDERS
};
