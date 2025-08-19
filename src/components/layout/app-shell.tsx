"use client";

import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                  <Button variant="ghost" size="icon" aria-label="Chatbot">
                      <Bot className="w-5 h-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                  <p>Pregúntale a la IA (Próximamente)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </TooltipProvider>
  );
}
