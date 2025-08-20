'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { WorkoutGeneratorDialog } from './dashboard/workout-generator-dialog';
import { ChatbotSheet } from '@/components/chatbot/chatbot-sheet';
import { AuthProvider } from '@/hooks/use-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <AuthProvider>
      <AppShell openChatbot={() => setIsChatbotOpen(true)}>
        <div className="pb-24">{children}</div>
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
    </AuthProvider>
  );
}
