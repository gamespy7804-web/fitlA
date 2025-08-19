"use client";

import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-4 ml-auto">
          <User className="w-5 h-5" />
          <span className="font-medium text-sm">Usuario</span>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
