"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatbotSheet } from '@/components/chatbot/chatbot-sheet';


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
             <span className="font-bold text-primary font-headline">TrainSmart AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Chatbot" onClick={() => setIsChatbotOpen(true)}>
                      <Bot className="w-5 h-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                  <p>Pregúntale a la IA</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        <ChatbotSheet open={isChatbotOpen} onOpenChange={setIsChatbotOpen} />
      </div>
    </TooltipProvider>
  );
}
