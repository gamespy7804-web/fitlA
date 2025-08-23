
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
import { initializeAudio, startMusic, stopMusic } from '@/hooks/use-audio-effects';
import { WelcomeOverlay } from './welcome-overlay';
import { Toaster } from '@/components/ui/toaster';
import { OnboardingTour } from '@/components/onboarding-tour';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [themeClass, setThemeClass] = useState('theme-default');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReadyForTour, setIsReadyForTour] = useState(false);
  const { loading } = useAuth();
  const pathname = usePathname();
  const isGamePage = pathname === '/games';
  const audioInitialized = useRef(false);

  useEffect(() => {
    // This check should only happen on the client
    if (typeof window !== 'undefined' && !loading) {
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
  }, [loading]);

  const updateTheme = useCallback(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    let currentTheme = 'theme-default';
    if (storedRoutine) {
      try {
        const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
        const sport = (parsedRoutine as any).sport;
        if (sport) {
          currentTheme = getThemeForSport(sport);
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

    if (!isGamePage && audioInitialized.current) {
      startMusic('main');
    } else {
      stopMusic();
    }
    
    return () => {
      window.removeEventListener('storage', updateTheme);
    }

  }, [pathname, updateTheme, isGamePage]); 
  
  const handleFirstInteraction = () => {
    if (!audioInitialized.current) {
      initializeAudio();
      if (!isGamePage) {
          startMusic('main');
      }
      audioInitialized.current = true;
    }
  };

  const handleWelcomeClick = () => {
    handleFirstInteraction();
    sessionStorage.setItem('userInteracted', 'true');
    setShowWelcome(false);
    setIsReadyForTour(true);
  };
  
  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

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
