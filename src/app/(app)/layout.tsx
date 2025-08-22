'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { WorkoutGeneratorDialog } from './dashboard/workout-generator-dialog';
import { ChatbotSheet } from '@/components/chatbot/chatbot-sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getThemeForSport } from '@/lib/theme';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { initializeAudio, startMusic } from '@/hooks/use-audio-effects';
import { WelcomeOverlay } from './welcome-overlay';
import { Toaster } from '@/components/ui/toaster';
import { OnboardingTour } from '@/components/onboarding-tour';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [themeClass, setThemeClass] = useState('theme-default');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReadyForTour, setIsReadyForTour] = useState(false);
  const pathname = usePathname();
  const isGamePage = pathname === '/games';
  const audioInitialized = useRef(false);

  useEffect(() => {
    // This check should only happen on the client
    if (typeof window !== 'undefined') {
      const hasInteracted = sessionStorage.getItem('userInteracted');
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (!hasInteracted && onboardingComplete) {
        setShowWelcome(true);
      } else if (!hasInteracted && !onboardingComplete) {
        // If they haven't onboarded, the welcome screen will show on the onboarding page
        // But we still need to initialize audio if they come back to the main app
        // so we don't force them through welcome again.
      } else {
        handleFirstInteraction();
        setIsReadyForTour(true);
      }
    }
  }, []);

  const updateTheme = useCallback(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    let currentTheme = 'theme-default';
    if (storedRoutine) {
      try {
        const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
        if (parsedRoutine.structuredRoutine && parsedRoutine.sport) {
          currentTheme = getThemeForSport(parsedRoutine.sport);
        } else if (parsedRoutine.sport) {
          currentTheme = getThemeForSport(parsedRoutine.sport);
        }
      } catch (e) {
        console.error("Failed to parse workout routine for theming");
      }
    }
    setThemeClass(currentTheme);
  }, []);

  useEffect(() => {
    updateTheme();
    window.addEventListener('storage', updateTheme);

    return () => {
      window.removeEventListener('storage', updateTheme);
    }

  }, [pathname, updateTheme]); 
  
  const handleFirstInteraction = () => {
    if (!audioInitialized.current) {
      initializeAudio();
      startMusic('main');
      audioInitialized.current = true;
    }
  };

  const handleWelcomeClick = () => {
    handleFirstInteraction();
    sessionStorage.setItem('userInteracted', 'true');
    setShowWelcome(false);
    setIsReadyForTour(true);
  };

  return (
    <div className={cn("h-full w-full", isGamePage ? 'game-theme' : themeClass)}>
        <WelcomeOverlay show={showWelcome} onClick={handleWelcomeClick} />
        <AppShell openChatbot={() => setIsChatbotOpen(true)}>
          <div id="app-content" className={cn("pb-24", isGamePage ? "" : "p-4 sm:p-6")}>{children}</div>
          <BottomNavbar>
            <WorkoutGeneratorDialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen} />
          </BottomNavbar>
        </AppShell>
        <ChatbotSheet 
          open={isChatbotOpen} 
          onOpenChange={setIsChatbotOpen}
          onOpenGenerator={() => {
            setIsChatbotOpen(false);
            setIsGeneratorOpen(true);
          }} 
        />
        <Toaster />
        <OnboardingTour isReady={isReadyForTour} />
    </div>
  );
}
