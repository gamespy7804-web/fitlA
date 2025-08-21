
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface MusicContextType {
  isMusicEnabled: boolean;
  toggleMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);

  // Load the user's preference from localStorage when the app loads
  useEffect(() => {
    try {
      const storedPreference = localStorage.getItem('musicEnabled');
      if (storedPreference !== null) {
        setIsMusicEnabled(JSON.parse(storedPreference));
      } else {
        // Default to enabled if no preference is set
        setIsMusicEnabled(true);
        localStorage.setItem('musicEnabled', JSON.stringify(true));
      }
    } catch (error) {
      console.error("Could not parse music preference from localStorage", error);
      setIsMusicEnabled(true); // Default to true on error
    }
  }, []);

  // A memoized function to toggle music and save the preference
  const toggleMusic = useCallback(() => {
    setIsMusicEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('musicEnabled', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const value = { isMusicEnabled, toggleMusic };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
