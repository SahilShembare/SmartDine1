import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULT_ACCOUNTS = [
  { email: 'shembaresahil12@gmail.com', name: 'Sahil Shembare', role: 'customer' },
  { email: 'admin@smartdine.com', name: 'Master Admin', role: 'admin' },
  { email: 'kitchen@smartdine.com', name: 'Kitchen Chef', role: 'kitchen' },
  { email: 'customer@smartdine.com', name: 'VIP Customer', role: 'customer' }
];

function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem('smartdine_registered_users');
    if (!raw) {
      localStorage.setItem('smartdine_registered_users', JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartdine_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize registered accounts registry
  useEffect(() => {
    getRegisteredAccounts();
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Determine role
          const role = user.email?.includes('admin') ? 'admin' : 
                       user.email?.includes('kitchen') ? 'kitchen' : 'customer';
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL,
            role: role
          };
          setCurrentUser(userData);
          localStorage.setItem('smartdine_auth_user', JSON.stringify(userData));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('smartdine_auth_user');
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  // Check if an email or mobile number is registered
  const checkIsUserRegistered = async (identifier) => {
    if (!identifier) return false;
    const cleanId = String(identifier).trim().toLowerCase();
    const isEmail = cleanId.includes('@');
    const cleanDigits = cleanId.replace(/\D/g, '');

    // 1. Check local persistent list
    const list = getRegisteredAccounts();
    const foundLocal = list.some(acc => {
      if (isEmail && acc.email?.toLowerCase() === cleanId) return true;
      if (!isEmail && cleanDigits && acc.phone && acc.phone.replace(/\D/g, '') === cleanDigits) return true;
      return false;
    });
    if (foundLocal) return true;

    // 2. Check current saved auth / guest session
    try {
      const savedAuth = JSON.parse(localStorage.getItem('smartdine_auth_user') || '{}');
      if (savedAuth.email && savedAuth.email.toLowerCase() === cleanId) return true;
      const guestPhone = localStorage.getItem('smartdine_guest_phone');
      if (!isEmail && cleanDigits && guestPhone && guestPhone.replace(/\D/g, '') === cleanDigits) return true;
    } catch {}

    // 3. If Firebase is configured, check Firestore registered_users
    if (isFirebaseConfigured && db && isEmail) {
      try {
        const docRef = doc(db, 'registered_users', cleanId);
        const snap = await getDoc(docRef);
        if (snap.exists()) return true;
      } catch (e) {
        console.warn('Firestore lookup note:', e);
      }
    }

    // 4. Also check Firebase Auth methods if email
    if (isFirebaseConfigured && auth && isEmail) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanId);
        if (methods && methods.length > 0) return true;
      } catch (e) {
        // Ignored if enumeration protection is on
      }
    }

    return false;
  };

  // Check if an account already exists before allowing new registration
  const checkDuplicateRegistration = async ({ name, email, phone }) => {
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const cleanName = name ? String(name).trim().toLowerCase() : '';

    const list = getRegisteredAccounts();

    // 1. Check server-side registry API
    try {
      const res = await fetch(`/api/check-duplicate-user?email=${encodeURIComponent(cleanEmail)}&phone=${encodeURIComponent(cleanPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.isDuplicate) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Server API duplicate check note:', e);
    }

    // 2. Check if Email is already registered locally
    if (cleanEmail) {
      const emailUser = list.find(u => u.email?.toLowerCase() === cleanEmail);
      if (emailUser) {
        return {
          isDuplicate: true,
          field: 'email',
          message: `Yeh Email "${email}" pehle se registered hai (Already filled). Same email se repeat registration allow nahi hai. Kripya Login karein.`,
          toastMessage: `Email "${email}" is already registered! Please login.`
        };
      }
    }

    // 2. Check if Mobile number is already registered
    if (cleanPhone && cleanPhone.length === 10) {
      const phoneUser = list.find(u => u.phone && u.phone.replace(/\D/g, '') === cleanPhone);
      if (phoneUser) {
        return {
          isDuplicate: true,
          field: 'phone',
          message: `Yeh Mobile Number "+91 ${phone}" pehle se registered hai (Already filled). Kripya Login karein.`,
          toastMessage: `Mobile "+91 ${phone}" is already registered! Please login.`
        };
      }
    }

    // 3. Check if Name + Email combination is already registered
    if (cleanName && cleanEmail) {
      const nameUser = list.find(u => u.name && u.name.trim().toLowerCase() === cleanName);
      if (nameUser && nameUser.email?.toLowerCase() === cleanEmail) {
        return {
          isDuplicate: true,
          field: 'name_email',
          message: `Yeh Naam "${name}" aur Email pehle se registered hain (Already filled). Kripya Login karein.`,
          toastMessage: `Account already exists for "${name}". Please login.`
        };
      }
    }

    // 4. Firestore check for email
    if (isFirebaseConfigured && db && cleanEmail) {
      try {
        const docRef = doc(db, 'registered_users', cleanEmail);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return {
            isDuplicate: true,
            field: 'email',
            message: `Yeh Email "${email}" pehle se registered hai (Already filled). Kripya Login karein.`,
            toastMessage: `Email "${email}" is already registered! Please login.`
          };
        }
      } catch (e) {
        console.warn('Firestore duplicate check note:', e);
      }
    }

    // 5. Firebase Auth check for email
    if (isFirebaseConfigured && auth && cleanEmail) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        if (methods && methods.length > 0) {
          return {
            isDuplicate: true,
            field: 'email',
            message: `Yeh Email "${email}" pehle se registered hai (Already filled). Kripya Login karein.`,
            toastMessage: `Email "${email}" is already registered! Please login.`
          };
        }
      } catch (e) {}
    }

    return { isDuplicate: false };
  };

  const loginWithEmail = async (email, password) => {
    if (isFirebaseConfigured) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } else {
      // Demo authentication simulation
      const role = email.includes('admin') ? 'admin' : 
                   email.includes('kitchen') ? 'kitchen' : 'customer';
      const mockUser = {
        uid: `demo-${role}-${Date.now()}`,
        email: email,
        displayName: role === 'admin' ? 'Head Administrator' : role === 'kitchen' ? 'Head Chef (Kitchen)' : 'Customer Guest',
        role: role,
        photoURL: null
      };
      setCurrentUser(mockUser);
      localStorage.setItem('smartdine_auth_user', JSON.stringify(mockUser));
      return mockUser;
    }
  };

  const registerWithEmail = async (name, email, password, role = 'customer', phone = '') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : '';

    // Save to persistent registry
    try {
      const currentList = getRegisteredAccounts();
      const updatedList = currentList.filter(u => u.email?.toLowerCase() !== cleanEmail);
      updatedList.push({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: role,
        registeredAt: new Date().toISOString()
      });
      localStorage.setItem('smartdine_registered_users', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Error saving to registered users list:', e);
    }

    // Sync to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'registered_users', cleanEmail), {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          role: role,
          registeredAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Error syncing user to Firestore:', e);
      }
    }

    if (isFirebaseConfigured) {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: name });
      return cred.user;
    } else {
      const mockUser = {
        uid: `demo-user-${Date.now()}`,
        email: cleanEmail,
        displayName: name,
        role: role,
        photoURL: null
      };
      setCurrentUser(mockUser);
      localStorage.setItem('smartdine_auth_user', JSON.stringify(mockUser));
      return mockUser;
    }
  };

  const sendRealResetEmail = async (emailAddress) => {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, emailAddress);
      return { success: true, message: 'Password reset link sent to your real email!' };
    } else {
      return { success: true, message: 'Simulated email sent' };
    }
  };

  const resetPasswordWithOtp = async (identifier, newPassword) => {
    const cleanId = String(identifier).trim().toLowerCase();
    const isEmail = cleanId.includes('@');
    const cleanDigits = cleanId.replace(/\D/g, '');

    try {
      const list = getRegisteredAccounts();
      const updated = list.map(user => {
        if ((isEmail && user.email?.toLowerCase() === cleanId) ||
            (!isEmail && cleanDigits && user.phone && user.phone.replace(/\D/g, '') === cleanDigits)) {
          return { ...user, password: newPassword, updatedAt: new Date().toISOString() };
        }
        return user;
      });
      localStorage.setItem('smartdine_registered_users', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving updated password locally:', e);
    }

    if (isFirebaseConfigured && db && isEmail) {
      try {
        await setDoc(doc(db, 'registered_users', cleanId), {
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}
    }

    return { success: true, message: 'Password reset successfully' };
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('smartdine_auth_user');
  };

  const demoLogin = (role) => {
    const mockUser = {
      uid: `demo-${role}-1`,
      email: `${role}@smartdine.com`,
      displayName: role === 'admin' ? 'Master Admin' : role === 'kitchen' ? 'Kitchen Chef' : 'VIP Diner',
      role: role,
      photoURL: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`
    };
    setCurrentUser(mockUser);
    localStorage.setItem('smartdine_auth_user', JSON.stringify(mockUser));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      loginWithEmail,
      registerWithEmail,
      sendRealResetEmail,
      resetPasswordWithOtp,
      checkIsUserRegistered,
      checkDuplicateRegistration,
      logout,
      demoLogin,
      isAdmin: currentUser?.role === 'admin',
      isKitchen: currentUser?.role === 'kitchen' || currentUser?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
