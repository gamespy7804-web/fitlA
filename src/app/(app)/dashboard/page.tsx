'use client';

import { WorkoutNodePath } from './workout-node-path';
import { PerformanceFeedback } from './performance-feedback';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';
import { Zap } from 'lucide-react';

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
        <AdaptiveProgressionDialog className="w-full md:w-auto text-primary-foreground justify-center bg-primary hover:bg-primary/90">
             <Zap />
             Generar Próxima Semana
        </AdaptiveProgressionDialog>
      </div>

      <WorkoutNodePath />
      
    </div>
  );
}
