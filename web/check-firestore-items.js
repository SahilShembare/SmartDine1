import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkItems() {
  const snap = await getDocs(collection(db, 'menuItems'));
  console.log(`Total menuItems in Firestore: ${snap.size}`);
  snap.docs.slice(0, 10).forEach(doc => {
    const data = doc.data();
    console.log(`- [${doc.id}] ${data.name}: imageUrl = ${data.imageUrl}`);
  });
  process.exit(0);
}

checkItems();
