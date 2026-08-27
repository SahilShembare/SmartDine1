import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, isFirebaseConfigured, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCustomerProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedUser();
    if (isFirebaseConfigured) {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Smart Diner',
            photoURL: firebaseUser.photoURL,
            role: 'customer'
          };
          setUser(profile);
          await AsyncStorage.setItem('smartdine_user', JSON.stringify(profile));
        } else {
          setUser(null);
          await AsyncStorage.removeItem('smartdine_user');
        }
        setLoading(false);
      });
      return unsub;
    } else {
      setLoading(false);
    }
  }, []);

  const loadSavedUser = async () => {
    try {
      const saved = await AsyncStorage.getItem('smartdine_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.warn('Error reading saved user', e);
    }
  };

  const login = async (email: string, pass: string) => {
    if (isFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      const mock: UserProfile = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        phoneNumber: '+91 98765 43210',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        role: 'customer'
      };
      setUser(mock);
      await AsyncStorage.setItem('smartdine_user', JSON.stringify(mock));
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    if (isFirebaseConfigured) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      // Create user document in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        phone: phone || '',
        photoUrl: '',
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const mock: UserProfile = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: name,
        phoneNumber: phone || '+91 98765 43210',
        photoURL: null,
        role: 'customer'
      };
      setUser(mock);
      await AsyncStorage.setItem('smartdine_user', JSON.stringify(mock));
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
    await AsyncStorage.removeItem('smartdine_user');
  };

  const updateCustomerProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      await AsyncStorage.setItem('smartdine_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateCustomerProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
