import { AppShell } from '@/components/layout/app-shell';
import { BottomNavbar } from '@/components/layout/bottom-navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
        <div className="pb-16">{children}</div>
        <BottomNavbar />
    </AppShell>
  );
}
