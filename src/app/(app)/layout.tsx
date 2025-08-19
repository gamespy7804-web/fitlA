import { AppShell } from '@/components/layout/app-shell';
import { BottomNavbar } from '@/components/layout/bottom-navbar';
import { WorkoutGeneratorDialog } from './dashboard/workout-generator-dialog';
import { AdaptiveProgressionDialog } from './dashboard/adaptive-progression-dialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
        <div className="pb-24">{children}</div>
        <BottomNavbar>
            <WorkoutGeneratorDialog />
            <AdaptiveProgressionDialog />
        </BottomNavbar>
    </AppShell>
  );
}
