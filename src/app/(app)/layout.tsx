
'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { WorkoutGeneratorDialog } from './dashboard/workout-generator-dialog';
import { ChatbotSheet } from '@/components/chatbot/chatbot-sheet';
import { AuthProvider } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getThemeForSport } from '@/lib/theme';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { startMusic, initializeAudio } from '@/hooks/use-audio-effects';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [themeClass, setThemeClass] = useState('theme-default');
  const pathname = usePathname();
  const isGamePage = pathname === '/games';
  const audioInitialized = useRef(false);

  useEffect(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    let currentTheme = 'theme-default';
    if (storedRoutine) {
      try {
        const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
        if (parsedRoutine.sport) {
          currentTheme = getThemeForSport(parsedRoutine.sport);
        }
      } catch (e) {
        console.error("Failed to parse workout routine for theming");
      }
    }
    setThemeClass(currentTheme);
  }, [pathname]); // Recalculate theme if path changes, e.g., after new routine.
  
  const handleFirstInteraction = () => {
    if (!audioInitialized.current) {
      initializeAudio();
      startMusic('main');
      audioInitialized.current = true;
    }
  };

  return (
    <AuthProvider>
        <div className={cn("h-full w-full", isGamePage ? 'game-theme' : themeClass)} onClick={handleFirstInteraction}>
          <AppShell openChatbot={() => setIsChatbotOpen(true)}>
            <div className={cn("pb-24", isGamePage ? "" : "p-4 sm:p-6")}>{children}</div>
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
        </div>
    </AuthProvider>
  );
}
