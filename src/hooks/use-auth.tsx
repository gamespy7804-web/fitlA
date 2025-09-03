
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // No user is signed in. Create a new anonymous user.
        try {
          const { user: anonUser } = await signInAnonymously(auth);
          setUser(anonUser);
        } catch (error) {
           console.error("Anonymous sign-in failed", error);
           toast({ variant: 'destructive', title: 'Error de conexión', description: 'No se pudo iniciar una sesión. Por favor, revisa tu conexión y recarga la página.'});
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        if (auth.currentUser && auth.currentUser.isAnonymous) {
            // User is anonymous, link their data to a new Google account.
            // Firestore data migration will happen on the next auth state change automatically.
            await linkWithRedirect(auth.currentUser, provider);
        } else {
            // No user or a signed-in user wants to sign in again (shouldn't happen often)
            await signInWithRedirect(auth, provider);
        }
    } catch (error: any) {
        console.error('Error initiating Google sign-in/linking', error);
        toast({ variant: 'destructive', title: 'Error de inicio de sesión', description: 'No se pudo iniciar el proceso de inicio de sesión con Google. Por favor, inténtalo de nuevo.'});
    }
  };

  const signOut = async () => {
    const wasRealUser = auth.currentUser && !auth.currentUser.isAnonymous;
    try {
      await firebaseSignOut(auth);
      
      // The onAuthStateChanged listener will handle signing in a new anonymous user automatically.
      // The useUserData hook will listen for this user change and reset the data.
      
      if (wasRealUser) {
        toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente. Tu progreso ya no está sincronizado." });
      }
      // Redirecting to home will ensure a clean state with a new anonymous user.
      router.push('/');
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const resetAccountData = async () => {
    // The actual data reset logic is in useUserData, triggered by signOut.
    const wasRealUser = auth.currentUser && !auth.currentUser.isAnonymous;
    
    // If it was a real user, sign them out. This will trigger onAuthStateChanged,
    // which will create a new anonymous user and trigger a data reset in useUserData.
    if (wasRealUser) {
      await firebaseSignOut(auth);
    } else {
        // If the user is anonymous, we just force a reload, which will trigger a reset in useUserData
        // because all its state is in-memory or tied to the session.
        localStorage.clear();
        window.location.href = '/';
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
