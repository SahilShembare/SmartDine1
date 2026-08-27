import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured, mobileStore } from '../firebase/config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { useTable } from './TableContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isVeg?: boolean;
  instructions?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any, quantity?: number, instructions?: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartCount: number;
  placeOrder: (customerInfo: { name: string; phone?: string; customerId?: string | null; notes?: string; paymentMethod?: string }) => Promise<string>;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentTable } = useTable();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadSavedCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cart]);

  const loadSavedCart = async () => {
    try {
      const saved = await AsyncStorage.getItem('smartdine_mobile_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {
      console.warn('Error reading cart', e);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('smartdine_mobile_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Error saving cart', e);
    }
  };

  const addToCart = (item: any, quantity = 1, instructions = '') => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity, instructions: instructions || i.instructions }
            : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: quantity,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          instructions: instructions
        }
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = async () => {
    setCart([]);
    await AsyncStorage.removeItem('smartdine_mobile_cart');
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (customerInfo: {
    name: string;
    phone?: string;
    customerId?: string | null;
    notes?: string;
    paymentMethod?: string;
  }): Promise<string> => {
    if (cart.length === 0) throw new Error('Cart is empty.');
    if (!currentTable) throw new Error('No table connected. Please scan table QR.');

    const orderData = {
      tableNumber: currentTable,
      customerName: customerInfo.name || `Table ${currentTable} Guest`,
      customerPhone: customerInfo.phone || '',
      customerId: customerInfo.customerId || null,
      items: cart.map((i) => ({
        itemId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl || '',
        isVeg: i.isVeg !== undefined ? i.isVeg : true,
        instructions: i.instructions || ''
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      notes: customerInfo.notes || '',
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: customerInfo.paymentMethod || 'Pay after Dining',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isFirebaseConfigured) {
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      orderId = docRef.id;
    }

    // Save order history locally
    try {
      const historyStr = await AsyncStorage.getItem('smartdine_order_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift({ id: orderId, ...orderData });
      await AsyncStorage.setItem('smartdine_order_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Error saving local history', e);
    }

    await clearCart();
    return orderId;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        cartCount,
        placeOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
