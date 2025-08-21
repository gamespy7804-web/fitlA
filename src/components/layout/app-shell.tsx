
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, User, LogOut, DiscAlbum, Music, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useSound from '@/hooks/use-sound';


const musicTracks = [
  { id: 'music-1', name: 'Aventura Épica' },
  { id: 'music-2', name: 'Electrónica Focus' },
  { id: 'music-3', name: 'Ambiente Relajante' },
]

function MusicController() {
  const [settings, setSettings] = useState({ enabled: true, track: 'music-1' });
  const playSound = useSound();

  const updateSettings = useCallback(() => {
    const storedSettings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
     setSettings(s => ({...s, ...storedSettings}));
  }, [])

  useEffect(() => {
    updateSettings();
    window.addEventListener('storage', updateSettings);
    window.addEventListener('music-settings-changed', updateSettings);
    return () => {
        window.removeEventListener('storage', updateSettings);
        window.removeEventListener('music-settings-changed', updateSettings);
    };
  }, [updateSettings]);
  
  const handleMusicChange = (key: 'enabled' | 'track', value: any) => {
     playSound('click');
     const newSettings = { ...settings, [key]: value };
     localStorage.setItem('musicSettings', JSON.stringify(newSettings));
     window.dispatchEvent(new Event('music-settings-changed'));
     setSettings(newSettings);
  }

  return (
    <DropdownMenu>
        <Tooltip>
            <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Music Controls">
                        <DiscAlbum className={cn("w-5 h-5", settings.enabled && "animate-spin")} style={{ animationDuration: '3s' }} />
                    </Button>
                </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>Controles de Música</p>
            </TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem onClick={() => handleMusicChange('enabled', !settings.enabled)}>
                {settings.enabled ? <VolumeX className="mr-2" /> : <Volume2 className="mr-2" />}
                <span>{settings.enabled ? 'Desactivar Música' : 'Activar Música'}</span>
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!settings.enabled}>
                    <Music className="mr-2" />
                    <span>Cambiar Pista</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        {musicTracks.map(track => (
                            <DropdownMenuItem key={track.id} onClick={() => handleMusicChange('track', track.id)}>
                                {track.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
        </DropdownMenuContent>
    </DropdownMenu>
  )

}


interface AppShellProps {
  children: React.ReactNode;
  openChatbot: () => void;
}

export function AppShell({ children, openChatbot }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const isGamePage = pathname === '/games';


  useEffect(() => {
    if (!loading && !user) {
        router.replace('/login');
    }
  }, [user, loading, router]);


  if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  if (!user) {
      return null;
  }
  
  if (pathname === '/onboarding' || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
       {!isGamePage && (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
             <span className="font-bold text-primary font-headline">TrainSmart AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MusicController />
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Chatbot" onClick={openChatbot}>
                      <MessageSquare className="w-5 h-5" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                  <p>Pregúntale a la IA</p>
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
                 <DropdownMenuItem disabled>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                        </p>
                    </div>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                 </DropdownMenuItem>
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
