
'use client';

import { WorkoutNodePath } from './workout-node-path';
import { PerformanceFeedback } from './performance-feedback';
import { Zap } from 'lucide-react';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';
import { useI18n } from '@/i18n/client';
import { AdBanner } from '@/components/ad-banner';

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {t('dashboard.title')}
          </h1>
          <PerformanceFeedback />
        </div>
        
      </div>

      <WorkoutNodePath />

      <AdBanner
        title="Potencia Tu Nutrición"
        description="Descubre planes de comida personalizados para complementar tu entrenamiento y alcanzar tus metas más rápido."
        buttonText="Obtener Plan"
        imageUrl="https://placehold.co/800x200"
        data-ai-hint="nutrition healthy food"
      />
      
    </div>
  );
}
