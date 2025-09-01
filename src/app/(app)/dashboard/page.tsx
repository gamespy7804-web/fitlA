
'use client';

import { WorkoutNodePath } from './workout-node-path';
import { PerformanceFeedback } from './performance-feedback';
import { Flame, Zap } from 'lucide-react';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';
import { useI18n } from '@/i18n/client';
import { AdBanner } from '@/components/ad-banner';
import { useUserData } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { t } = useI18n();
  const { streak } = useUserData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              {t('dashboard.title')}
            </h1>
            {streak && streak > 1 && (
              <div className={cn(
                  "flex items-center gap-1.5 text-orange-400 font-bold px-3 py-1.5 rounded-full bg-orange-400/10",
                  streak > 5 && "text-red-500 bg-red-500/10",
                  "transition-colors duration-500"
                )}>
                <Flame className="h-5 w-5" />
                <span>{streak} {t('dashboard.streakDays')}</span>
              </div>
            )}
          </div>
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
