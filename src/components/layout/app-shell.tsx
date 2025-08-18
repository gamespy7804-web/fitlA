"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Dumbbell,
  LayoutGrid,
  Library,
  Scan,
  Settings,
  User,
} from 'lucide-react';
import { Logo } from '../logo';

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/workout', icon: Dumbbell, label: 'Workout Routine' },
  { href: '/log', icon: ClipboardList, label: 'Training Log' },
  { href: '/feedback', icon: Scan, label: 'Real-time Feedback' },
  { href: '/library', icon: Library, label: 'Exercise Library' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="h-14 justify-center p-2 group-data-[collapsible=icon]:h-auto">
          <div className="flex h-10 items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:h-8">
            <Logo className="size-8 shrink-0 text-primary" />
            <div className="flex flex-col">
              <span className="font-headline text-lg font-bold leading-none tracking-tight">
                TrainSmart
              </span>
              <span className="text-xs text-muted-foreground">AI Coach</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-4 ml-auto">
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">User</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
