import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { db, isFirebaseConfigured, mobileStore } from '../firebase/config';
import { collection, doc, getDoc, onSnapshot, getDocs } from 'firebase/firestore';

interface TableContextType {
  currentTable: string | null;
  tableDetails: any | null;
  setTable: (tableNum: string) => Promise<boolean>;
  clearTable: () => Promise<void>;
  validateTable: (tableNum: string) => Promise<boolean>;
  menuItems: any[];
  categories: any[];
  tables: any[];
  orders: any[];
}

const TableContext = createContext<TableContextType>({} as TableContextType);

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<any | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>(mobileStore.getInitialMenuItems());
  const [categories, setCategories] = useState<any[]>(mobileStore.getInitialCategories());
  const [tables, setTables] = useState<any[]>(mobileStore.getInitialTables());
  const [orders, setOrders] = useState<any[]>(mobileStore.getInitialOrders());

  useEffect(() => {
    loadSavedTable();
    setupRealtimeListeners();
    handleDeepLinks();
  }, []);

  const loadSavedTable = async () => {
    try {
      const saved = await AsyncStorage.getItem('smartdine_active_table');
      if (saved) {
        setCurrentTable(saved);
        const match = tables.find(t => t.tableNumber === saved);
        if (match) setTableDetails(match);
      }
    } catch (e) {
      console.warn('Error loading table session', e);
    }
  };

  const handleDeepLinks = async () => {
    // Check initial URL
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) parseAndSetTableFromUrl(initialUrl);

    // Listen for incoming URLs while app is open
    const sub = Linking.addEventListener('url', (event) => {
      parseAndSetTableFromUrl(event.url);
    });
    return () => sub.remove();
  };

  const parseAndSetTableFromUrl = (url: string) => {
    // E.g. smartdine://table/01 or https://smartdine.netlify.app/menu?table=01
    let tableNum: string | null = null;

    if (url.includes('smartdine://table/')) {
      const parts = url.split('smartdine://table/');
      if (parts[1]) tableNum = parts[1].split('?')[0];
    } else if (url.includes('table=')) {
      const match = url.match(/[?&]table=([^&#]*)/);
      if (match) tableNum = match[1];
    }

    if (tableNum) {
      const formatted = String(tableNum).padStart(2, '0');
      setTable(formatted);
    }
  };

  const setupRealtimeListeners = () => {
    if (isFirebaseConfigured) {
      onSnapshot(collection(db, 'menuItems'), (snap) => {
        if (!snap.empty) {
          setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });

      onSnapshot(collection(db, 'categories'), (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });

      onSnapshot(collection(db, 'tables'), (snap) => {
        if (!snap.empty) {
          setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      });
    }
  };

  const validateTable = async (tableNum: string): Promise<boolean> => {
    const formatted = String(tableNum).padStart(2, '0');
    // Check if table exists in active tables list
    const found = tables.find(t => t.tableNumber === formatted && t.active !== false);
    return Boolean(found);
  };

  const setTable = async (tableNum: string): Promise<boolean> => {
    const formatted = String(tableNum).padStart(2, '0');
    const isValid = await validateTable(formatted);
    if (!isValid) return false;

    setCurrentTable(formatted);
    const details = tables.find(t => t.tableNumber === formatted);
    setTableDetails(details || null);
    await AsyncStorage.setItem('smartdine_active_table', formatted);
    return true;
  };

  const clearTable = async () => {
    setCurrentTable(null);
    setTableDetails(null);
    await AsyncStorage.removeItem('smartdine_active_table');
  };

  return (
    <TableContext.Provider value={{
      currentTable,
      tableDetails,
      setTable,
      clearTable,
      validateTable,
      menuItems,
      categories,
      tables,
      orders
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  return useContext(TableContext);
}
