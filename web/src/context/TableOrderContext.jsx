import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, localStore, isFirebaseConfigured } from '../firebase/config';
import { DEMO_TABLES } from '../firebase/seed-data.js';
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const TableOrderContext = createContext();

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
  const [tables, setTables] = useState(() => localStore.getTables());
  
  const [orders, setOrders] = useState(() => {
    try {
      const realOrdersPurged = localStorage.getItem('smartdine_real_production_mode_v1');
      if (!realOrdersPurged) {
        localStorage.setItem('smartdine_real_production_mode_v1', 'true');
        // Filter out any leftover seed dummy demo orders
        const raw = localStore.getOrders();
        const cleanRealOrders = raw.filter(o => !['ORD-9821', 'ORD-9822', 'ORD-9823', 'ORD-9824'].includes(o.id));
        localStore.saveOrders(cleanRealOrders);
        return cleanRealOrders;
      }
      return localStore.getOrders();
    } catch {
      return localStore.getOrders();
    }
  });

  const [latestPlacedOrderId, setLatestPlacedOrderId] = useState(() => {
    return localStorage.getItem('smartdine_last_order_id') || null;
  });

  // Customer Feedbacks (Initial seed + localStorage)
  const [customerFeedbacks, setCustomerFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_customer_feedbacks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'fb-101',
        orderId: 'SD1024',
        tableNumber: '04',
        overallRating: 5,
        itemRatings: { 'Paneer Pizza': 5, 'Cold Coffee': 5 },
        selectedTags: ['😋 Taste', '🍽️ Food Quality', '⚡ Fast Service'],
        writtenText: 'Paneer Pizza was loaded with toppings and had a fresh crunchy crust. Chilled cold coffee was perfect!',
        aiAnalysis: {
          sentiment: 'Positive',
          sentimentIcon: '😊',
          avgFoodScore: '5.0',
          serviceStatus: '⚡ Exceptional Speed',
          praisePoints: ['Taste', 'Food Quality', 'Fast Service'],
          complaintPoints: [],
          aiSummary: 'Customer gave 5⭐ rating. Praised: Taste, Food Quality, Fast Service. Delightful dining experience.'
        },
        date: 'Today, 2:15 PM',
        restaurantResponse: 'Thank you! Our Chef has noted your love for the Paneer Pizza. We look forward to serving you again!'
      },
      {
        id: 'fb-102',
        orderId: 'SD1018',
        tableNumber: '02',
        overallRating: 4,
        itemRatings: { 'Butter Chicken': 5, 'Garlic Naan': 4 },
        selectedTags: ['😋 Taste', '🍽️ Food Quality'],
        writtenText: 'Rich creamy gravy with tender chicken. Naan was hot and buttery.',
        aiAnalysis: {
          sentiment: 'Positive',
          sentimentIcon: '😊',
          avgFoodScore: '4.5',
          serviceStatus: 'Normal',
          praisePoints: ['Taste', 'Food Quality'],
          complaintPoints: [],
          aiSummary: 'Customer gave 4⭐ rating. Praised: Taste, Food Quality.'
        },
        date: 'Yesterday, 8:45 PM',
        restaurantResponse: 'Thank you for dining with us! Glad you enjoyed our Royal Butter Chicken.'
      }
    ];
  });

  // Save feedbacks
  useEffect(() => {
    localStorage.setItem('smartdine_customer_feedbacks', JSON.stringify(customerFeedbacks));
  }, [customerFeedbacks]);

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

  // 3-Second Guaranteed Live Auto-Sync Engine (For Netlify and all client devices)
  useEffect(() => {
    const syncAllData = async () => {
      try {
        if (isFirebaseConfigured) {
          // Sync Orders
          const ordQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          const ordSnap = await getDocs(ordQuery);
          if (!ordSnap.empty) {
            const ords = ordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ords);
          }
        } else {
          setOrders(localStore.getOrders());
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

    const intervalId = setInterval(syncAllData, 3000);
    return () => clearInterval(intervalId);
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
          const tbls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (tbls.length < 25) {
            const existingMap = new Map(tbls.map(t => [String(t.tableNumber).padStart(2, '0'), t]));
            const merged = DEMO_TABLES.map(dt => {
              const num = String(dt.tableNumber).padStart(2, '0');
              return existingMap.has(num) ? { ...dt, ...existingMap.get(num) } : dt;
            });
            setTables(merged);
            localStore.saveTables(merged);
          } else {
            setTables(tbls);
            localStore.saveTables(tbls);
          }
        }
      });

      // Orders listener
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(ords);
        }
      });

      return () => {
        unsubMenu();
        unsubCategories();
        unsubTables();
        unsubOrders();
      };
    } else {
      // Listen to cross-tab local updates
      const handleLocalUpdate = (e) => {
        if (e.detail?.collection === 'orders') setOrders(e.detail.data);
        if (e.detail?.collection === 'menuItems') setMenuItems(e.detail.data);
        if (e.detail?.collection === 'categories') setCategories(e.detail.data);
        if (e.detail?.collection === 'tables') setTables(e.detail.data);
      };
      window.addEventListener('smartdine_db_update', handleLocalUpdate);
      return () => window.removeEventListener('smartdine_db_update', handleLocalUpdate);
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
    const pStatus = String(order.paymentStatus || '').trim().toLowerCase();
    
    // Explicitly un-paid or pending collection states
    if (
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

    if (order.paidAt && order.transactionId && !order.transactionId.startsWith('PENDING')) {
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
    waitingForTable = false 
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
    const prepStartedAt = new Date().toISOString();

    const finalPaymentStatus = String(paymentStatus).toUpperCase();
    const finalPaymentMethod = paymentMethod.includes('Razorpay') || paymentMethod.includes('Online') ? 'RAZORPAY' : (paymentMethod || 'CASH / COUNTER');
    const finalGateway = finalPaymentMethod === 'RAZORPAY' ? 'Razorpay' : (paymentGateway || 'None');
    const finalAmount = total !== null && total !== undefined ? Number(total) : cartTotal;

    const orderData = {
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
      transactionId: transactionId || razorpay_payment_id || (finalPaymentStatus === 'PAID' ? `TXN-${Date.now()}` : null),
      paidAt: paidAt || (finalPaymentStatus === 'PAID' ? new Date().toISOString() : null),
      refund_status: refund_status || 'NONE',
      prepStartedAt,
      estimatedPrepMinutes,
      prepTimeRange,
      waitingForTable: isWaiting,
      queuePosition: queuePos,
      estimatedWaitingMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let orderId = '';

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        orderId = docRef.id;
      } catch (err) {
        console.warn('Firebase addDoc order error, using local fallback:', err);
        const created = localStore.addOrder(orderData);
        orderId = created.id;
      }
    } else {
      const created = localStore.addOrder(orderData);
      orderId = created.id;
    }

    setLatestPlacedOrderId(orderId);
    localStorage.setItem('smartdine_last_order_id', orderId);
    clearCart();
    return orderId;
  };

  // Get active UNPAID dining orders for a table (multiple orders in same session)
  const getTableActiveOrders = (tableNum = currentTable) => {
    if (!tableNum) return [];
    const formatted = String(tableNum).padStart(2, '0');
    return orders.filter(o => 
      String(o.tableNumber).padStart(2, '0') === formatted && 
      !isOrderPaid(o) &&
      o.status !== 'cancelled'
    );
  };

  // Get previously paid / cleared orders for this table session
  const getTablePaidOrders = (tableNum = currentTable) => {
    if (!tableNum) return [];
    const formatted = String(tableNum).padStart(2, '0');
    return orders.filter(o => 
      String(o.tableNumber).padStart(2, '0') === formatted && 
      isOrderPaid(o) &&
      o.status !== 'cancelled'
    );
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
    const isCashRequested = activeOrders.some(o => 
      String(o.paymentStatus || '').toLowerCase().includes('cash') || 
      String(o.paymentMethod || '').toLowerCase().includes('cash')
    );
    const isBillRequested = activeOrders.some(o => 
      String(o.paymentStatus || '').toLowerCase().includes('requested')
    ) || isCashRequested;
    const isPaid = activeOrders.length === 0;

    const totalClearedAmount = clearedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      tableNumber: tableNum,
      activeOrders,
      clearedOrders,
      clearedOrderCount: clearedOrders.length,
      totalClearedAmount,
      orderCount: activeOrders.length,
      orderIds: activeOrders.map(o => o.id),
      consolidatedItems,
      subtotal,
      discountAmount,
      tax,
      total,
      billStatus: isPaid ? 'Paid' : isCashRequested ? 'Cash Payment Requested' : isBillRequested ? 'Bill Requested' : 'Pending'
    };
  };

  // Customer requests the final combined bill
  const requestTableBill = async (tableNum = currentTable) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    if (isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'orders'), 
          where('tableNumber', '==', formatted)
        );
        const snap = await getDocs(q);
        snap.docs.forEach(async (d) => {
          const data = d.data();
          if (data.paymentStatus !== 'Paid') {
            await updateDoc(doc(db, 'orders', d.id), {
              status: 'bill requested',
              paymentStatus: 'Bill Requested',
              billRequestedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
      } catch (err) {
        console.warn('Firebase bill request warning:', err);
      }
    }

    localStore.updateOrdersForTable(formatted, {
      status: 'bill requested',
      paymentStatus: 'Bill Requested',
      billRequestedAt: new Date().toISOString()
    });

    const updated = localStore.getOrders();
    setOrders([...updated]);
  };

  // Pay Combined Table Bill (Online UPI / Card / NetBanking / Cash)
  const payTableBill = async (tableNum = currentTable, {
    paymentMethod = 'UPI',
    transactionId = `TXN-${Date.now().toString().slice(-6)}`,
    discountAmount = 0,
    couponCode = null
  }) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    const paidPayload = {
      paymentStatus: 'Paid',
      status: 'completed',
      paymentMethod,
      transactionId,
      discountAmount,
      couponCode,
      paidAt: new Date().toISOString()
    };

    localStore.updateOrdersForTable(formatted, paidPayload);
    const updated = localStore.getOrders();
    setOrders([...updated]);
    clearCart();

    return {
      tableNumber: formatted,
      transactionId,
      paymentMethod,
      paidAt: paidPayload.paidAt,
      status: 'Paid'
    };
  };

  // Customer requests cash payment (Admin / Cashier needs to collect cash at counter or table)
  const requestCashPaymentForTable = async (tableNum = currentTable) => {
    if (!tableNum) throw new Error('No active table found');
    const formatted = String(tableNum).padStart(2, '0');

    localStore.updateOrdersForTable(formatted, {
      paymentStatus: 'Cash Payment Requested',
      paymentMethod: 'Cash (Awaiting Collection)',
      billRequestedAt: new Date().toISOString()
    });

    const updated = localStore.getOrders();
    setOrders([...updated]);
    return { tableNumber: formatted, status: 'Cash Payment Requested' };
  };

  // Admin marks table bill as paid (e.g. Received Cash at Counter / Handed to Captain)
  const markTableAsPaidByAdmin = (tableNum, paymentMethod = 'Cash (Collected by Cashier)') => {
    const formatted = String(tableNum).padStart(2, '0');
    return payTableBill(formatted, {
      paymentMethod,
      transactionId: `CASH-${Date.now().toString().slice(-6)}`
    });
  };

  // Refund Order (Admin action)
  const refundOrder = async (orderId, refundData = {}) => {
    const updates = {
      paymentStatus: 'REFUNDED',
      refund_status: 'REFUNDED',
      refundedAt: new Date().toISOString(),
      refundId: refundData.refundId || null,
      refundAmount: refundData.amount || null,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), updates);
      } catch (err) {
        console.warn('Firebase refund update error:', err);
      }
    }

    localStore.updateOrderData(orderId, updates);
    const updated = localStore.getOrders();
    setOrders([...updated]);
    return updates;
  };

  // Mark a single order as Paid by Admin
  const markOrderAsPaidByAdmin = async (orderId, paymentMethod = 'CASH / COUNTER') => {
    const updates = {
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod,
      paidAt: new Date().toISOString(),
      transactionId: `CASH-${Date.now().toString().slice(-6)}`,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), updates);
      } catch (err) {
        console.warn('Firebase mark order paid error:', err);
      }
    }

    localStore.updateOrderData(orderId, updates);
    const updated = localStore.getOrders();
    setOrders([...updated]);
    return updates;
  };

  // Update order status across lifecycle: pending -> preparing -> ready -> served -> bill requested -> completed
  const updateOrderStatus = async (orderId, newStatus) => {
    const updates = { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    };

    if (newStatus === 'served') {
      updates.servedAt = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), updates);
      } catch (err) {
        console.warn('Firebase status update error:', err);
      }
    }

    localStore.updateOrderStatus(orderId, newStatus);
    const updated = localStore.getOrders();
    setOrders([...updated]);
  };

  // Update preparation ETA from Kitchen/Admin (instantly updates customer view)
  const updateOrderEta = async (orderId, newMinutes) => {
    const minutes = Math.max(1, parseInt(newMinutes) || 20);
    const rangeStr = `${minutes}–${minutes + 5} min`;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          estimatedPrepMinutes: minutes,
          prepTimeRange: rangeStr,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firebase ETA update error:', err);
      }
    }

    localStore.updateOrderEta(orderId, minutes, rangeStr);
    const updated = localStore.getOrders();
    setOrders([...updated]);
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
          const ords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(ords);
        }
      } catch (e) {
        console.warn('Error refreshing orders', e);
      }
    } else {
      const latest = localStore.getOrders();
      setOrders([...latest]);
    }
  };

  const reloadLatestMenu = () => {
    try {
      setMenuItems(localStore.getMenuItems());
      setCategories(localStore.getCategories());
      setTables(localStore.getTables());
      setOrders(localStore.getOrders());
    } catch (e) {
      console.warn('Reload menu error', e);
    }
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
      placeOrder,
      getTableActiveOrders,
      getCombinedTableBill,
      requestTableBill,
      requestCashPaymentForTable,
      payTableBill,
      markTableAsPaidByAdmin,
      markOrderAsPaidByAdmin,
      refundOrder,
      updateOrderStatus,
      updateOrderEta,
      assignTableToWaitingOrder,
      refreshOrders,
      reloadLatestMenu,
      latestPlacedOrderId,
      lastSyncTime,
      customerFeedbacks,
      submitOrderFeedback
    }}>
      {children}
    </TableOrderContext.Provider>
  );
}

export function useTableOrder() {
  return useContext(TableOrderContext);
}

