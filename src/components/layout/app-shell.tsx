
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { useI18n } from '@/i18n/client';

interface AppShellProps {
  children: React.ReactNode;
  openChatbot: () => void;
}

export function AppShell({ children, openChatbot }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isGamePage = pathname === '/games';
  const { t } = useI18n();

  if (pathname === '/onboarding' || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
       {!isGamePage && (
        <header id="app-header" className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
             <span className="font-bold text-primary font-headline">TrainSmart AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Chatbot" onClick={openChatbot} id="chatbot-button">
                      <MessageSquare className="w-5 h-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                  <p>{t('appShell.askAi')}</p>
              </TooltipContent>
            </Tooltip>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                 {user ? (
                    <>
                        <DropdownMenuItem disabled>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                                </p>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('appShell.signOut')}</span>
                        </DropdownMenuItem>
                    </>
                 ) : (
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Iniciar Sesión</span>
                    </DropdownMenuItem>
                 )}
              </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </TooltipProvider>
  );
}
