'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Scan, User, Bot, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dumbbell, Library, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { 
    icon: Bot, 
    label: 'Productividad',
    subItems: [
      { href: '/workout', icon: Dumbbell, label: 'Rutina' },
      { href: '/log', icon: ClipboardList, label: 'Registro' },
      { href: '/library', icon: Library, label: 'Ejercicios' },
    ] 
  },
  { href: '/feedback', icon: Scan, label: 'Análisis' },
  { href: '/games', icon: Gamepad2, label: 'Juegos' },
  { href: '/settings', icon: User, label: 'Perfil' },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item, index) => (
          item.subItems ? (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
                    item.subItems.some(sub => pathname.startsWith(sub.href)) ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center" className='mb-2'>
                {item.subItems.map(subItem => (
                  <DropdownMenuItem key={subItem.href} asChild>
                     <Link href={subItem.href} className="flex items-center gap-2">
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
}
