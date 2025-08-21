
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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Let the onAuthStateChanged listener handle redirection by updating the user state
    } catch (error: any) {
      // Gracefully handle the case where the user closes the sign-in popup.
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Error signing in with Google', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear local storage related to the user's session
      localStorage.removeItem('onboardingComplete');
      localStorage.removeItem('workoutRoutine');
      localStorage.removeItem('completedWorkouts');
      localStorage.removeItem('detailedWorkoutLogs');
      localStorage.removeItem('pendingFeedbackExercises');
      localStorage.removeItem('quizHistory');
      localStorage.removeItem('triviaHistory');
      localStorage.removeItem('musicEnabled');
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
