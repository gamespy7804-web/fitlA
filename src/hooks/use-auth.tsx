
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
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetAccountData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

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
        // After the popup closes, we need to ensure the onAuthStateChanged listener has fired
        // and updated the user state before we proceed. We can wrap it in a promise.
        await new Promise<void>((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    unsubscribe();
                    resolve();
                }
            });
            // Add a timeout to prevent hanging indefinitely if something goes wrong
            setTimeout(() => {
                unsubscribe();
                reject(new Error("Authentication timed out."));
            }, 10000); // 10-second timeout
        });
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
           // This is expected user behavior, no need to log or toast.
        } else {
            console.error('Error signing in with Google', error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.'});
        }
    } finally {
        setLoading(false);
    }
  };

  const cleanUpUserSession = () => {
    // Clear all user-related data from localStorage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:')) return; // Preserve Firebase's own storage
        localStorage.removeItem(key);
    });
    // Clear any session storage as well
    sessionStorage.clear();
    router.push('/login');
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      cleanUpUserSession();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const resetAccountData = async () => {
    if (!auth.currentUser) {
       toast({
            variant: "destructive",
            title: "Error",
            description: "No user is currently signed in.",
        });
        return;
    }
    await signOut();
    toast({
        title: "Account Data Reset",
        description: "All your progress has been reset. You can now start over.",
    });
  }
  
  const value = { user, loading, signInWithGoogle, signOut, resetAccountData };
  
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
