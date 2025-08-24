
'use client';

import { useEffect, useState, useCallback } from 'react';
import { performanceAnalystGenerator } from '@/ai/flows/performance-analyst-generator';
import { Bot, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { useUserData } from '@/hooks/use-user-data';

export function PerformanceFeedback() {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useI18n();
  const { detailedWorkoutLogs } = useUserData();

  const fetchFeedback = useCallback(async () => {
    if (detailedWorkoutLogs === null) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    try {
      if (!detailedWorkoutLogs || detailedWorkoutLogs.length === 0) {
        setFeedback(t('performanceFeedback.noWorkouts'));
        return;
      }

      const result = await performanceAnalystGenerator({
        trainingData: JSON.stringify(detailedWorkoutLogs),
        language: locale,
      });
      setFeedback(result.analysis);
    } catch (error) {
      console.error('Error generating performance feedback:', error);
      setFeedback(t('performanceFeedback.error'));
    } finally {
      setIsLoading(false);
    }
  }, [t, locale, detailedWorkoutLogs]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mt-0.5 animate-spin shrink-0" />
          <span>{t('performanceFeedback.loading')}</span>
        </>
      ) : (
        <>
          <Bot className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{feedback}</span>
        </>
      )}
    </div>
  );
}
