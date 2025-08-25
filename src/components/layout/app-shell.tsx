
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, User, LogOut } from 'lucide-react';
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
import { GoogleIcon } from '../icons';
import { useUserData } from '@/hooks/use-user-data';

interface AppShellProps {
  children: React.ReactNode;
  openChatbot: () => void;
}

export function AppShell({ children, openChatbot }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { feedbackCredits } = useUserData();
  const isGamePage = pathname === '/games';
  const { t } = useI18n();

  const isAnonymous = user?.isAnonymous ?? true;

  if (pathname === '/onboarding' || pathname === '/login') {
    return <>{children}</>;
  }

  const handleCreditsClick = () => {
    router.push('/store');
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
       {!isGamePage && (
        <header id="app-header" className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
             <span className="font-bold text-primary font-headline">workout IA</span>
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
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1.5 h-auto px-2 py-1.5" onClick={handleCreditsClick}>
                        <div className="flex items-center gap-2 bg-secondary border border-border text-secondary-foreground font-bold px-3 py-1.5 rounded-md text-sm">
                            <span role="img" aria-label="diamond">💎</span>
                            <span>{feedbackCredits ?? 0}</span>
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>{t('appShell.analysisCredits_beta')}</p>
                </TooltipContent>
            </Tooltip>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={!isAnonymous ? user?.photoURL ?? undefined : undefined} alt={!isAnonymous ? user?.displayName ?? "User" : "User"} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                 {!isAnonymous ? (
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
                    <>
                     <DropdownMenuItem disabled>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Invitado</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            Inicia sesión para guardar tu progreso
                          </p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <GoogleIcon className="mr-2 h-4 w-4" />
                        <span>Iniciar Sesión</span>
                      </DropdownMenuItem>
                    </>
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
