import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, localStore, isFirebaseConfigured } from '../firebase/config';
import { DEMO_TABLES } from '../firebase/seed-data.js';
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs, doc, updateDoc } from 'firebase/firestore';
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

  // Customer Feedbacks (Only real submitted feedbacks + localStorage)
  const [customerFeedbacks, setCustomerFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_customer_feedbacks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save feedbacks
  useEffect(() => {
    localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(customerFeedbacks));
  }, [customerFeedbacks]);

  // Live Waiter Calls (Real-time synced across tabs & devices)
  const [waiterCalls, setWaiterCalls] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_waiter_calls');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save waiter calls and dispatch cross-tab update
  useEffect(() => {
    localStorage.setItem('smartdine_waiter_calls', JSON.stringify(waiterCalls));
    window.dispatchEvent(new CustomEvent('smartdine_db_update', { 
      detail: { collection: 'waiter_calls', data: waiterCalls } 
    }));
  }, [waiterCalls]);

  // Sync listener across tabs & windows
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.key === 'smartdine_waiter_calls' && e.newValue) {
        try {
          setWaiterCalls(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // Submit Feedback Handler
  const submitOrderFeedback = async (feedbackData) => {
    const newFeedback = {
      id: `fb-${Date.now()}`,
      orderId: feedbackData.orderId,
      tableNumber: feedbackData.tableNumber || currentTable || '01',
      overallRating: feedbackData.overallRating || 5,
      itemRatings: feedbackData.itemRatings || {},
      selectedTags: feedbackData.selectedTags || [],
      writtenText: feedbackData.writtenText || '',
      aiAnalysis: feedbackData.aiAnalysis || null,
      date: feedbackData.date || new Date().toLocaleString(),
      restaurantResponse: 'Thank you for your valuable feedback! Our head chef and floor team appreciate your support.'
    };

    setCustomerFeedbacks(prev => [newFeedback, ...prev]);
    return newFeedback;
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
        } else {
          setOrders(localStore.getOrders().filter(isRealOrder));
          setMenuItems(localStore.getMenuItems());
          setCategories(localStore.getCategories());
          setTables(localStore.getTables());
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
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMenuItems(items);
        }
      });

      // Categories listener
      const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        if (!snapshot.empty) {
          const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCategories(cats);
        }
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
      };

      window.addEventListener('smartdine_db_update', handleLocalUpdate);
      window.addEventListener('storage', handleStorageEvent);

      return () => {
        unsubMenu();
        unsubCategories();
        unsubTables();
        unsubOrders();
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
      };
      const handleStorageEvent = (e) => {
        if (e.key === 'smartdine_orders' || e.key === 'smartdine_order_sync_ping') {
          setOrders(localStore.getOrders().filter(isRealOrder));
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
    const pStatus = String(order.paymentStatus || order.payment_status || '').trim().toLowerCase();
    
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

    // Explicitly paid states
    if (pStatus === 'paid' || pStatus === 'cash paid' || pStatus === 'online paid') {
      return true;
    }

    // Order has paidAt and real verified transaction ID (not pending/counter placeholder)
    if (order.paidAt && order.transactionId && !order.transactionId.startsWith('PENDING') && !order.transactionId.startsWith('COUNTER')) {
      return true;
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
    paymentGateway = 'None',
    razorpay_order_id = null,
    razorpay_payment_id = null,
    razorpay_signature = null,
    transactionId = null,
    paidAt = null,
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

    // Check if customer is paying via Counter / Cash / Desk (Offline settlement)
    const mStr = String(paymentMethod || '').toLowerCase();
    const isCounterOrCash = mStr.includes('counter') || mStr.includes('cash') || mStr.includes('desk') || String(paymentGateway || '').toLowerCase() === 'none';

    // Only genuine Razorpay payments or explicitly verified online payments are auto-marked PAID
    const isOnlineMethod = !isCounterOrCash && (
      Boolean(razorpay_payment_id) || 
      paymentGateway === 'Razorpay' ||
      (String(paymentStatus || '').toUpperCase() === 'PAID')
    );

    const finalPaymentStatus = isOnlineMethod ? 'PAID' : 'PENDING';
    const finalPaymentMethod = isCounterOrCash
      ? 'Pay at Counter'
      : (paymentMethod.includes('Razorpay') || paymentMethod.includes('Online') ? 'RAZORPAY' : (paymentMethod || 'Pay at Counter'));
    const finalGateway = isOnlineMethod ? 'Razorpay' : 'None';
    const finalAmount = total !== null && total !== undefined ? Number(total) : cartTotal;
    const finalPaidAt = finalPaymentStatus === 'PAID' ? (paidAt || new Date().toISOString()) : null;
    const finalTxnId = isOnlineMethod 
      ? (transactionId || razorpay_payment_id || `TXN-${Date.now().toString().slice(-6)}`) 
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
      paymentStatus: finalPaymentStatus,
      paymentMethod: finalPaymentMethod,
      paymentGateway: finalGateway,
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || transactionId || null,
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
      return matchTable && !isOrderPaid(o) && o.status !== 'cancelled';
    });
  };

  // Get previously paid / cleared orders for this table session
  const getTablePaidOrders = (tableNum = currentTable) => {
    if (!tableNum) return [];
    const formatted = String(tableNum).padStart(2, '0');
    return orders.filter(o => {
      const matchTable = String(o.tableNumber).padStart(2, '0') === formatted || 
                         String(o.tableNumber).toLowerCase() === String(tableNum).toLowerCase();
      return matchTable && isOrderPaid(o) && o.status !== 'cancelled';
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
    paymentMethod = 'UPI',
    transactionId = `TXN-${Date.now().toString().slice(-6)}`,
    discountAmount = 0,
    couponCode = null,
    invoiceNumber = null
  } = {}) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    const tableOrders = orders.filter(o => 
      String(o.tableNumber).padStart(2, '0') === formatted && 
      !isOrderPaid(o) && 
      o.status !== 'cancelled'
    );
    const assignedInvoice = invoiceNumber || getOrAssignInvoiceNumber(tableOrders, orders);

    const paidPayload = {
      paymentStatus: 'Paid',
      status: 'completed',
      paymentMethod,
      transactionId,
      discountAmount,
      couponCode,
      invoiceNumber: assignedInvoice,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update React state functionally
    setOrders(prev => prev.map(o => {
      if (String(o.tableNumber).padStart(2, '0') === formatted && !isOrderPaid(o) && o.status !== 'cancelled') {
        return { ...o, ...paidPayload };
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
            await updateDoc(doc(db, 'orders', d.id), paidPayload);
          }
        }
      } catch (err) {
        console.warn('Firebase payTableBill error:', err);
      }
    }

    try {
      localStore.updateOrdersForTable(formatted, paidPayload);
    } catch {}

    return {
      tableNumber: formatted,
      transactionId,
      invoiceNumber: assignedInvoice,
      paymentMethod,
      paidAt: paidPayload.paidAt,
      status: 'Paid'
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

    // Preserve active cooking lifecycle status if kitchen is working on it
    if (targetOrder?.status && ['preparing', 'ready', 'served'].includes(targetOrder.status)) {
      updates.status = targetOrder.status;
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

  const addMenuItem = (item) => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: item.name || 'New Dish',
      price: Number(item.price) || 0,
      categoryId: item.categoryId || (categories[0]?.id || 'main-course'),
      category: item.category || (categories[0]?.name || 'Main Course'),
      description: item.description || '',
      imageUrl: item.imageUrl || '/dishes/paneer_butter_masala.jpg',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      inStock: item.inStock !== undefined ? item.inStock : true,
      available: item.available !== undefined ? item.available : true,
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...menuItems];
    setMenuItems(updated);
    localStore.saveMenuItems(updated);
    return newItem;
  };

  const updateMenuItem = (itemId, updates) => {
    const updated = menuItems.map(item => item.id === itemId ? { ...item, ...updates } : item);
    setMenuItems(updated);
    localStore.saveMenuItems(updated);
  };

  const deleteMenuItem = (itemId) => {
    const updated = menuItems.filter(item => item.id !== itemId);
    setMenuItems(updated);
    localStore.saveMenuItems(updated);
  };

  const toggleItemAvailability = (itemId) => {
    const updated = menuItems.map(item => {
      if (item.id === itemId) {
        const current = item.inStock !== undefined ? item.inStock : (item.available !== false);
        return { ...item, inStock: !current, available: !current };
      }
      return item;
    });
    setMenuItems(updated);
    localStore.saveMenuItems(updated);
  };

  const addCategory = (categoryData) => {
    const newCat = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: categoryData.name,
      description: categoryData.description || '',
      imageUrl: categoryData.imageUrl || '',
      active: true,
      displayOrder: categories.length + 1,
      createdAt: new Date().toISOString()
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStore.saveCategories(updated);
    return newCat;
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

    const newCall = {
      id: `call-${Date.now()}`,
      tableNumber: targetTable,
      customerName: guestName,
      reason: reason || 'General Assistance',
      notes: (notes || '').trim(),
      status: 'pending', // 'pending' | 'attended' | 'cancelled'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedArrivalMinutes: 2
    };

    setWaiterCalls(prev => [newCall, ...prev.filter(c => !(String(c.tableNumber).padStart(2, '0') === targetTable && c.status === 'pending'))]);

    // Sync to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'waiter_calls'), newCall);
      } catch (e) {
        console.warn('Firestore waiter call note:', e);
      }
    }

    return newCall;
  };

  const cancelWaiterCall = async (callId) => {
    setWaiterCalls(prev => prev.map(c => 
      c.id === callId ? { ...c, status: 'cancelled', updatedAt: new Date().toISOString() } : c
    ));
    return true;
  };

  const resolveWaiterCall = async (callId) => {
    setWaiterCalls(prev => prev.map(c => 
      c.id === callId ? { ...c, status: 'attended', attendedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c
    ));
    return true;
  };

  const getActiveWaiterCallForTable = (tableNumber) => {
    const target = String(tableNumber || currentTable || '').padStart(2, '0');
    if (!target) return null;
    return waiterCalls.find(c => String(c.tableNumber).padStart(2, '0') === target && c.status === 'pending') || null;
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
      submitOrderFeedback,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleItemAvailability,
      addCategory,
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
      getActiveWaiterCallForTable
    }}>
      {children}
    </TableOrderContext.Provider>
  );
}

export function useTableOrder() {
  return useContext(TableOrderContext);
}

