
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
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        // On successful sign-in, Firebase's onAuthStateChanged will trigger
        // and update the user state globally. We can then redirect.
        toast({ title: "¡Sesión iniciada!", description: "Tu progreso ahora está sincronizado con tu cuenta." });
        router.push('/settings');
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
           // This is expected user behavior, no need to log or toast.
        } else {
            console.error('Error signing in with Google', error);
            toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.'});
        }
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
      // The onAuthStateChanged listener will set user to null.
      // We don't need to clear local storage here if we want progress to remain for anonymous re-login.
      // Let's keep the data and just sign out.
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/settings');
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const resetAccountData = async () => {
    cleanUpUserSession(); // This will clear all data and redirect to login, which is now the desired behavior for a full reset
    if (auth.currentUser) {
        await firebaseSignOut(auth);
    }
    toast({
        title: "Datos de la cuenta restablecidos",
        description: "Todo tu progreso ha sido eliminado. Ahora puedes empezar de nuevo.",
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
