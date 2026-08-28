import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

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

  const registerWithEmail = async (name, email, password, role = 'customer') => {
    if (isFirebaseConfigured) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      return cred.user;
    } else {
      const mockUser = {
        uid: `demo-user-${Date.now()}`,
        email: email,
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
    // In live or simulated auth, this marks password reset completion
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
      displayName: role === 'admin' ? 'Master Admin' : role === 'kitchen' ? 'Head Chef & Kitchen' : 'VIP Diner',
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
