
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  User,
  signInAnonymously,
  linkWithRedirect,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { useUserData } from './use-user-data';

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
  // We can't destructure resetAllData directly as useUserData might not be ready
  const userData = useUserData();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // If no user, sign in anonymously
        try {
          const { user: anonUser } = await signInAnonymously(auth);
          setUser(anonUser);
        } catch (error) {
           console.error("Anonymous sign-in failed", error);
           toast({ variant: 'destructive', title: 'Error de conexión', description: 'No se pudo iniciar una sesión. Por favor, revisa tu conexión y recarga la página.'});
        } finally {
            setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        if (auth.currentUser && auth.currentUser.isAnonymous) {
            // If the user is anonymous, link the account
            await linkWithRedirect(auth.currentUser, provider);
        } else {
            // Otherwise, perform a normal sign-in
            await signInWithRedirect(auth, provider);
        }
    } catch (error: any) {
        console.error('Error initiating Google sign-in/linking', error);
        toast({ variant: 'destructive', title: 'Error de inicio de sesión', description: 'No se pudo iniciar el proceso de inicio de sesión con Google. Por favor, inténtalo de nuevo.'});
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle signing in a new anonymous user.
      // We still clean up so the new anonymous user starts fresh.
      userData?.resetAllData();
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente. Tu progreso ya no está sincronizado." });
      router.push('/'); // Go to home to restart the flow
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const resetAccountData = async () => {
    const wasRealUser = auth.currentUser && !auth.currentUser.isAnonymous;
    userData?.resetAllData();
    
    if (wasRealUser) {
      await firebaseSignOut(auth);
    }
    
    toast({
        title: "Datos de la cuenta restablecidos",
        description: "Todo tu progreso ha sido eliminado. Ahora puedes empezar de nuevo.",
    });
    
    // Force a reload to ensure the anonymous user starts completely fresh
    window.location.href = '/';
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
