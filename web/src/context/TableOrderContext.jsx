import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, localStore, isFirebaseConfigured } from '../firebase/config';
import { DEMO_TABLES } from '../firebase/seed-data.js';
import { collection, addDoc, setDoc, onSnapshot, query, orderBy, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getNextOrderNumber, getNextInvoiceNumber, getOrAssignInvoiceNumber, formatOrderNumber, formatInvoiceNumber } from '../utils/orderNumber';

const TableOrderContext = createContext();

export const isRealOrder = (order) => {
  if (!order) return false;
  if (order.isDemo === true || order.demo === true || order.is_demo === true) return false;
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) return false;
  
  const idStr = String(order.id || order.orderNumber || '').trim();
  const lowerId = idStr.toLowerCase();
  if (lowerId.includes('demo') || lowerId.includes('sample') || lowerId.includes('mock') || lowerId.includes('seed')) return false;

  const DEMO_IDS = new Set([
    'ORD-1048', 'ORD-1047', 'ORD-1046', 'ORD-1045', 'ORD-1044', 'ORD-1043', 
    'ORD-9821', 'ORD-9822', 'ORD-9823', '1048', '1047', '1046', '1045', '1044', '1043'
  ]);
  if (DEMO_IDS.has(idStr) || DEMO_IDS.has(String(order.orderNumber || '')) || DEMO_IDS.has(String(order.id || ''))) {
    return false;
  }

  const name = String(order.customerName || '').trim().toLowerCase();
  const DEMO_NAMES = new Set([
    'vip diner', 'rahul sharma (customer)', 'guest (table 01)', 
    'demo user', 'test user', 'demo guest', 'sample user', 'test diner'
  ]);
  if (DEMO_NAMES.has(name) || name.includes('demo') || name.includes('sample customer') || name.includes('test user')) {
    return false;
  }

  // Must have a real table or valid waiting/takeaway session
  const table = String(order.tableNumber || '').trim();
  if (!table || table === 'undefined' || table === 'null') return false;

  return true;
};

export const isOrderToday = (order) => {
  if (!order) return false;
  const rawDate = order.createdAt || order.prepStartedAt || order.paidAt || order.updatedAt;
  if (!rawDate) return false;
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
};

export const CLEAN_INITIAL_ORDERS = [];

export function TableOrderProvider({ children }) {
  // Table session
  const [currentTable, setCurrentTable] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tableFromUrl = urlParams.get('table');
      if (tableFromUrl) {
        localStorage.setItem('smartdine_active_table', tableFromUrl);
        return tableFromUrl;
      }
      return localStorage.getItem('smartdine_active_table') || null;
    } catch {
      return null;
    }
  });

  // Cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders and Menu real-time data
  const [menuItems, setMenuItems] = useState(() => localStore.getMenuItems());
  const [categories, setCategories] = useState(() => localStore.getCategories());
  const [tables, setTables] = useState(() => {
    const raw = localStore.getTables();
    const seen = new Set();
    const unique = [];
    for (const t of (raw || [])) {
      const num = String(t.tableNumber || '').trim().padStart(2, '0');
      if (num && !seen.has(num)) {
        seen.add(num);
        unique.push({ ...t, tableNumber: num });
      }
    }
    return unique;
  });
  
  const [orders, setOrders] = useState(() => {
    try {
      const existing = localStore.getOrders();
      const realOrders = Array.isArray(existing) ? existing.filter(isRealOrder) : [];
      localStore.saveOrders(realOrders);
      return realOrders;
    } catch {
      return [];
    }
  });

  const [latestPlacedOrderId, setLatestPlacedOrderId] = useState(() => {
    return localStorage.getItem('smartdine_last_order_id') || null;
  });

  // Initial Verified Guest Feedbacks for Admin Telemetry
  const DEFAULT_INITIAL_FEEDBACKS = [
    {
      id: 'fb-101',
      orderId: 'ORD-9855',
      customerName: 'Sahil Shembare',
      tableNumber: '06',
      overallRating: 5,
      itemRatings: { 'Dal Makhani': 5 },
      selectedTags: ['😋 Taste', '🍽️ Food Quality', '⚡ Fast Service'],
      writtenText: 'Exceptional Dal Makhani! Creamy, rich aroma and arrived hot in under 15 minutes. Best in town.',
      aiAnalysis: { sentiment: 'delighted', satisfactionScore: 98, keywords: ['creamy', 'hot', 'fast service'] },
      date: 'Today, 3:55 PM',
      restaurantResponse: 'Thank you Sahil! Delighted to know you enjoyed our signature Dal Makhani. Looking forward to serving you again!'
    },
    {
      id: 'fb-102',
      orderId: 'ORD-9842',
      customerName: 'Priya Sharma',
      tableNumber: '03',
      overallRating: 5,
      itemRatings: { 'Paneer Butter Masala': 5, 'Butter Naan': 5 },
      selectedTags: ['🍽️ Food Quality', '🧼 Cleanliness', '🧑🍳 Staff'],
      writtenText: 'The ambiance and food were top notch. The digital QR ordering made everything effortless and quick!',
      aiAnalysis: { sentiment: 'delighted', satisfactionScore: 96, keywords: ['ambiance', 'digital qr', 'top notch'] },
      date: 'Today, 2:15 PM',
      restaurantResponse: 'Thank you Priya! We are so glad our digital ordering and dining atmosphere made your visit special.'
    },
    {
      id: 'fb-103',
      orderId: 'ORD-9820',
      customerName: 'Rohit Kulkarni',
      tableNumber: '08',
      overallRating: 4,
      itemRatings: { 'Veg Biryani': 4, 'Gulab Jamun': 5 },
      selectedTags: ['😋 Taste', '💰 Value for Money'],
      writtenText: 'Biryani portion size was generous and fragrant. Gulab Jamun was melting in mouth. Slightly busy during rush hour.',
      aiAnalysis: { sentiment: 'satisfied', satisfactionScore: 85, keywords: ['fragrant', 'generous portion', 'delicious'] },
      date: 'Yesterday, 8:40 PM',
      restaurantResponse: 'Thank you Rohit! We are expanding floor captain coverage during peak hours to serve you even faster.'
    },
    {
      id: 'fb-104',
      orderId: 'ORD-9795',
      customerName: 'Ananya Iyer',
      tableNumber: '02',
      overallRating: 5,
      itemRatings: { 'Crispy Corn': 5, 'Virgin Mojito': 5 },
      selectedTags: ['⚡ Fast Service', '📱 Ordering Experience'],
      writtenText: 'Super convenient online UPI payment directly from table! No need to wait for paper bill at counter.',
      aiAnalysis: { sentiment: 'delighted', satisfactionScore: 97, keywords: ['convenient', 'online upi', 'seamless'] },
      date: '20 Sep 2026, 7:30 PM',
      restaurantResponse: 'Thank you Ananya! Contactless table checkout was designed for this exact ease.'
    }
  ];

  // Customer Feedbacks (Only real submitted feedbacks + localStorage + seed)
  const [customerFeedbacks, setCustomerFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_customer_feedbacks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_INITIAL_FEEDBACKS;
  });

  // Save feedbacks and broadcast live update across tabs, windows & devices
  useEffect(() => {
    localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(customerFeedbacks));
    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'customerFeedbacks', data: customerFeedbacks } 
    }));
  }, [customerFeedbacks]);

  // BroadcastChannel for instant 0ms cross-tab feedback synchronization
  useEffect(() => {
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('smartdine_feedback_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'FEEDBACK_SYNC' && Array.isArray(event.data.feedbacks)) {
            setCustomerFeedbacks(event.data.feedbacks);
          }
        };
      }
    } catch {}

    return () => {
      if (channel) {
        try { channel.close(); } catch {}
      }
    };
  }, []);

  // Live Waiter Calls (Real-time synced across tabs & devices)
  const [waiterCalls, setWaiterCalls] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_waiter_calls');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // BroadcastChannel for instant 0ms cross-tab waiter calls synchronization
  useEffect(() => {
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('smartdine_waiter_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'WAITER_CALLS_SYNC' && Array.isArray(event.data.calls)) {
            setWaiterCalls(event.data.calls);
            try { localStorage.setItem('smartdine_waiter_calls', JSON.stringify(event.data.calls)); } catch {}
          }
        };
      }
    } catch {}

    return () => {
      if (channel) {
        try { channel.close(); } catch {}
      }
    };
  }, []);

  // Continuous REST API poller for cross-device & network synchronization (every 2 seconds)
  useEffect(() => {
    let isMounted = true;
    const fetchLatestWaiterCalls = async () => {
      try {
        const res = await fetch('/api/waiter-calls');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.calls)) {
            setWaiterCalls(prev => {
              const prevStr = JSON.stringify(prev);
              const map = new Map();
              data.calls.forEach(c => map.set(String(c.id), c));
              // Also keep any local calls that haven't reached server yet
              prev.forEach(c => {
                if (!map.has(String(c.id))) map.set(String(c.id), c);
              });
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              if (JSON.stringify(merged) !== prevStr) {
                try { localStorage.setItem('smartdine_waiter_calls', JSON.stringify(merged)); } catch {}
                return merged;
              }
              return prev;
            });
          }
        }
      } catch {}
    };

    fetchLatestWaiterCalls();
    const interval = setInterval(fetchLatestWaiterCalls, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Save waiter calls and dispatch cross-tab update
  useEffect(() => {
    try {
      localStorage.setItem('smartdine_waiter_calls', JSON.stringify(waiterCalls));
      localStorage.setItem('smartdine_waiter_ping', String(Date.now()));
    } catch {}
    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'waiter_calls', data: waiterCalls } 
    }));
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('smartdine_waiter_channel');
        bc.postMessage({ type: 'WAITER_CALLS_SYNC', calls: waiterCalls });
        bc.close();
      }
    } catch {}
  }, [waiterCalls]);

  // Sync listener across tabs & windows
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.key === 'smartdine_waiter_calls' || e.key === 'smartdine_waiter_ping') {
        try {
          const raw = localStorage.getItem('smartdine_waiter_calls');
          if (raw) {
            const fresh = JSON.parse(raw);
            if (Array.isArray(fresh)) setWaiterCalls(fresh);
          }
        } catch {}
      }
      if (e.key === 'smartdine_customer_feedbacks' || e.key === 'smartdine_feedback_ping') {
        try {
          const raw = localStorage.getItem('smartdine_customer_feedbacks');
          if (raw) {
            const fresh = JSON.parse(raw);
            if (Array.isArray(fresh) && fresh.length > 0) setCustomerFeedbacks(fresh);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // Submit Feedback Handler (Real-Time Cloud + Broadcast Sync)
  const submitOrderFeedback = async (feedbackData) => {
    let resolvedGuestName = feedbackData.customerName || feedbackData.guestName;
    if (!resolvedGuestName) {
      try {
        resolvedGuestName = localStorage.getItem('smartdine_guest_name');
      } catch {}
    }
    if (!resolvedGuestName) {
      resolvedGuestName = `Table ${feedbackData.tableNumber || currentTable || '01'} Guest`;
    }

    const newFeedback = {
      id: `fb-${Date.now()}`,
      orderId: feedbackData.orderId,
      customerName: resolvedGuestName,
      tableNumber: feedbackData.tableNumber || currentTable || '01',
      overallRating: feedbackData.overallRating || 5,
      itemRatings: feedbackData.itemRatings || {},
      selectedTags: feedbackData.selectedTags || [],
      writtenText: feedbackData.writtenText || '',
      aiAnalysis: feedbackData.aiAnalysis || null,
      date: feedbackData.date || new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      restaurantResponse: feedbackData.restaurantResponse || 'Thank you for your valuable feedback! Our head chef and floor team appreciate your support.'
    };

    // 1. Immediate UI update (0ms latency, optimistic)
    let updatedList;
    setCustomerFeedbacks(prev => {
      updatedList = [newFeedback, ...prev.filter(fb => fb.id !== newFeedback.id)];
      return updatedList;
    });

    // 2. Instant 0ms Cross-Tab & Cross-Device Live Broadcast
    try {
      if (typeof window !== 'undefined') {
        const currentSaved = localStorage.getItem('smartdine_customer_feedbacks');
        const existingList = currentSaved ? JSON.parse(currentSaved) : [];
        const fullList = [newFeedback, ...(Array.isArray(existingList) ? existingList.filter(fb => fb.id !== newFeedback.id) : [])];
        localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(fullList));
        localStorage.setItem('smartdine_feedback_ping', Date.now().toString());
        if ('BroadcastChannel' in window) {
          const ch = new BroadcastChannel('smartdine_feedback_channel');
          ch.postMessage({ type: 'FEEDBACK_SYNC', feedbacks: fullList, newFeedback });
          setTimeout(() => ch.close(), 100);
        }
        window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
          detail: { collection: 'customerFeedbacks', data: fullList, newFeedback } 
        }));
      }
    } catch {}

    // 3. Background Firestore sync (with timeout so it NEVER blocks UI)
    if (isFirebaseConfigured) {
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore feedback sync timeout')), 3500)
          );
          await Promise.race([
            setDoc(doc(db, 'feedbacks', newFeedback.id), newFeedback),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Background Firestore setDoc feedback error / timeout:', err);
        }
      })();
    }

    return newFeedback;
  };

  // Delete Feedback Handler
  const deleteCustomerFeedback = async (feedbackId) => {
    // 1. Delete from Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'feedbacks', feedbackId));
      } catch (err) {
        console.warn('Firestore deleteDoc feedback error (using local):', err);
      }
    }

    setCustomerFeedbacks(prev => {
      const filtered = prev.filter(fb => fb.id !== feedbackId && fb.firestoreDocId !== feedbackId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(filtered));
          localStorage.setItem('smartdine_feedback_ping', Date.now().toString());
          if ('BroadcastChannel' in window) {
            const ch = new BroadcastChannel('smartdine_feedback_channel');
            ch.postMessage({ type: 'FEEDBACK_SYNC', feedbacks: filtered });
            setTimeout(() => ch.close(), 100);
          }
          window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
            detail: { collection: 'customerFeedbacks', data: filtered } 
          }));
        }
      } catch {}
      return filtered;
    });
  };

  // Reply to Customer Feedback
  const replyToCustomerFeedback = async (feedbackId, responseText) => {
    // 1. Update in Firestore if configured
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'feedbacks', feedbackId), { 
          restaurantResponse: responseText,
          respondedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firestore updateDoc feedback reply error (using local):', err);
      }
    }

    setCustomerFeedbacks(prev => {
      const updated = prev.map(fb => 
        (fb.id === feedbackId || fb.firestoreDocId === feedbackId) ? { ...fb, restaurantResponse: responseText } : fb
      );
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(updated));
          localStorage.setItem('smartdine_feedback_ping', Date.now().toString());
          if ('BroadcastChannel' in window) {
            const ch = new BroadcastChannel('smartdine_feedback_channel');
            ch.postMessage({ type: 'FEEDBACK_SYNC', feedbacks: updated });
            setTimeout(() => ch.close(), 100);
          }
          window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
            detail: { collection: 'customerFeedbacks', data: updated } 
          }));
        }
      } catch {}
      return updated;
    });
  };

  // Force-refresh feedbacks from persistence
  const refreshFeedbacks = () => {
    try {
      const saved = localStorage.getItem('smartdine_customer_feedbacks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomerFeedbacks(parsed);
          return parsed;
        }
      }
    } catch {}
    return customerFeedbacks;
  };

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('smartdine_cart', JSON.stringify(cart));
  }, [cart]);

  // Last Sync timestamp
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());

  // Guaranteed Live Auto-Sync Engine (Gentle 60s backup + window visibility trigger to protect network performance)
  useEffect(() => {
    const syncAllData = async () => {
      try {
        if (isFirebaseConfigured) {
          // Sync Orders
          const ordQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          const ordSnap = await getDocs(ordQuery);
          if (!ordSnap.empty) {
            const ords = ordSnap.docs.map(doc => {
              const data = doc.data();
              const cleanOrderNum = data.orderNumber || data.id || formatOrderNumber(doc.id);
              return {
                ...data,
                id: cleanOrderNum,
                firestoreDocId: doc.id,
                orderNumber: cleanOrderNum
              };
            }).filter(isRealOrder);
            setOrders(ords);
          }
          if (isFirebaseConfigured) {
            try {
              const fbQuery = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
              const fbSnap = await getDocs(fbQuery);
              if (!fbSnap.empty) {
                const fbs = fbSnap.docs.map(doc => ({ id: doc.id, firestoreDocId: doc.id, ...doc.data() }));
                setCustomerFeedbacks(fbs);
                localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(fbs));
              }
            } catch {}
          }
        } else {
          setOrders(localStore.getOrders().filter(isRealOrder));
          setMenuItems(localStore.getMenuItems());
          setCategories(localStore.getCategories());
          setTables(localStore.getTables());
          try {
            const saved = localStorage.getItem('smartdine_customer_feedbacks');
            if (saved) {
              const fresh = JSON.parse(saved);
              if (Array.isArray(fresh) && fresh.length > 0) setCustomerFeedbacks(fresh);
            }
          } catch {}
        }
        const now = new Date().toLocaleTimeString();
        setLastSyncTime(now);
        window.dispatchEvent(new CustomEvent('smartdine_sync_tick', { detail: { time: now } }));
      } catch (err) {
        console.warn('Sync tick error:', err);
      }
    };

    // Run initial sync on mount
    syncAllData();

    // Sync when tab becomes visible (user focuses the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAllData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Gentle 60s backup interval (real-time listeners handle instant updates)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAllData();
      }
    }, 60000);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Real-time synchronization listeners
  useEffect(() => {
    if (isFirebaseConfigured) {
      // Menu items listener
      const unsubMenu = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
        if (!snapshot.empty) {
          const firestoreItems = snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: data.id || doc.id, firestoreDocId: doc.id, ...data };
          });
          const localItems = localStore.getMenuItems() || [];
          const itemMap = new Map();
          firestoreItems.forEach(item => itemMap.set(String(item.id), item));
          localItems.forEach(item => {
            if (item && item.id && !itemMap.has(String(item.id))) {
              itemMap.set(String(item.id), item);
            }
          });
          const merged = Array.from(itemMap.values());
          setMenuItems(merged);
          localStore.saveMenuItems(merged);
        } else {
          const localItems = localStore.getMenuItems();
          if (localItems && localItems.length > 0) {
            setMenuItems(localItems);
          }
        }
      }, (err) => {
        console.warn('Firestore menu items listener error, using localStore:', err);
        setMenuItems(localStore.getMenuItems());
      });

      // Categories listener
      const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        if (!snapshot.empty) {
          const firestoreCats = snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: data.id || doc.id, firestoreDocId: doc.id, ...data };
          });
          const localCats = localStore.getCategories() || [];
          const catMap = new Map();
          firestoreCats.forEach(cat => catMap.set(String(cat.id), cat));
          localCats.forEach(cat => {
            if (cat && cat.id && !catMap.has(String(cat.id))) {
              catMap.set(String(cat.id), cat);
            }
          });
          const merged = Array.from(catMap.values());
          setCategories(merged);
          localStore.saveCategories(merged);
        } else {
          const localCats = localStore.getCategories();
          if (localCats && localCats.length > 0) {
            setCategories(localCats);
          }
        }
      }, (err) => {
        console.warn('Firestore categories listener error, using localStore:', err);
        setCategories(localStore.getCategories());
      });

      // Tables listener
      const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
        if (!snapshot.empty) {
          const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const seen = new Set();
          const tbls = [];
          for (const t of raw) {
            const num = String(t.tableNumber || '').trim().padStart(2, '0');
            if (num && !seen.has(num)) {
              seen.add(num);
              tbls.push({ ...t, tableNumber: num });
            }
          }
          tbls.sort((a, b) => parseInt(a.tableNumber || 0, 10) - parseInt(b.tableNumber || 0, 10));
          setTables(tbls);
          localStore.saveTables(tbls);
        } else {
          // If Firestore is empty, maintain existing local tables without resurrecting demo tables
          const localTbls = localStore.getTables();
          if (localTbls) {
            setTables(localTbls);
          }
        }
      }, (err) => {
        console.warn('Firestore tables listener error (using local tables):', err);
        const localTbls = localStore.getTables();
        if (localTbls) setTables(localTbls);
      });

      // Orders listener
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const ords = snapshot.docs.map(doc => {
            const data = doc.data();
            const cleanOrderNum = data.orderNumber || data.id || formatOrderNumber(doc.id);
            return {
              ...data,
              id: cleanOrderNum,
              firestoreDocId: doc.id,
              orderNumber: cleanOrderNum
            };
          }).filter(isRealOrder);
          setOrders(ords);
        }
      }, (err) => {
        console.warn('Firestore orders listener error, falling back to local store:', err);
        setOrders(localStore.getOrders().filter(isRealOrder));
      });

        // Feedbacks listener (Cloud Firestore real-time sync across devices)
        let unsubFeedbacks = () => {};
        try {
          const qFb = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
          unsubFeedbacks = onSnapshot(qFb, (snapshot) => {
            if (!snapshot.empty) {
              const firestoreFbs = snapshot.docs.map(doc => ({ id: doc.id, firestoreDocId: doc.id, ...doc.data() }));
              const localSaved = localStorage.getItem('smartdine_customer_feedbacks');
              const localFbs = localSaved ? JSON.parse(localSaved) : [];
              const fbMap = new Map();
              firestoreFbs.forEach(f => fbMap.set(String(f.id), f));
              (Array.isArray(localFbs) ? localFbs : []).forEach(f => {
                if (f && f.id && !fbMap.has(String(f.id))) fbMap.set(String(f.id), f);
              });
              const merged = Array.from(fbMap.values());
              setCustomerFeedbacks(merged);
              localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(merged));
            }
          }, (err) => {
            console.warn('Firestore feedbacks listener error (falling back to local sync):', err);
          });
        } catch {}

        // Waiter Calls listener (Cloud Firestore real-time sync across devices)
        let unsubWaiterCalls = () => {};
        try {
          const qWc = query(collection(db, 'waiter_calls'), orderBy('createdAt', 'desc'));
          unsubWaiterCalls = onSnapshot(qWc, (snapshot) => {
            if (!snapshot.empty) {
              const firestoreCalls = snapshot.docs.map(doc => ({ id: doc.id, firestoreDocId: doc.id, ...doc.data() }));
              const localSaved = localStorage.getItem('smartdine_waiter_calls');
              const localCalls = localSaved ? JSON.parse(localSaved) : [];
              const callMap = new Map();
              firestoreCalls.forEach(c => callMap.set(String(c.id), c));
              (Array.isArray(localCalls) ? localCalls : []).forEach(c => {
                if (c && c.id && !callMap.has(String(c.id))) callMap.set(String(c.id), c);
              });
              const merged = Array.from(callMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              setWaiterCalls(merged);
              localStorage.setItem('smartdine_waiter_calls', JSON.stringify(merged));
            }
          }, (err) => {
            console.warn('Firestore waiter_calls listener error (falling back to local sync):', err);
          });
        } catch (e) {
          console.warn('Firestore waiter_calls setup error:', e);
        }

        // Always listen to cross-tab local updates and storage events so all tabs sync in 0ms
        const handleLocalUpdate = (e) => {
          if (e.detail?.collection === 'orders') {
            const fresh = (e.detail.data || []).filter(isRealOrder);
            setOrders(prev => {
              const map = new Map();
              fresh.forEach(o => map.set(String(o.id), o));
              prev.forEach(o => {
                if (!map.has(String(o.id))) map.set(String(o.id), o);
              });
              return Array.from(map.values());
            });
          }
          if (e.detail?.collection === 'menuItems') setMenuItems(e.detail.data);
          if (e.detail?.collection === 'categories') setCategories(e.detail.data);
          if (e.detail?.collection === 'tables') setTables(e.detail.data);
          if (e.detail?.collection === 'customerFeedbacks' && Array.isArray(e.detail.data)) {
            setCustomerFeedbacks(e.detail.data);
          }
          if (e.detail?.collection === 'waiter_calls' && Array.isArray(e.detail.data)) {
            setWaiterCalls(e.detail.data);
          }
        };

        const handleStorageEvent = (e) => {
          if (e.key === 'smartdine_orders' || e.key === 'smartdine_order_sync_ping') {
            const fresh = localStore.getOrders().filter(isRealOrder);
            setOrders(prev => {
              const map = new Map();
              fresh.forEach(o => map.set(String(o.id), o));
              prev.forEach(o => {
                if (!map.has(String(o.id))) map.set(String(o.id), o);
              });
              return Array.from(map.values());
            });
          }
          if (e.key === 'smartdine_menuItems') {
            try {
              const fresh = localStore.getMenuItems();
              if (Array.isArray(fresh) && fresh.length > 0) setMenuItems(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_categories') {
            try {
              const fresh = localStore.getCategories();
              if (Array.isArray(fresh) && fresh.length > 0) setCategories(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_customer_feedbacks' || e.key === 'smartdine_feedback_ping') {
            try {
              const fresh = JSON.parse(localStorage.getItem('smartdine_customer_feedbacks') || '[]');
              if (Array.isArray(fresh) && fresh.length > 0) setCustomerFeedbacks(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_waiter_calls') {
            try {
              const fresh = JSON.parse(localStorage.getItem('smartdine_waiter_calls') || '[]');
              if (Array.isArray(fresh) && fresh.length > 0) setWaiterCalls(fresh);
            } catch {}
          }
        };

        window.addEventListener('smartdine_db_update', handleLocalUpdate);
        window.addEventListener('storage', handleStorageEvent);

        return () => {
          unsubMenu();
          unsubCategories();
          unsubTables();
          unsubOrders();
          unsubFeedbacks();
          unsubWaiterCalls();
          window.removeEventListener('smartdine_db_update', handleLocalUpdate);
          window.removeEventListener('storage', handleStorageEvent);
        };
      } else {
        // Listen to cross-tab local updates when Firebase is not configured
        const handleLocalUpdate = (e) => {
          if (e.detail?.collection === 'orders') setOrders((e.detail.data || []).filter(isRealOrder));
          if (e.detail?.collection === 'menuItems') setMenuItems(e.detail.data);
          if (e.detail?.collection === 'categories') setCategories(e.detail.data);
          if (e.detail?.collection === 'tables') setTables(e.detail.data);
          if (e.detail?.collection === 'customerFeedbacks' && Array.isArray(e.detail.data)) {
            setCustomerFeedbacks(e.detail.data);
          }
          if (e.detail?.collection === 'waiter_calls' && Array.isArray(e.detail.data)) {
            setWaiterCalls(e.detail.data);
          }
        };
        const handleStorageEvent = (e) => {
          if (e.key === 'smartdine_orders' || e.key === 'smartdine_order_sync_ping') {
            setOrders(localStore.getOrders().filter(isRealOrder));
          }
          if (e.key === 'smartdine_menuItems') {
            try {
              const fresh = localStore.getMenuItems();
              if (Array.isArray(fresh) && fresh.length > 0) setMenuItems(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_categories') {
            try {
              const fresh = localStore.getCategories();
              if (Array.isArray(fresh) && fresh.length > 0) setCategories(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_customer_feedbacks' || e.key === 'smartdine_feedback_ping') {
            try {
              const fresh = JSON.parse(localStorage.getItem('smartdine_customer_feedbacks') || '[]');
              if (Array.isArray(fresh) && fresh.length > 0) setCustomerFeedbacks(fresh);
            } catch {}
          }
          if (e.key === 'smartdine_waiter_calls') {
            try {
              const fresh = JSON.parse(localStorage.getItem('smartdine_waiter_calls') || '[]');
              if (Array.isArray(fresh) && fresh.length > 0) setWaiterCalls(fresh);
            } catch {}
          }
        };
        window.addEventListener('smartdine_db_update', handleLocalUpdate);
        window.addEventListener('storage', handleStorageEvent);
        return () => {
          window.removeEventListener('smartdine_db_update', handleLocalUpdate);
          window.removeEventListener('storage', handleStorageEvent);
        };
      }
  }, []);

  const setTableSession = (tableNum) => {
    // Format to 2-digits if single digit e.g. "1" -> "01"
    const formatted = tableNum ? String(tableNum).padStart(2, '0') : null;
    setCurrentTable(formatted);
    if (formatted) {
      localStorage.setItem('smartdine_active_table', formatted);
    } else {
      localStorage.removeItem('smartdine_active_table');
    }
  };

  const clearTableSession = () => {
    setCurrentTable(null);
    localStorage.removeItem('smartdine_active_table');
  };

  const addToCart = (item, quantity = 1, specialInstructions = '') => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (specialInstructions) {
          updated[existingIndex].instructions = specialInstructions;
        }
        return updated;
      } else {
        return [...prev, {
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          quantity: quantity,
          instructions: specialInstructions
        }];
      }
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('smartdine_cart');
  };

  // Sync cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('smartdine_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if an order has already been paid / cleared (defined before placeOrder)
  const isOrderPaid = (order) => {
    if (!order) return false;
    if (order.isPaid === true) return true;

    // 1. Any order with a real Razorpay payment ID (pay_...) is 100% captured online and verified paid
    const txn = String(order.transactionId || order.razorpay_payment_id || order.paymentId || '').trim();
    if (txn && txn.startsWith('pay_')) {
      return true;
    }
    if (txn && txn.startsWith('TXN-') && !txn.includes('COUNTER') && !txn.includes('PENDING')) {
      return true;
    }

    const pStatus = String(order.paymentStatus || order.payment_status || '').trim().toLowerCase();
    
    // Explicitly paid states
    if (
      pStatus === 'paid' || 
      pStatus === 'cash paid' || 
      pStatus === 'online paid' || 
      pStatus === 'settled' || 
      pStatus === 'completed' ||
      pStatus.includes('verified')
    ) {
      if (!pStatus.includes('unpaid') && !pStatus.includes('not paid') && !pStatus.includes('cash payment requested')) {
        return true;
      }
    }

    // Order has paidAt and real verified transaction ID (not pending/counter placeholder)
    if ((order.paidAt || order.paid_at) && txn && !txn.startsWith('PENDING') && !txn.startsWith('COUNTER')) {
      return true;
    }

    // Explicitly un-paid or pending collection states
    if (
      !pStatus ||
      pStatus === 'unpaid' || 
      pStatus === 'pending' || 
      pStatus.includes('requested') || 
      pStatus.includes('awaiting')
    ) {
      return false;
    }

    return false;
  };

  // Place order with table availability check and dynamic preparation ETA
  // Place order with table availability check and dynamic preparation ETA
  const placeOrder = async ({ 
    customerName, 
    customerPhone, 
    customerId = null, 
    notes = '', 
    paymentMethod = 'CASH / COUNTER',
    paymentStatus = 'PENDING',
    paymentGateway = null,
    payment_gateway = null,
    razorpay_order_id = null,
    razorpay_payment_id = null,
    razorpay_signature = null,
    transactionId = null,
    paidAt = null,
    paid_at = null,
    isPaid = null,
    refund_status = 'NONE',
    discountAmount = 0,
    couponCode = null,
    total = null,
    waitingForTable = false,
    prepStartedAt = null
  }) => {
    if (cart.length === 0) throw new Error('Cart is empty');
    
    // Check available tables
    const allTables = tables && tables.length > 0 ? tables : localStore.getTables();
    const availableTables = allTables.filter(t => t.active !== false);
    const occupiedTableNumbers = new Set(
      orders
        .filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !isOrderPaid(o))
        .map(o => String(o.tableNumber).padStart(2, '0'))
    );

    let isWaiting = Boolean(waitingForTable);
    let effectiveTable = currentTable || localStorage.getItem('smartdine_active_table');

    // If customer has not scanned or table is set to waiting
    if (!effectiveTable || effectiveTable === 'waiting' || isWaiting) {
      // Find first free table
      const freeTable = availableTables.find(t => !occupiedTableNumbers.has(String(t.tableNumber).padStart(2, '0')));
      if (freeTable && !isWaiting) {
        effectiveTable = String(freeTable.tableNumber).padStart(2, '0');
        setCurrentTable(effectiveTable);
        try { localStorage.setItem('smartdine_active_table', effectiveTable); } catch {}
      } else {
        isWaiting = true;
        effectiveTable = null;
      }
    } else {
      // Formatted active table
      effectiveTable = String(effectiveTable).padStart(2, '0');
    }

    // Active waiting queue calculation
    const activeWaitingOrders = orders.filter(o => o.waitingForTable && o.status !== 'completed' && o.status !== 'cancelled');
    const queuePos = isWaiting ? activeWaitingOrders.length + 1 : null;
    const waitingTimePerCustomer = localStore.getTableWaitingTime() || 15;
    const estimatedWaitingMinutes = isWaiting ? queuePos * waitingTimePerCustomer : null;

    // Dynamic initial preparation ETA: 20 min base, +2m per item over 3 items
    const estimatedPrepMinutes = Math.min(45, Math.max(15, 15 + Math.floor(cartItemCount * 2)));
    const prepTimeRange = `${estimatedPrepMinutes}–${estimatedPrepMinutes + 5} min`;
    const finalPrepStartedAt = prepStartedAt || new Date().toISOString();

    // Check if customer has genuine Razorpay payment or verified online proof
    const rzpId = razorpay_payment_id || (String(transactionId || '').startsWith('pay_') ? transactionId : null);
    const hasRazorpayProof = Boolean(rzpId) || String(transactionId || '').startsWith('pay_');
    const isExplicitlyPaid = isPaid === true || String(paymentStatus || '').toUpperCase() === 'PAID' || Boolean(paidAt || paid_at);

    // Check if customer explicitly chose Cash at Counter without paying online
    const mStr = String(paymentMethod || '').toLowerCase();
    const isCounterOrCash = !hasRazorpayProof && !isExplicitlyPaid && (
      mStr.includes('counter') || mStr.includes('cash') || mStr.includes('desk') || mStr === 'pay at counter'
    );

    const isOnlineMethod = hasRazorpayProof || (isExplicitlyPaid && !isCounterOrCash);

    const finalPaymentStatus = isOnlineMethod ? 'PAID' : 'PENDING';
    const finalPaymentMethod = isOnlineMethod
      ? (paymentMethod && !paymentMethod.toLowerCase().includes('counter') ? paymentMethod : 'Razorpay Online (UPI)')
      : 'Pay at Counter';
    const finalGateway = isOnlineMethod ? 'Razorpay' : 'None';
    const finalAmount = total !== null && total !== undefined ? Number(total) : cartTotal;
    const finalPaidAt = finalPaymentStatus === 'PAID' ? (paidAt || paid_at || new Date().toISOString()) : null;
    const finalTxnId = isOnlineMethod 
      ? (rzpId || transactionId || `TXN-${Date.now().toString().slice(-6)}`) 
      : (transactionId || `COUNTER-${Date.now().toString().slice(-6)}`);

    const allKnownOrders = (orders && orders.length > 0) ? orders : localStore.getOrders();
    const nextOrdNum = getNextOrderNumber(allKnownOrders);
    const assignedInvoiceNumber = finalPaymentStatus === 'PAID' ? getNextInvoiceNumber(allKnownOrders) : null;

    const orderData = {
      id: nextOrdNum,
      orderNumber: nextOrdNum,
      invoiceNumber: assignedInvoiceNumber,
      tableNumber: effectiveTable || 'Waiting for Table',
      customerName: customerName || (effectiveTable ? `Table ${effectiveTable} Guest` : `Waiting Guest #${queuePos}`),
      customerPhone: customerPhone || '',
      customerId: customerId,
      items: cart.map(item => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || '',
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        instructions: item.instructions || ''
      })),
      currency: 'INR',
      amount: finalAmount,
      subtotal: cartSubtotal,
      tax: cartTax,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode || null,
      total: finalAmount,
      notes: notes,
      status: 'pending',
      isPaid: finalPaymentStatus === 'PAID',
      paymentStatus: finalPaymentStatus,
      paymentMethod: finalPaymentMethod,
      paymentGateway: finalGateway,
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: rzpId || null,
      razorpay_signature: razorpay_signature || null,
      transactionId: finalTxnId,
      paidAt: finalPaidAt,
      refund_status: refund_status || 'NONE',
      prepStartedAt: finalPrepStartedAt,
      estimatedPrepMinutes,
      prepTimeRange,
      waitingForTable: isWaiting,
      queuePosition: queuePos,
      estimatedWaitingMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let orderId = nextOrdNum;

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        if (docRef?.id) {
          orderData.firestoreDocId = docRef.id;
        }
      } catch (err) {
        console.warn('Firebase addDoc order error, using local fallback:', err);
      }
    }
    const created = localStore.addOrder(orderData);
    orderId = created.id || nextOrdNum;

    // Immediately update local React state so this tab has the order right away
    setOrders(prev => {
      const filtered = prev.filter(o => String(o.id) !== String(created.id) && String(o.orderNumber) !== String(created.orderNumber));
      return [created, ...filtered];
    });

    // Notify other components & tabs immediately (e.g. Kitchen Dashboard)
    try {
      window.dispatchEvent(new CustomEvent('smartdine_db_update', { detail: { collection: 'orders', data: localStore.getOrders() } }));
      localStorage.setItem('smartdine_order_sync_ping', String(Date.now()));
    } catch {}

    setLatestPlacedOrderId(orderId);
    localStorage.setItem('smartdine_last_order_id', orderId);
    try {
      const raw = localStorage.getItem('smartdine_customer_order_ids');
      const ids = raw ? JSON.parse(raw) : [];
      if (!ids.includes(orderId)) {
        ids.unshift(orderId);
        localStorage.setItem('smartdine_customer_order_ids', JSON.stringify(ids));
      }
    } catch {}
    clearCart();
    return orderId;
  };

  // Get active UNPAID dining orders for a table (multiple orders in same session)
  const getTableActiveOrders = (tableNum = currentTable) => {
    if (!tableNum) return [];
    const formatted = String(tableNum).padStart(2, '0');
    return orders.filter(o => {
      const matchTable = String(o.tableNumber).padStart(2, '0') === formatted || 
                         String(o.tableNumber).toLowerCase() === String(tableNum).toLowerCase();
      return matchTable && isOrderToday(o) && !isOrderPaid(o) && o.status !== 'cancelled';
    });
  };

  // Get previously paid / cleared orders for this table session
  const getTablePaidOrders = (tableNum = currentTable) => {
    if (!tableNum) return [];
    const formatted = String(tableNum).padStart(2, '0');
    return orders.filter(o => {
      const matchTable = String(o.tableNumber).padStart(2, '0') === formatted || 
                         String(o.tableNumber).toLowerCase() === String(tableNum).toLowerCase();
      return matchTable && isOrderToday(o) && isOrderPaid(o) && o.status !== 'cancelled';
    });
  };

  // Consolidate all orders in the current dining session into ONE single final bill
  const getCombinedTableBill = (tableNum = currentTable, discountAmount = 0) => {
    const activeOrders = getTableActiveOrders(tableNum);
    const clearedOrders = getTablePaidOrders(tableNum);
    
    // Consolidate all ordered items across multiple UNPAID orders
    const itemMap = new Map();
    activeOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const key = item.itemId || item.name;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.quantity += (item.quantity || 1);
            existing.totalPrice += (item.price * (item.quantity || 1));
          } else {
            itemMap.set(key, {
              itemId: item.itemId || item.id,
              name: item.name,
              price: item.price,
              isVeg: item.isVeg !== false,
              quantity: item.quantity || 1,
              totalPrice: item.price * (item.quantity || 1),
              imageUrl: item.imageUrl || ''
            });
          }
        });
      }
    });

    const consolidatedItems = Array.from(itemMap.values());
    const subtotal = consolidatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(discountedSubtotal * 0.05 * 100) / 100; // 5% GST
    const total = Math.round((discountedSubtotal + tax) * 100) / 100;

    // Check overall table bill status
    const hasUnpaid = activeOrders.length > 0;
    const isPaid = activeOrders.length === 0 && clearedOrders.length > 0;
    const isCashRequested = activeOrders.some(o => 
      String(o.paymentStatus || '').toLowerCase().includes('cash') || 
      String(o.paymentMethod || '').toLowerCase().includes('cash') ||
      String(o.paymentMethod || '').toLowerCase().includes('counter')
    );
    const isBillRequested = activeOrders.some(o => 
      String(o.paymentStatus || '').toLowerCase().includes('requested')
    ) || isCashRequested;

    const totalClearedAmount = clearedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const existingTableInvoice = clearedOrders.find(o => o.invoiceNumber)?.invoiceNumber || 
      activeOrders.find(o => o.invoiceNumber)?.invoiceNumber || null;

    return {
      tableNumber: tableNum,
      activeOrders,
      clearedOrders,
      clearedOrderCount: clearedOrders.length,
      totalClearedAmount,
      orderCount: activeOrders.length,
      orderIds: activeOrders.map(o => o.orderNumber || o.id),
      invoiceNumber: existingTableInvoice,
      consolidatedItems,
      subtotal,
      discountAmount,
      tax,
      total,
      isPaid,
      hasUnpaid,
      billStatus: hasUnpaid 
        ? (isCashRequested ? 'Payment Pending at Counter' : isBillRequested ? 'Bill Requested' : 'Unpaid (Pay at Counter)')
        : (isPaid ? 'Paid' : 'No Active Orders')
    };
  };

  // Customer requests the final combined bill
  const requestTableBill = async (tableNum = currentTable) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    // 1. Update React state immediately
    setOrders(prev => prev.map(o => {
      if (String(o.tableNumber).padStart(2, '0') === formatted && !isOrderPaid(o)) {
        return {
          ...o,
          status: 'bill requested',
          paymentStatus: 'Bill Requested',
          billRequestedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    if (isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'orders'), 
          where('tableNumber', '==', formatted)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data();
          if (data.paymentStatus !== 'Paid') {
            await updateDoc(doc(db, 'orders', d.id), {
              status: 'bill requested',
              paymentStatus: 'Bill Requested',
              billRequestedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn('Firebase bill request warning:', err);
      }
    }

    try {
      localStore.updateOrdersForTable(formatted, {
        status: 'bill requested',
        paymentStatus: 'Bill Requested',
        billRequestedAt: new Date().toISOString()
      });
    } catch {}
  };

  // Pay Combined Table Bill (Online UPI / Card / NetBanking / Cash)
  const payTableBill = async (tableNum = currentTable, {
    paymentMethod = 'Online UPI (Verified)',
    transactionId = `TXN-${Date.now().toString().slice(-6)}`,
    discountAmount = 0,
    couponCode = null,
    invoiceNumber = null,
    orderId = null
  } = {}) => {
    const formatted = tableNum ? String(tableNum).padStart(2, '0') : null;
    const targetOrderIdStr = orderId ? String(orderId).trim() : null;

    const tableOrders = orders.filter(o => {
      const matchTable = formatted && String(o.tableNumber).padStart(2, '0') === formatted;
      const matchOrder = targetOrderIdStr && (
        String(o.id) === targetOrderIdStr || 
        String(o.orderNumber) === targetOrderIdStr || 
        (o.firestoreDocId && String(o.firestoreDocId) === targetOrderIdStr)
      );
      return (matchTable || matchOrder) && !isOrderPaid(o) && o.status !== 'cancelled';
    });

    const assignedInvoice = invoiceNumber || getOrAssignInvoiceNumber(tableOrders, orders);

    const paidPayload = {
      paymentStatus: 'Paid',
      payment_status: 'Paid',
      isPaid: true,
      paymentMethod: paymentMethod || 'Online UPI (Verified)',
      payment_method: paymentMethod || 'Online UPI (Verified)',
      transactionId,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode || null,
      invoiceNumber: assignedInvoice,
      paidAt: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update React state functionally
    let updatedOrdersList = [];
    setOrders(prev => {
      updatedOrdersList = prev.map(o => {
        const matchTable = formatted && String(o.tableNumber).padStart(2, '0') === formatted;
        const matchOrder = targetOrderIdStr && (
          String(o.id) === targetOrderIdStr || 
          String(o.orderNumber) === targetOrderIdStr || 
          (o.firestoreDocId && String(o.firestoreDocId) === targetOrderIdStr)
        );
        if ((matchTable || matchOrder) && o.status !== 'cancelled') {
          // IMPORTANT: DO NOT set status: 'completed' on bill payment!
          // Payment only settles the bill (paymentStatus: 'Paid', isPaid: true).
          // The order's cooking/kitchen lifecycle status (pending -> preparing -> ready -> served -> completed)
          // must ONLY be controlled and changed from the Kitchen Dashboard.
          let kitchenStatus = o.status || 'pending';
          if (kitchenStatus === 'bill requested' || kitchenStatus === 'Bill Requested') {
            kitchenStatus = o.servedAt ? 'served' : (o.prepStartedAt ? 'preparing' : 'pending');
          }

          return {
            ...o,
            ...paidPayload,
            isPaid: true,
            status: kitchenStatus
          };
        }
        return o;
      });
      return updatedOrdersList;
    });

    // 2. Cross-tab & localStore immediate sync
    try {
      if (formatted) {
        localStore.updateOrdersForTable(formatted, paidPayload);
      }
      if (targetOrderIdStr) {
        localStore.updateOrderData(targetOrderIdStr, paidPayload);
      }
      if (typeof window !== 'undefined') {
        const allFresh = updatedOrdersList && updatedOrdersList.length > 0 ? updatedOrdersList : localStore.getOrders();
        localStorage.setItem('smartdine_orders', JSON.stringify(allFresh));
        localStorage.setItem('smartdine_order_sync_ping', Date.now().toString());
        window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
          detail: { collection: 'orders', data: allFresh } 
        }));
      }
    } catch (e) {
      console.warn('payTableBill local sync error:', e);
    }

    // 3. Firestore persistence
    if (isFirebaseConfigured) {
      try {
        if (formatted) {
          const q = query(collection(db, 'orders'), where('tableNumber', '==', formatted));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            const data = d.data();
            if (data.paymentStatus !== 'Paid') {
              await updateDoc(doc(db, 'orders', d.id), paidPayload);
            }
          }
        }
        if (targetOrderIdStr) {
          await updateDoc(doc(db, 'orders', targetOrderIdStr), paidPayload).catch(() => {});
        }
      } catch (err) {
        console.warn('Firebase payTableBill error:', err);
      }
    }

    return {
      tableNumber: formatted,
      orderId: targetOrderIdStr,
      transactionId,
      invoiceNumber: assignedInvoice,
      paymentMethod,
      paidAt: paidPayload.paidAt,
      status: 'Paid',
      isPaid: true
    };
  };

  // Customer requests cash/counter payment (Admin / Cashier needs to collect at counter or table)
  const requestCashPaymentForTable = async (tableNum = currentTable) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    const reqPayload = {
      paymentStatus: 'Cash Payment Requested',
      paymentMethod: 'Pay at Counter',
      billRequestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update React state functionally
    setOrders(prev => prev.map(o => {
      if (String(o.tableNumber).padStart(2, '0') === formatted && !isOrderPaid(o)) {
        return { ...o, ...reqPayload };
      }
      return o;
    }));

    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'orders'), where('tableNumber', '==', formatted));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data();
          if (data.paymentStatus !== 'Paid') {
            await updateDoc(doc(db, 'orders', d.id), reqPayload);
          }
        }
      } catch (err) {
        console.warn('Firebase requestCashPayment error:', err);
      }
    }

    try {
      localStore.updateOrdersForTable(formatted, reqPayload);
    } catch {}
    return { tableNumber: formatted, status: 'Cash Payment Requested' };
  };

  // Admin marks table bill as paid (e.g. Received Cash at Counter / Handed to Captain)
  const markTableAsPaidByAdmin = async (tableNum, paymentMethod = 'Cash (Collected at Counter)') => {
    if (!tableNum) return;
    const formatted = String(tableNum).padStart(2, '0');
    return await payTableBill(formatted, {
      paymentMethod,
      transactionId: `CASH-${Date.now().toString().slice(-6)}`
    });
  };

  // Refund Order (Admin action)
  const refundOrder = async (orderId, refundData = {}) => {
    const orderIdStr = String(orderId);
    const targetOrder = orders.find(o => 
      String(o.id) === orderIdStr || 
      String(o.orderNumber) === orderIdStr || 
      (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr)
    );

    const updates = {
      paymentStatus: 'REFUNDED',
      refund_status: 'REFUNDED',
      refundedAt: new Date().toISOString(),
      refundId: refundData.refundId || null,
      refundAmount: refundData.amount || null,
      updatedAt: new Date().toISOString()
    };

    setOrders(prevOrders => prevOrders.map(o => {
      const match = String(o.id) === orderIdStr || 
                    String(o.orderNumber) === orderIdStr || 
                    (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr);
      return match ? { ...o, ...updates } : o;
    }));

    if (isFirebaseConfigured) {
      try {
        let firestoreId = targetOrder?.firestoreDocId;
        if (!firestoreId && orderIdStr.length > 15) firestoreId = orderIdStr;
        if (firestoreId) {
          await updateDoc(doc(db, 'orders', firestoreId), updates);
        }
      } catch (err) {
        console.warn('Firebase refund update error:', err);
      }
    }

    try {
      localStore.updateOrderData(orderId, updates);
    } catch (e) {
      console.warn('localStore update error:', e);
    }

    return updates;
  };

  // Mark a single order as Paid by Admin (for Cash / Counter orders)
  const markOrderAsPaidByAdmin = async (orderId, paymentMethod = 'Cash (Collected at Counter)') => {
    const orderIdStr = String(orderId);
    const targetOrder = orders.find(o => 
      String(o.id) === orderIdStr || 
      String(o.orderNumber) === orderIdStr || 
      (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr)
    );
    const allKnownOrders = (orders && orders.length > 0) ? orders : localStore.getOrders();
    const assignedInvoice = targetOrder?.invoiceNumber || getNextInvoiceNumber(allKnownOrders);

    const updates = {
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod,
      invoiceNumber: assignedInvoice,
      paidAt: new Date().toISOString(),
      transactionId: `CASH-${Date.now().toString().slice(-6)}`,
      updatedAt: new Date().toISOString()
    };

    // Explicitly preserve active cooking lifecycle status
    if (targetOrder?.status && targetOrder.status !== 'cancelled') {
      let kitchenStatus = targetOrder.status;
      if (kitchenStatus === 'bill requested' || kitchenStatus === 'Bill Requested') {
        kitchenStatus = targetOrder.servedAt ? 'served' : (targetOrder.prepStartedAt ? 'preparing' : 'pending');
      }
      updates.status = kitchenStatus;
    }

    // 1. Immediately update React state so the UI reflects Paid with 0 lag
    setOrders(prevOrders => prevOrders.map(o => {
      const match = String(o.id) === orderIdStr || 
                    String(o.orderNumber) === orderIdStr || 
                    (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr);
      if (match) {
        return {
          ...o,
          ...updates,
          paymentStatus: 'Paid',
          isPaid: true
        };
      }
      return o;
    }));

    // 2. Persist to Firestore
    if (isFirebaseConfigured) {
      try {
        let firestoreId = targetOrder?.firestoreDocId;
        if (!firestoreId && orderIdStr.length > 15) firestoreId = orderIdStr;

        if (firestoreId) {
          await updateDoc(doc(db, 'orders', firestoreId), updates);
        } else {
          const numVal = Number(orderId);
          const possibleValues = [orderId, orderIdStr];
          if (!isNaN(numVal)) possibleValues.push(numVal);

          const snap1 = await getDocs(query(collection(db, 'orders'), where('orderNumber', 'in', possibleValues)));
          if (!snap1.empty) {
            for (const d of snap1.docs) {
              await updateDoc(doc(db, 'orders', d.id), updates);
            }
          } else {
            const snap2 = await getDocs(query(collection(db, 'orders'), where('id', 'in', possibleValues)));
            for (const d of snap2.docs) {
              await updateDoc(doc(db, 'orders', d.id), updates);
            }
          }
        }
      } catch (err) {
        console.warn('Firebase mark order paid error:', err);
      }
    }

    // 3. Update localStorage fallback without clobbering active state
    try {
      localStore.updateOrderData(orderId, updates);
    } catch (e) {
      console.warn('localStore update error:', e);
    }

    return updates;
  };

  // Mark a single order as Unpaid by Admin (for Cash orders)
  const markOrderAsUnpaidByAdmin = async (orderId) => {
    const orderIdStr = String(orderId);
    const targetOrder = orders.find(o => 
      String(o.id) === orderIdStr || 
      String(o.orderNumber) === orderIdStr || 
      (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr)
    );

    const updates = {
      paymentStatus: 'pending',
      paidAt: null,
      transactionId: null,
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update React state
    setOrders(prevOrders => prevOrders.map(o => {
      const match = String(o.id) === orderIdStr || 
                    String(o.orderNumber) === orderIdStr || 
                    (o.firestoreDocId && String(o.firestoreDocId) === orderIdStr);
      if (match) {
        return {
          ...o,
          ...updates,
          paymentStatus: 'pending',
          isPaid: false
        };
      }
      return o;
    }));

    // 2. Persist to Firestore
    if (isFirebaseConfigured) {
      try {
        let firestoreId = targetOrder?.firestoreDocId;
        if (!firestoreId && orderIdStr.length > 15) firestoreId = orderIdStr;

        if (firestoreId) {
          await updateDoc(doc(db, 'orders', firestoreId), updates);
        } else {
          const numVal = Number(orderId);
          const possibleValues = [orderId, orderIdStr];
          if (!isNaN(numVal)) possibleValues.push(numVal);

          const snap = await getDocs(query(collection(db, 'orders'), where('orderNumber', 'in', possibleValues)));
          for (const d of snap.docs) {
            await updateDoc(doc(db, 'orders', d.id), updates);
          }
        }
      } catch (err) {
        console.warn('Firebase mark order unpaid error:', err);
      }
    }

    // 3. Update localStore fallback
    try {
      localStore.updateOrderData(orderId, updates);
    } catch (e) {
      console.warn('localStore update error:', e);
    }

    return updates;
  };

  // Update order status across lifecycle: pending -> preparing -> ready -> served -> bill requested -> completed
  const updateOrderStatus = async (orderId, newStatus) => {
    const updates = { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    };

    if (newStatus === 'preparing') {
      updates.prepStartedAt = new Date().toISOString();
    }
    if (newStatus === 'served') {
      updates.servedAt = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    if (isFirebaseConfigured) {
      try {
        const existingOrder = orders.find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId));
        const targetDocId = existingOrder?.firestoreDocId || orderId;
        try {
          await updateDoc(doc(db, 'orders', targetDocId), updates);
        } catch (firstErr) {
          const q = query(collection(db, 'orders'), where('orderNumber', '==', String(orderId)));
          const snap = await getDocs(q);
          if (!snap.empty) {
            await updateDoc(doc(db, 'orders', snap.docs[0].id), updates);
          }
        }
      } catch (err) {
        console.warn('Firebase status update error:', err);
      }
    }

    localStore.updateOrderStatus(orderId, newStatus);
    const targetStr = String(orderId);
    setOrders(prev => {
      const exists = prev.some(o => String(o.id) === targetStr || String(o.orderNumber) === targetStr);
      if (exists) {
        return prev.map(o => {
          if (String(o.id) === targetStr || String(o.orderNumber) === targetStr) {
            return { ...o, ...updates };
          }
          return o;
        });
      }
      return localStore.getOrders();
    });

    try {
      window.dispatchEvent(new CustomEvent('smartdine_local_sync', {
        detail: { collection: 'orders', data: localStore.getOrders() }
      }));
    } catch {}
  };

  // Update preparation ETA from Kitchen/Admin (instantly updates customer view)
  const updateOrderEta = async (orderId, newMinutes) => {
    const minutes = Math.max(1, parseInt(newMinutes) || 20);
    const rangeStr = `${minutes}–${minutes + 5} min`;

    if (isFirebaseConfigured) {
      try {
        const existingOrder = orders.find(o => String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId));
        const targetDocId = existingOrder?.firestoreDocId || orderId;
        await updateDoc(doc(db, 'orders', targetDocId), {
          estimatedPrepMinutes: minutes,
          prepTimeRange: rangeStr,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firebase ETA update error:', err);
      }
    }

    localStore.updateOrderEta(orderId, minutes, rangeStr);
    const targetStr = String(orderId);
    setOrders(prev => {
      return prev.map(o => {
        if (String(o.id) === targetStr || String(o.orderNumber) === targetStr) {
          return { ...o, estimatedPrepMinutes: minutes, prepTimeRange: rangeStr, updatedAt: new Date().toISOString() };
        }
        return o;
      });
    });
  };

  // Staff/Admin assigns a table to a queued/waiting customer
  const assignTableToWaitingOrder = async (orderId, tableNumber) => {
    const formatted = String(tableNumber).padStart(2, '0');

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          tableNumber: formatted,
          waitingForTable: false,
          tableReady: true,
          tableReadyAt: new Date().toISOString(),
          queuePosition: null,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firebase table assignment error:', err);
      }
    }

    localStore.assignTableToOrder(orderId, formatted);
    const updated = localStore.getOrders();
    setOrders([...updated]);
  };

  const refreshOrders = async () => {
    // 1. Sync Waiter Calls from REST API endpoint
    try {
      const res = await fetch('/api/waiter-calls');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.calls)) {
          setWaiterCalls(prev => {
            const map = new Map();
            data.calls.forEach(c => map.set(String(c.id), c));
            prev.forEach(c => {
              if (!map.has(String(c.id))) map.set(String(c.id), c);
            });
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            try { localStorage.setItem('smartdine_waiter_calls', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      }
    } catch {}

    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const ords = snap.docs.map(doc => {
            const data = doc.data();
            const cleanOrderNum = data.orderNumber || data.id || formatOrderNumber(doc.id);
            return {
              ...data,
              id: cleanOrderNum,
              firestoreDocId: doc.id,
              orderNumber: cleanOrderNum
            };
          }).filter(isRealOrder);
          setOrders(ords);
        }
      } catch (e) {
        console.warn('Error refreshing orders', e);
      }
    } else {
      const latest = localStore.getOrders().filter(isRealOrder);
      setOrders([...latest]);
    }
  };

  const reloadLatestMenu = () => {
    try {
      setMenuItems(localStore.getMenuItems());
      setCategories(localStore.getCategories());
      setTables(localStore.getTables());
      setOrders(localStore.getOrders().filter(isRealOrder));
    } catch (e) {
      console.warn('Reload menu error', e);
    }
  };

  const addMenuItem = async (item) => {
    const newItemId = item.id || `item-${Date.now()}`;
    const newItem = {
      id: newItemId,
      name: item.name?.trim() || 'New Dish',
      price: Number(item.price) || 0,
      categoryId: item.categoryId || (categories[0]?.id || 'main-course'),
      category: item.category || (categories[0]?.name || 'Main Course'),
      description: item.description?.trim() || '',
      imageUrl: item.imageUrl || '/dishes/paneer_butter_masala.jpg',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      inStock: item.inStock !== undefined ? item.inStock : true,
      available: item.available !== undefined ? item.available : true,
      createdAt: item.createdAt || new Date().toISOString()
    };

    // 1. Immediate UI update (0ms latency, optimistic)
    setMenuItems(prev => [newItem, ...prev.filter(i => i.id !== newItem.id)]);
    const currentItems = localStore.getMenuItems();
    const updated = [newItem, ...currentItems.filter(i => i.id !== newItem.id)];
    localStore.saveMenuItems(updated);

    // 2. Broadcast local update event for cross-component reactivity
    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'menuItems', data: updated } 
    }));

    // 3. Asynchronous background sync to Firestore (with strict timeout)
    if (isFirebaseConfigured) {
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore menu item sync timeout')), 3500)
          );
          await Promise.race([
            setDoc(doc(db, 'menuItems', newItem.id), newItem),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Background Firestore setDoc menuItem error/timeout:', err);
        }
      })();
    }

    return newItem;
  };

  const updateMenuItem = async (itemId, updates) => {
    const targetStr = String(itemId);
    setMenuItems(prev => prev.map(item => 
      (String(item.id) === targetStr || String(item.firestoreDocId) === targetStr) 
        ? { ...item, ...updates } 
        : item
    ));

    const currentItems = localStore.getMenuItems();
    const updated = currentItems.map(item => 
      (String(item.id) === targetStr || String(item.firestoreDocId) === targetStr) 
        ? { ...item, ...updates } 
        : item
    );
    localStore.saveMenuItems(updated);

    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'menuItems', data: updated } 
    }));

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const itemToUpdate = currentItems.find(i => String(i.id) === targetStr || String(i.firestoreDocId) === targetStr);
          const docId = itemToUpdate?.firestoreDocId || itemId;
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
          await Promise.race([
            updateDoc(doc(db, 'menuItems', String(docId)), updates),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Firebase updateDoc menuItem error:', err);
        }
      })();
    }
  };

  const deleteMenuItem = async (itemId) => {
    const targetStr = String(itemId);
    const itemToDelete = menuItems.find(i => String(i.id) === targetStr || String(i.firestoreDocId) === targetStr);

    setMenuItems(prev => prev.filter(item => String(item.id) !== targetStr && String(item.firestoreDocId) !== targetStr));
    const currentItems = localStore.getMenuItems();
    const updated = currentItems.filter(item => String(item.id) !== targetStr && String(item.firestoreDocId) !== targetStr);
    localStore.saveMenuItems(updated);

    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'menuItems', data: updated } 
    }));

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const docId = itemToDelete?.firestoreDocId || itemId;
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
          await Promise.race([
            deleteDoc(doc(db, 'menuItems', String(docId))),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Firebase deleteDoc menuItem error:', err);
        }
      })();
    }
  };

  const toggleItemAvailability = async (itemId) => {
    const targetStr = String(itemId);
    let newInStock = false;
    setMenuItems(prev => prev.map(item => {
      if (String(item.id) === targetStr || String(item.firestoreDocId) === targetStr) {
        const current = item.inStock !== undefined ? item.inStock : (item.available !== false);
        newInStock = !current;
        return { ...item, inStock: newInStock, available: newInStock };
      }
      return item;
    }));

    const currentItems = localStore.getMenuItems();
    const updated = currentItems.map(item => {
      if (String(item.id) === targetStr || String(item.firestoreDocId) === targetStr) {
        const current = item.inStock !== undefined ? item.inStock : (item.available !== false);
        return { ...item, inStock: !current, available: !current };
      }
      return item;
    });
    localStore.saveMenuItems(updated);

    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'menuItems', data: updated } 
    }));

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const itemToUpdate = currentItems.find(i => String(i.id) === targetStr || String(i.firestoreDocId) === targetStr);
          const docId = itemToUpdate?.firestoreDocId || itemId;
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
          await Promise.race([
            updateDoc(doc(db, 'menuItems', String(docId)), { inStock: newInStock, available: newInStock }),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Firebase toggleItemAvailability error:', err);
        }
      })();
    }
  };

  const addCategory = async (categoryData) => {
    const newCat = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: categoryData.name?.trim() || 'New Category',
      description: categoryData.description || '',
      imageUrl: categoryData.imageUrl || '',
      active: true,
      displayOrder: categories.length + 1,
      createdAt: new Date().toISOString()
    };

    setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat]);
    const currentCats = localStore.getCategories();
    const updated = [...currentCats.filter(c => c.id !== newCat.id), newCat];
    localStore.saveCategories(updated);

    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'categories', data: updated } 
    }));

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
          await Promise.race([
            setDoc(doc(db, 'categories', newCat.id), newCat),
            timeoutPromise
          ]);
        } catch (err) {
          console.warn('Firebase setDoc category error:', err);
        }
      })();
    }

    return newCat;
  };

  const deleteCategory = async (catId) => {
    const targetStr = String(catId);
    const catToDelete = categories.find(c => String(c.id) === targetStr || String(c.firestoreDocId) === targetStr);

    setCategories(prev => prev.filter(c => String(c.id) !== targetStr && String(c.firestoreDocId) !== targetStr));
    const currentCats = localStore.getCategories();
    const updated = currentCats.filter(c => String(c.id) !== targetStr && String(c.firestoreDocId) !== targetStr);
    localStore.saveCategories(updated);

    if (isFirebaseConfigured) {
      try {
        const docId = catToDelete?.firestoreDocId || catId;
        await deleteDoc(doc(db, 'categories', docId));
      } catch (err) {
        console.warn('Firebase deleteDoc category error:', err);
      }
    }
  };

  const updateTableStatus = (tableNumber, newStatus) => {
    const formatted = String(tableNumber).padStart(2, '0');
    const updated = tables.map(tbl => {
      if (String(tbl.tableNumber).padStart(2, '0') === formatted) {
        return { ...tbl, status: newStatus };
      }
      return tbl;
    });
    setTables(updated);
    localStore.saveTables(updated);
  };

  const updateTable = async (id, tableData) => {
    const formatted = String(tableData.tableNumber).padStart(2, '0');
    const payload = {
      ...tableData,
      tableNumber: formatted,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'tables', id), payload);
      } catch (err) {
        console.warn('Firestore updateTable note:', err);
      }
    }

    const updated = tables.map(t => t.id === id ? { ...t, ...payload } : t);
    setTables(updated);
    localStore.saveTables(updated);
    return true;
  };

  const addTable = async (tableData) => {
    const formatted = String(tableData.tableNumber).padStart(2, '0');
    const existingIndex = tables.findIndex(t => String(t.tableNumber).padStart(2, '0') === formatted);
    if (existingIndex !== -1) {
      throw new Error(`Table ${formatted} already exists!`);
    }

    const payload = {
      tableNumber: formatted,
      capacity: Number(tableData.capacity) || 4,
      location: (tableData.location || 'Main Dining Hall').trim(),
      active: tableData.active !== undefined ? tableData.active : true,
      qrUrl: tableData.qrUrl || `https://smartdine.netlify.app/menu?table=${formatted}`,
      deepLink: tableData.deepLink || `smartdine://table/${formatted}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let docId = `table-${formatted}-${Date.now()}`;
    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'tables'), payload);
        docId = docRef.id;
      } catch (err) {
        console.warn('Firestore addTable note:', err);
      }
    }

    const newTbl = { id: docId, ...payload };
    const updated = [...tables, newTbl];
    updated.sort((a, b) => parseInt(a.tableNumber || 0, 10) - parseInt(b.tableNumber || 0, 10));
    setTables(updated);
    localStore.saveTables(updated);
    return newTbl;
  };

  const deleteTable = async (tableIdOrNumber) => {
    const formatted = String(tableIdOrNumber).padStart(2, '0');
    const target = tables.find(t => t.id === tableIdOrNumber || String(t.tableNumber).padStart(2, '0') === formatted);
    const targetId = target ? target.id : tableIdOrNumber;
    const targetNum = target ? String(target.tableNumber).padStart(2, '0') : formatted;

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'tables', targetId));
      } catch (err) {
        console.warn('Firestore deleteTable note:', err);
      }
    }

    const updated = tables.filter(t => t.id !== targetId && String(t.tableNumber).padStart(2, '0') !== targetNum);
    setTables(updated);
    localStore.saveTables(updated);
    return true;
  };

  const resetToRealTables = async (tableCount = 6) => {
    const realList = [];
    const sections = ['Main Dining Hall', 'Window View', 'Terrace Balcony', 'Family Booth', 'VIP Lounge'];
    for (let i = 1; i <= tableCount; i++) {
      const num = String(i).padStart(2, '0');
      realList.push({
        id: `tbl-${num}`,
        tableNumber: num,
        capacity: i % 2 === 0 ? 4 : (i === 5 ? 6 : 2),
        active: true,
        location: sections[(i - 1) % sections.length],
        qrUrl: `https://smartdine.netlify.app/menu?table=${num}`,
        deepLink: `smartdine://table/${num}`,
        createdAt: new Date().toISOString()
      });
    }

    if (isFirebaseConfigured) {
      try {
        for (const t of tables) {
          try { await deleteDoc(doc(db, 'tables', t.id)); } catch {}
        }
        for (const t of realList) {
          try { await addDoc(collection(db, 'tables'), t); } catch {}
        }
      } catch (e) {
        console.warn('Firebase batch sync warning:', e);
      }
    }

    setTables(realList);
    localStore.saveTables(realList);
    return realList;
  };

  const resetCleanAdminOrders = () => {
    localStore.saveOrders(CLEAN_INITIAL_ORDERS);
    setOrders([...CLEAN_INITIAL_ORDERS]);
    localStorage.setItem('smartdine_clean_admin_v2', 'true');
  };

  const callWaiter = async ({ tableNumber, reason = 'General Assistance', notes = '', customerName = '' }) => {
    const targetTable = String(tableNumber || currentTable || '01').padStart(2, '0');
    const guestName = customerName || localStorage.getItem('smartdine_guest_name') || 'Guest';
    const nowIso = new Date().toISOString();

    const newCall = {
      id: `call-${Date.now()}`,
      tableNumber: targetTable,
      customerName: guestName,
      reason: reason || 'General Assistance',
      notes: (notes || '').trim(),
      status: 'pending', // 'pending' | 'attended' | 'cancelled'
      createdAt: nowIso,
      timestamp: nowIso,
      updatedAt: nowIso,
      estimatedArrivalMinutes: 2
    };

    let updatedCalls = [];
    setWaiterCalls(prev => {
      const filtered = prev.filter(c => !(String(c.tableNumber).padStart(2, '0') === targetTable && c.status === 'pending'));
      updatedCalls = [newCall, ...filtered];
      try {
        localStorage.setItem('smartdine_waiter_calls', JSON.stringify(updatedCalls));
        localStorage.setItem('smartdine_waiter_ping', String(Date.now()));
        window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
          detail: { collection: 'waiter_calls', data: updatedCalls } 
        }));
      } catch {}
      return updatedCalls;
    });

    // 0ms instant broadcast across all tabs in browser
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('smartdine_waiter_channel');
        bc.postMessage({ type: 'WAITER_CALLS_SYNC', calls: updatedCalls });
        bc.close();
      }
    } catch {}

    // Immediate REST API sync for cross-device support
    try {
      await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', call: newCall })
      });
    } catch (e) {
      console.warn('REST API waiter call error:', e);
    }

    // Background non-blocking Firestore sync
    if (isFirebaseConfigured && db) {
      Promise.race([
        setDoc(doc(db, 'waiter_calls', newCall.id), newCall, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]).catch(() => {});
    }

    return newCall;
  };

  const cancelWaiterCall = async (callId) => {
    const updatedAt = new Date().toISOString();
    let updatedCalls = [];
    setWaiterCalls(prev => {
      updatedCalls = prev.map(c => 
        c.id === callId ? { ...c, status: 'cancelled', updatedAt } : c
      );
      try {
        localStorage.setItem('smartdine_waiter_calls', JSON.stringify(updatedCalls));
        localStorage.setItem('smartdine_waiter_ping', String(Date.now()));
        window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
          detail: { collection: 'waiter_calls', data: updatedCalls } 
        }));
      } catch {}
      return updatedCalls;
    });

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('smartdine_waiter_channel');
        bc.postMessage({ type: 'WAITER_CALLS_SYNC', calls: updatedCalls });
        bc.close();
      }
    } catch {}

    try {
      await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', callId })
      });
    } catch {}

    if (isFirebaseConfigured && db) {
      Promise.race([
        updateDoc(doc(db, 'waiter_calls', callId), { status: 'cancelled', updatedAt }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]).catch(() => {});
    }

    return true;
  };

  const resolveWaiterCall = async (callId) => {
    const resolvedAt = new Date().toISOString();
    let updatedCalls = [];
    setWaiterCalls(prev => {
      updatedCalls = prev.map(c => 
        c.id === callId ? { ...c, status: 'attended', attendedAt: resolvedAt, resolvedAt, updatedAt: resolvedAt } : c
      );
      try {
        localStorage.setItem('smartdine_waiter_calls', JSON.stringify(updatedCalls));
        localStorage.setItem('smartdine_waiter_ping', String(Date.now()));
        window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
          detail: { collection: 'waiter_calls', data: updatedCalls } 
        }));
      } catch {}
      return updatedCalls;
    });

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('smartdine_waiter_channel');
        bc.postMessage({ type: 'WAITER_CALLS_SYNC', calls: updatedCalls });
        bc.close();
      }
    } catch {}

    try {
      await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', callId, resolvedAt })
      });
    } catch {}

    if (isFirebaseConfigured && db) {
      Promise.race([
        updateDoc(doc(db, 'waiter_calls', callId), { status: 'attended', attendedAt: resolvedAt, resolvedAt, updatedAt: resolvedAt }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]).catch(() => {});
    }

    return true;
  };

  const getActiveWaiterCallForTable = (tableNumber) => {
    const target = String(tableNumber || currentTable || '').padStart(2, '0');
    if (!target) return null;
    return waiterCalls.find(c => String(c.tableNumber).padStart(2, '0') === target && c.status === 'pending') || null;
  };

  // Add Water Bottle (Packaged Mineral Water) directly to table's active bill
  const addWaterBottleToTableBill = async (tableNumber, {
    quantity = 1,
    price = 20,
    bottleName = 'Mineral Water Bottle (1L)',
    resolveCallId = null
  } = {}) => {
    const formatted = String(tableNumber || currentTable || '01').padStart(2, '0');
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Number(price) || 20;

    // 1. Find active unpaid orders for this table
    const activeOrders = getTableActiveOrders(formatted);
    let targetOrder = activeOrders.length > 0 ? activeOrders[activeOrders.length - 1] : null;

    if (targetOrder) {
      const existingItems = Array.isArray(targetOrder.items) ? [...targetOrder.items] : [];
      const itemIdx = existingItems.findIndex(i => 
        (i.itemId === 'item-water-bottle' || String(i.name).toLowerCase().includes('water bottle'))
      );

      if (itemIdx >= 0) {
        existingItems[itemIdx] = {
          ...existingItems[itemIdx],
          quantity: (existingItems[itemIdx].quantity || 1) + qty,
          totalPrice: ((existingItems[itemIdx].quantity || 1) + qty) * unitPrice
        };
      } else {
        existingItems.push({
          itemId: 'item-water-bottle',
          id: `item-water-${Date.now()}`,
          name: bottleName,
          price: unitPrice,
          quantity: qty,
          totalPrice: unitPrice * qty,
          isVeg: true,
          category: 'Drinks',
          imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80'
        });
      }

      const subtotal = existingItems.reduce((sum, it) => sum + (Number(it.price || unitPrice) * Number(it.quantity || 1)), 0);
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const updates = {
        items: existingItems,
        subtotal,
        tax,
        total,
        amount: total,
        updatedAt: new Date().toISOString()
      };

      setOrders(prev => prev.map(o => {
        if (String(o.id) === String(targetOrder.id) || String(o.orderNumber) === String(targetOrder.orderNumber)) {
          return { ...o, ...updates };
        }
        return o;
      }));

      try { localStore.updateOrderData(targetOrder.id, updates); } catch {}
      if (isFirebaseConfigured) {
        const docId = targetOrder.firestoreDocId || targetOrder.id;
        updateDoc(doc(db, 'orders', docId), updates).catch(e => console.warn(e));
      }
    } else {
      const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
      const subtotal = unitPrice * qty;
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const newOrder = {
        id: newOrderId,
        orderNumber: newOrderId,
        tableNumber: formatted,
        customerName: localStorage.getItem('smartdine_guest_name') || 'Guest',
        items: [{
          itemId: 'item-water-bottle',
          id: `item-water-${Date.now()}`,
          name: bottleName,
          price: unitPrice,
          quantity: qty,
          totalPrice: unitPrice * qty,
          isVeg: true,
          category: 'Drinks',
          imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80'
        }],
        subtotal,
        tax,
        total,
        amount: total,
        status: 'served',
        paymentStatus: 'pending',
        paymentMethod: 'Pay at Counter',
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setOrders(prev => [newOrder, ...prev]);
      try {
        const allOrders = localStore.getOrders();
        localStore.saveOrders([newOrder, ...allOrders]);
      } catch {}
      if (isFirebaseConfigured) {
        setDoc(doc(db, 'orders', newOrder.id), newOrder).catch(e => console.warn(e));
      }
    }

    if (resolveCallId) {
      resolveWaiterCall(resolveCallId);
    } else {
      const matchCall = waiterCalls.find(c => 
        String(c.tableNumber).padStart(2, '0') === formatted && 
        c.status === 'pending' && 
        (String(c.reason).toLowerCase().includes('water') || String(c.reason).toLowerCase().includes('bottle'))
      );
      if (matchCall) resolveWaiterCall(matchCall.id);
    }

    try {
      window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
        detail: { collection: 'orders', data: localStore.getOrders() } 
      }));
      localStorage.setItem('smartdine_order_sync_ping', String(Date.now()));
    } catch {}

    return true;
  };

  return (
    <TableOrderContext.Provider value={{
      currentTable,
      setTableSession,
      clearTableSession,
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartSubtotal,
      cartTax,
      cartTotal,
      cartItemCount,
      menuItems,
      setMenuItems,
      categories,
      setCategories,
      tables,
      setTables,
      orders,
      setOrders,
      isOrderPaid,
      isRealOrder,
      isOrderToday,
      placeOrder,
      getTableActiveOrders,
      getCombinedTableBill,
      requestTableBill,
      requestCashPaymentForTable,
      payTableBill,
      markTableAsPaidByAdmin,
      markOrderAsPaidByAdmin,
      markOrderAsUnpaidByAdmin,
      refundOrder,
      updateOrderStatus,
      updateOrderEta,
      assignTableToWaitingOrder,
      refreshOrders,
      reloadLatestMenu,
      latestPlacedOrderId,
      lastSyncTime,
      customerFeedbacks,
      refreshFeedbacks,
      submitOrderFeedback,
      deleteCustomerFeedback,
      replyToCustomerFeedback,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleItemAvailability,
      addCategory,
      deleteCategory,
      updateTableStatus,
      addTable,
      updateTable,
      deleteTable,
      resetToRealTables,
      resetCleanAdminOrders,
      waiterCalls,
      callWaiter,
      cancelWaiterCall,
      resolveWaiterCall,
      getActiveWaiterCallForTable,
      addWaterBottleToTableBill
    }}>
      {children}
    </TableOrderContext.Provider>
  );
}

export function useTableOrder() {
  return useContext(TableOrderContext);
}

