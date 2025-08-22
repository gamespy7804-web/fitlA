
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the user state update and redirection
    } catch (error: any) {
      // Gracefully handle the case where the user closes the sign-in popup.
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
         // No need to log error, this is expected user behavior
      } else {
        console.error('Error signing in with Google', error);
      }
    } finally {
      // Set loading to false if user cancels, so UI becomes responsive again
      if (!auth.currentUser) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear all user-related data from localStorage
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('firebase:')) return; // Preserve Firebase's own storage
          localStorage.removeItem(key);
      });
      // Clear any session storage as well
      sessionStorage.clear();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };
  
  const value = { user, loading, signInWithGoogle, signOut };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
