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
  { email: 'admin@smartdine.com', name: 'Master Admin', role: 'admin' },
  { email: 'kitchen@smartdine.com', name: 'Kitchen Chef', role: 'kitchen' }
];

function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem('smartdine_registered_users');
    if (!raw) {
      localStorage.setItem('smartdine_registered_users', JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Clean legacy hardcoded user test emails so real registration works smoothly
      const cleaned = parsed.filter(u => u.email !== 'shembaresahil12@gmail.com' && u.email !== 'customer@smartdine.com');
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('smartdine_registered_users', JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return DEFAULT_ACCOUNTS;
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

    // 3. Check server-side registry API
    try {
      const url = isEmail
        ? `/api/check-duplicate-user?email=${encodeURIComponent(cleanId)}`
        : `/api/check-duplicate-user?phone=${encodeURIComponent(cleanDigits)}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data && data.isDuplicate) return true;
      }
    } catch (e) {}

    // 4. If Firebase is configured, check Firestore registered_users
    if (isFirebaseConfigured && db && isEmail) {
      try {
        const docRef = doc(db, 'registered_users', cleanId);
        const snap = await getDoc(docRef);
        if (snap.exists()) return true;
      } catch (e) {
        console.warn('Firestore lookup note:', e);
      }
    }

    // 5. Also check Firebase Auth methods if email
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

    // Helper for fast timeout on external network checks
    const withTimeout = (promise, ms = 2500) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Network check timed out')), ms))
      ]);

    // 1. Check server-side registry API (Fast 2.5s AbortController)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`/api/check-duplicate-user?email=${encodeURIComponent(cleanEmail)}&phone=${encodeURIComponent(cleanPhone)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data && data.isDuplicate) {
          return data;
        }
      }
    } catch (e) {
      // Gracefully continue on network timeout
    }

    // 2. Check if Email is already registered locally
    if (cleanEmail) {
      const emailUser = list.find(u => u.email?.toLowerCase() === cleanEmail);
      if (emailUser) {
        return {
          isDuplicate: true,
          field: 'email',
          message: `This Email "${email}" is already registered. Please log in to continue.`,
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
          message: `This Mobile Number "${phone}" is already registered. Please log in to continue.`,
          toastMessage: `Mobile "${phone}" is already registered! Please login.`
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
          message: `An account with name "${name}" and this email is already registered. Please log in.`,
          toastMessage: `Account already exists for "${name}". Please login.`
        };
      }
    }

    // 4. Firestore check for email (with 2.5s timeout)
    if (isFirebaseConfigured && db && cleanEmail) {
      try {
        const docRef = doc(db, 'registered_users', cleanEmail);
        const snap = await withTimeout(getDoc(docRef), 2500);
        if (snap.exists()) {
          return {
            isDuplicate: true,
            field: 'email',
            message: `This Email "${email}" is already registered. Please log in to continue.`,
            toastMessage: `Email "${email}" is already registered! Please login.`
          };
        }
      } catch (e) {
        // Continue if Firestore is slow or offline
      }
    }

    // 5. Firebase Auth check for email (with 2.5s timeout)
    if (isFirebaseConfigured && auth && cleanEmail) {
      try {
        const methods = await withTimeout(fetchSignInMethodsForEmail(auth, cleanEmail), 2500);
        if (methods && methods.length > 0) {
          return {
            isDuplicate: true,
            field: 'email',
            message: `This Email "${email}" is already registered. Please log in to continue.`,
            toastMessage: `Email "${email}" is already registered! Please login.`
          };
        }
      } catch (e) {}
    }

    return { isDuplicate: false };
  };

  const loginWithEmail = async (emailOrPhone, password) => {
    const rawInput = String(emailOrPhone || '').trim();
    const cleanEmail = rawInput.toLowerCase();
    const cleanDigits = rawInput.replace(/\D/g, '');
    const isMobileNumber = cleanDigits.length === 10;

    // 1. Resolve registered user from local list if available
    const list = getRegisteredAccounts();
    const localUser = list.find(u => {
      if (!u) return false;
      const emailMatch = u.email && u.email.toLowerCase() === cleanEmail;
      const phoneMatch = isMobileNumber && u.phone && String(u.phone).replace(/\D/g, '') === cleanDigits;
      const customerDomainMatch = cleanEmail.endsWith('@smartdine.customer') && u.phone && cleanEmail.startsWith(String(u.phone).replace(/\D/g, ''));
      return emailMatch || phoneMatch || customerDomainMatch;
    });

    // If logging in via phone number, use their real registered email if found
    const targetEmail = (isMobileNumber && localUser?.email) ? localUser.email.toLowerCase() : cleanEmail;

    if (isFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, targetEmail, password);
        return cred.user;
      } catch (firebaseErr) {
        console.warn('Firebase signIn failed, checking registered password store:', firebaseErr.code);

        // 1. Check local storage registered accounts
        if (localUser && localUser.password === password) {
          const role = localUser.role || (cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('kitchen') ? 'kitchen' : 'customer');
          const userData = {
            uid: localUser.uid || `local-${Date.now()}`,
            email: localUser.email || cleanEmail,
            displayName: localUser.name || (localUser.email ? localUser.email.split('@')[0] : 'User'),
            role: role
          };
          setCurrentUser(userData);
          localStorage.setItem('smartdine_auth_user', JSON.stringify(userData));
          return userData;
        }

        // 2. Check server-side verified credentials API
        try {
          const res = await fetch('/api/verify-user-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              identifier: rawInput,
              phone: isMobileNumber ? cleanDigits : undefined,
              password
            })
          });
          if (res.ok) {
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (data && data.matched && data.user) {
              const userData = {
                uid: `server-${Date.now()}`,
                email: data.user.email || cleanEmail,
                displayName: data.user.name || (data.user.email ? data.user.email.split('@')[0] : 'User'),
                role: data.user.role || 'customer'
              };
              setCurrentUser(userData);
              localStorage.setItem('smartdine_auth_user', JSON.stringify(userData));
              return userData;
            }
          }
        } catch (serverErr) {
          console.warn('Server credentials verify error:', serverErr);
        }

        // 3. Check Firestore registered_users document
        if (db) {
          try {
            const snap = await getDoc(doc(db, 'registered_users', targetEmail));
            if (snap.exists() && snap.data()?.password === password) {
              const uData = snap.data();
              const userData = {
                uid: `firestore-${Date.now()}`,
                email: uData.email || cleanEmail,
                displayName: uData.name || cleanEmail.split('@')[0],
                role: uData.role || 'customer'
              };
              setCurrentUser(userData);
              localStorage.setItem('smartdine_auth_user', JSON.stringify(userData));
              return userData;
            }
          } catch (fsErr) {}
        }

        // Friendly error message for UI instead of raw Firebase error
        const isInvalidCred = firebaseErr.code === 'auth/invalid-credential' || firebaseErr.message?.includes('invalid-credential');
        const errMessage = isInvalidCred
          ? 'Invalid email/mobile or password. Please verify your credentials or register a new account.'
          : (firebaseErr.message || 'Login failed. Please check your credentials.');

        const friendlyErr = new Error(errMessage);
        friendlyErr.code = firebaseErr.code || 'auth/invalid-credential';
        throw friendlyErr;
      }
    } else {
      // Local authentication fallback
      const role = cleanEmail.includes('admin') ? 'admin' : 
                   cleanEmail.includes('kitchen') ? 'kitchen' : 'customer';
      const mockUser = {
        uid: `usr-${role}-${Date.now()}`,
        email: cleanEmail,
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
        password: password,
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
          password: password,
          role: role,
          registeredAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Error syncing user to Firestore:', e);
      }
    }

    // Sync to Server DB
    try {
      await fetch('/api/record-registered-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          role: role
        })
      });
      await fetch('/api/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password
        })
      });
    } catch (e) {}

    if (isFirebaseConfigured) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: name });
        return cred.user;
      } catch (authErr) {
        console.warn('Firebase createUser note:', authErr.code);
        const mockUser = {
          uid: `user-${Date.now()}`,
          email: cleanEmail,
          displayName: name,
          role: role,
          photoURL: null
        };
        setCurrentUser(mockUser);
        localStorage.setItem('smartdine_auth_user', JSON.stringify(mockUser));
        return mockUser;
      }
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

  const sendRealResetEmail = async (emailAddress, baseUrl = (typeof window !== 'undefined' ? window.location.origin : '')) => {
    const cleanEmail = emailAddress.trim().toLowerCase();
    
    // 1. Send real email via our high-reliability Gmail SMTP serverless endpoint
    try {
      const res = await fetch('/api/send-password-reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, baseUrl })
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reset link email.');
      }
      
      // Also trigger Firebase Auth as secondary fallback
      if (isFirebaseConfigured && auth) {
        try { await sendPasswordResetEmail(auth, cleanEmail); } catch {}
      }

      return { success: true, message: data.message || 'Password reset link sent to your email!' };
    } catch (apiErr) {
      console.warn('API reset link error, attempting direct Firebase fallback:', apiErr);
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, cleanEmail);
        return { success: true, message: 'Password reset link dispatched via Firebase.' };
      }
      throw apiErr;
    }
  };

  const resetPasswordWithOtp = async (identifier, newPassword) => {
    const cleanId = String(identifier).trim().toLowerCase();
    const isEmail = cleanId.includes('@');
    const cleanDigits = cleanId.replace(/\D/g, '');

    // 1. Update localStorage
    try {
      const list = getRegisteredAccounts();
      let found = false;
      const updated = list.map(user => {
        if ((isEmail && user.email?.toLowerCase() === cleanId) ||
            (!isEmail && cleanDigits && user.phone && user.phone.replace(/\D/g, '') === cleanDigits)) {
          found = true;
          return { ...user, password: newPassword, updatedAt: new Date().toISOString() };
        }
        return user;
      });
      if (!found && isEmail) {
        updated.push({
          email: cleanId,
          name: cleanId.split('@')[0],
          password: newPassword,
          role: 'customer',
          updatedAt: new Date().toISOString()
        });
      }
      localStorage.setItem('smartdine_registered_users', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving updated password locally:', e);
    }

    // 2. Persist to server-side registry
    if (isEmail) {
      try {
        await fetch('/api/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanId, password: newPassword })
        });
      } catch (e) {
        console.warn('Error updating password via server API:', e);
      }
    }

    // 3. Update Firestore if configured
    if (isFirebaseConfigured && db && isEmail) {
      try {
        await setDoc(doc(db, 'registered_users', cleanId), {
          password: newPassword,
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
      uid: `staff-${role}-1`,
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
