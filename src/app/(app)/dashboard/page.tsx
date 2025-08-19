import { WorkoutGeneratorDialog } from './workout-generator-dialog';
import { WorkoutNodePath } from './workout-node-path';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';
import { PerformanceFeedback } from './performance-feedback';

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
        <div className="flex gap-2">
            <AdaptiveProgressionDialog />
            <WorkoutGeneratorDialog />
        </div>
      </div>

      <WorkoutNodePath />
      
    </div>
  );
}
