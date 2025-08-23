'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
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
      await signInWithRedirect(auth, provider);
      // The redirect flow will handle the rest. The onAuthStateChanged listener
      // will pick up the user when they are redirected back to the app.
    } catch (error: any) {
        console.error('Error initiating Google sign-in redirect', error);
        toast({ variant: 'destructive', title: 'Error de inicio de sesión', description: 'No se pudo iniciar el proceso de inicio de sesión con Google. Por favor, inténtalo de nuevo.'});
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
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      cleanUpUserSession();
      // The onAuthStateChanged listener will set user to null, and the Home page logic will redirect to /login
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const resetAccountData = async () => {
    cleanUpUserSession();
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    toast({
        title: "Datos de la cuenta restablecidos",
        description: "Todo tu progreso ha sido eliminado. Ahora puedes empezar de nuevo.",
    });
    router.push('/login');
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
