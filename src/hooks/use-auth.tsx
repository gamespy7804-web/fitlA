
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  signInAnonymously,
  linkWithCredential,
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
        setLoading(false);
      } else {
        // If no user, sign in anonymously
        try {
          const { user: anonUser } = await signInAnonymously(auth);
          setUser(anonUser);
        } catch (error) {
           console.error("Anonymous sign-in failed. Please ensure it's enabled in the Firebase Console.", error);
           // If anonymous sign-in fails, we can't proceed. The user will have to sign in manually.
           setLoading(false); // Stop loading so the UI can render the sign-in options.
           return;
        } finally {
            setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth.currentUser) {
        console.error("No user to link google account to.");
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // This is the normal sign-in result, not a link result
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential && auth.currentUser.isAnonymous) {
            await linkWithCredential(auth.currentUser, credential);
            toast({ title: "¡Cuenta Vinculada!", description: "Tu progreso ahora está guardado en tu cuenta de Google." });
        } else {
            toast({ title: "¡Sesión iniciada!", description: "Tu progreso ahora está sincronizado con tu cuenta." });
        }
        router.push('/settings');
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
           // This is expected user behavior, no need to log or toast.
        } else if (error.code === 'auth/credential-already-in-use') {
            toast({ variant: 'destructive', title: 'Error al vincular', description: 'Esta cuenta de Google ya está en uso por otro usuario.'});
        }
        else {
            console.error('Error signing in with Google', error);
            toast({ variant: 'destructive', title: 'Error de inicio de sesión', description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.'});
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
      // The onAuthStateChanged listener will automatically sign the user in anonymously.
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente. Tu progreso local se mantiene." });
      router.push('/settings');
    } catch (error) {
      console.error('Error signing out', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const resetAccountData = async () => {
    const isAnon = user?.isAnonymous;
    cleanUpUserSession(); 
    if (!isAnon && auth.currentUser) {
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
