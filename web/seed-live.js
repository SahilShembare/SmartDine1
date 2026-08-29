import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_TABLES, DEMO_ORDERS } from '../firebase/seed-data.js';

const firebaseConfig = {
  apiKey: "AIzaSyDjpryj-feHO_SiyCJXHTlEZcUV-nibyfA",
  authDomain: "smartdine1-81c82.firebaseapp.com",
  projectId: "smartdine1-81c82",
  storageBucket: "smartdine1-81c82.firebasestorage.app",
  messagingSenderId: "732105111093",
  appId: "1:732105111093:web:1018e79194d3f0faa7637c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
  console.log('🚀 Synchronizing Live Firestore database (smartdine1-81c82)...');

  try {
    // 0. Clean up stale categories
    const existingCats = await getDocs(collection(db, 'categories'));
    const activeCatIds = new Set(DEMO_CATEGORIES.map(c => c.id));
    for (const catDoc of existingCats.docs) {
      if (!activeCatIds.has(catDoc.id)) {
        await deleteDoc(doc(db, 'categories', catDoc.id));
        console.log(`  🗑️ Removed old category: ${catDoc.id}`);
      }
    }

    // 0. Clean up stale menuItems
    const existingItems = await getDocs(collection(db, 'menuItems'));
    const activeItemIds = new Set(DEMO_MENU_ITEMS.map(i => i.id));
    for (const itemDoc of existingItems.docs) {
      if (!activeItemIds.has(itemDoc.id)) {
        await deleteDoc(doc(db, 'menuItems', itemDoc.id));
        console.log(`  🗑️ Removed old dish: ${itemDoc.id}`);
      }
    }

    // 1. Upload Categories
    console.log(`📦 Uploading ${DEMO_CATEGORIES.length} Active Categories...`);
    for (const cat of DEMO_CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), cat);
      console.log(`  ✓ Category: ${cat.name}`);
    }

    // 2. Upload Menu Items
    console.log(`🍔 Uploading ${DEMO_MENU_ITEMS.length} Menu Dishes...`);
    for (const item of DEMO_MENU_ITEMS) {
      await setDoc(doc(db, 'menuItems', item.id), item);
      console.log(`  ✓ Dish: ${item.name} (₹${item.price})`);
    }

    // 3. Upload Tables
    console.log(`🪑 Uploading ${DEMO_TABLES.length} Restaurant Tables...`);
    for (const table of DEMO_TABLES) {
      const formattedTable = {
        ...table,
        number: table.tableNumber || table.number || "01",
        tableNumber: table.tableNumber || table.number || "01"
      };
      await setDoc(doc(db, 'tables', table.id), formattedTable);
      console.log(`  ✓ Table ${formattedTable.number}: (${formattedTable.location})`);
    }

    // 4. Upload Sample Orders
    console.log(`🧾 Uploading ${DEMO_ORDERS.length} Sample Orders...`);
    for (const order of DEMO_ORDERS) {
      await setDoc(doc(db, 'orders', order.id), order);
      console.log(`  ✓ Order: #${order.id} for Table ${order.tableNumber}`);
    }

    console.log('\n🎉 SUCCESS! Cleaned up old categories/dishes and synchronized active menu in Cloud Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore Seeding Error:', error);
    process.exit(1);
  }
}

seedFirestore();
