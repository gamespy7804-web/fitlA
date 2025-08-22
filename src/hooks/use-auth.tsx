
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  reauthenticateWithPopup,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
      // After successful sign-in, onAuthStateChanged will fire.
      // We explicitly check for onboarding and redirect here to make it robust.
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
         // This is expected user behavior, no need to log or toast.
      } else {
        console.error('Error signing in with Google', error);
        toast({ variant: 'destructive', title: 'Sign-in Error', description: 'Could not sign in with Google. Please try again.'});
      }
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

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No user is currently signed in.",
        });
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await reauthenticateWithPopup(currentUser, provider);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Re-authentication Failed",
            description: "We couldn't confirm your identity. Please try again.",
        });
        console.error("Re-authentication error:", error);
        return;
    }

    try {
        await deleteUser(currentUser);
        toast({
            title: "Account Deleted",
            description: "Your account has been permanently deleted.",
        });
        cleanUpUserSession();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "An error occurred while deleting your account. Please try again.",
        });
        console.error("Account deletion error:", error);
    }
  }
  
  const value = { user, loading, signInWithGoogle, signOut, deleteAccount };
  
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
