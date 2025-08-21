
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Scan, User, Plus, Sparkles, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React, { useEffect, useState } from 'react';
import { WorkoutGeneratorDialog } from '@/app/(app)/dashboard/workout-generator-dialog';
import { Badge } from '../ui/badge';
import useAudioEffects from '@/hooks/use-sound';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/log', icon: BarChart2, label: 'Registro' },
  { href: null, icon: Plus, label: 'Actions' }, // Placeholder for the action button
  { href: '/games', icon: Gamepad2, label: 'Juegos' },
  { href: '/settings', icon: User, label: 'Perfil' },
];

export function BottomNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const playSound = useAudioEffects();

  useEffect(() => {
    const updateCount = () => {
        const pending = JSON.parse(localStorage.getItem('pendingFeedbackExercises') || '[]') as string[];
        setPendingFeedbackCount(pending.length);
    }
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => {
        window.removeEventListener('storage', updateCount);
    }
  }, [])

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item, index) => {
          if (!item.href) {
            // This is the central action button
            return (
              <div key={index} className="flex items-center justify-center">
                 <DropdownMenu onOpenChange={(open) => open && playSound('click')}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center w-14 h-14 font-medium bg-primary rounded-full text-primary-foreground hover:bg-primary/90 focus:ring-4 focus:ring-primary/50 focus:outline-none">
                        <Plus className="w-8 h-8" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="center" className="mb-4 w-64 p-2 space-y-1">
                       <DropdownMenuItem asChild>
                         <WorkoutGeneratorDialog>
                            <button className='w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted' onClick={() => playSound('swoosh')}>
                                <Sparkles />
                                <span>Generar Nuevo Entrenamiento</span>
                            </button>
                        </WorkoutGeneratorDialog>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link href="/feedback" onClick={() => playSound('swoosh')} className="w-full flex items-center justify-between gap-2 text-left p-2 rounded-md hover:bg-muted">
                            <div className='flex items-center gap-2'>
                                <Scan />
                                <span>Análisis de Forma</span>
                            </div>
                            {pendingFeedbackCount > 0 && (
                                <Badge variant="destructive" className='h-6 w-6 flex items-center justify-center p-0'>{pendingFeedbackCount}</Badge>
                            )}
                          </Link>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => playSound('click')}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
