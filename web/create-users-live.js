import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjpryj-feHO_SiyCJXHTlEZcUV-nibyfA",
  authDomain: "smartdine1-81c82.firebaseapp.com",
  projectId: "smartdine1-81c82",
  storageBucket: "smartdine1-81c82.firebasestorage.app",
  messagingSenderId: "732105111093",
  appId: "1:732105111093:web:1018e79194d3f0faa7637c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_USERS = [
  {
    name: "Restaurant Administrator",
    email: "admin@smartdine.com",
    password: "admin123456",
    role: "admin"
  },
  {
    name: "Master Chef Kitchen",
    email: "kitchen@smartdine.com",
    password: "kitchen123456",
    role: "kitchen"
  },
  {
    name: "Rahul Sharma (Customer)",
    email: "customer@smartdine.com",
    password: "customer123456",
    role: "customer"
  }
];

async function createUsers() {
  console.log('🚀 Creating default users in Live Firebase (smartdine1-81c82)...');

  for (const user of DEFAULT_USERS) {
    try {
      console.log(`\nCreating User: ${user.name} (${user.role})...`);
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        console.log(`  ✓ Registered in Firebase Auth with UID: ${userCredential.user.uid}`);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log(`  ℹ User already exists in Auth. Signing in to sync Firestore role...`);
          userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
        } else {
          throw authErr;
        }
      }

      const uid = userCredential.user.uid;
      await updateProfile(userCredential.user, { displayName: user.name });

      // Save role into Firestore 'users' collection
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        displayName: user.name,
        email: user.email,
        role: user.role,
        createdAt: new Date().toISOString()
      }, { merge: true });

      console.log(`  ✓ Saved user profile & role '${user.role}' in Firestore users/${uid}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${user.email}:`, err.message);
    }
  }

  console.log('\n🎉 ALL 3 USERS (Admin, Kitchen, Customer) CREATED SUCCESSFULLY IN FIREBASE!');
  process.exit(0);
}

createUsers();
