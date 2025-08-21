
'use client';

import { useEffect, useState } from 'react';
import { performanceAnalystGenerator } from '@/ai/flows/performance-analyst-generator';
import { Bot, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';

export function PerformanceFeedback() {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useI18n();

  useEffect(() => {
    const fetchFeedback = async () => {
      const detailedLogsJSON = localStorage.getItem('detailedWorkoutLogs');
      if (!detailedLogsJSON || detailedLogsJSON === '[]') {
        setFeedback(t('performanceFeedback.noWorkouts'));
        setIsLoading(false);
        return;
      }

      try {
        const result = await performanceAnalystGenerator({
          trainingData: detailedLogsJSON,
          language: locale,
        });
        setFeedback(result.analysis);
      } catch (error) {
        console.error('Error generating performance feedback:', error);
        setFeedback(t('performanceFeedback.error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [t, locale]);

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
