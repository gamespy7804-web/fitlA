'use client';

import { WorkoutNodePath } from './workout-node-path';
import { PerformanceFeedback } from './performance-feedback';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';

export default function DashboardPage() {

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Tu Camino al Éxito
          </h1>
          <PerformanceFeedback />
        </div>
        <AdaptiveProgressionDialog>
             <button className='w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground justify-center'>
                Sugerir Progresión
            </button>
        </AdaptiveProgressionDialog>
      </div>

      <WorkoutNodePath />
      
    </div>
  );
}
