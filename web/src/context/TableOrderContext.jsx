import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, localStore, isFirebaseConfigured } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';

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
  const [orders, setOrders] = useState(() => localStore.getOrders());
  const [latestPlacedOrderId, setLatestPlacedOrderId] = useState(() => {
    return localStorage.getItem('smartdine_last_order_id') || null;
  });

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
          setTables(tbls);
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

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place order
  const placeOrder = async ({ customerName, customerPhone, customerId = null, notes = '', paymentMethod = 'Pay at Counter' }) => {
    if (cart.length === 0) throw new Error('Cart is empty');
    if (!currentTable) throw new Error('No table selected. Please scan table QR.');

    const orderData = {
      tableNumber: currentTable,
      customerName: customerName || `Table ${currentTable} Guest`,
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
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      notes: notes,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let orderId = '';

    if (isFirebaseConfigured) {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      orderId = docRef.id;
    } else {
      const created = localStore.addOrder(orderData);
      orderId = created.id;
    }

    setLatestPlacedOrderId(orderId);
    localStorage.setItem('smartdine_last_order_id', orderId);
    clearCart();
    return orderId;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    if (!isFirebaseConfigured) {
      localStore.updateOrderStatus(orderId, newStatus);
      const updated = localStore.getOrders();
      setOrders([...updated]);
    }
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
      updateOrderStatus,
      refreshOrders,
      latestPlacedOrderId,
      lastSyncTime
    }}>
      {children}
    </TableOrderContext.Provider>
  );
}

export function useTableOrder() {
  return useContext(TableOrderContext);
}
