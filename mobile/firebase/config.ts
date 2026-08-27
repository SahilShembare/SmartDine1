import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_TABLES, DEMO_ORDERS } from '../../firebase/seed-data.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDjpryj-feHO_SiyCJXHTlEZcUV-nibyfA",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "smartdine1-81c82.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "smartdine1-81c82",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "smartdine1-81c82.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "732105111093",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:732105111093:web:1018e79194d3f0faa7637c"
};

export const isFirebaseConfigured = true;

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
