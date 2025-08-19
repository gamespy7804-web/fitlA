'use client';

import { useEffect, useState } from 'react';
import { performanceAnalystGenerator } from '@/ai/flows/performance-analyst-generator';
import { Bot, Loader2 } from 'lucide-react';

export function PerformanceFeedback() {
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      const detailedLogsJSON = localStorage.getItem('detailedWorkoutLogs');
      if (!detailedLogsJSON || detailedLogsJSON === '[]') {
        setFeedback('Completa algunos entrenamientos para recibir un análisis de IA de tu rendimiento.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await performanceAnalystGenerator({
          trainingData: detailedLogsJSON,
        });
        setFeedback(result.analysis);
      } catch (error) {
        console.error('Error generating performance feedback:', error);
        setFeedback('No se pudo cargar el análisis de IA en este momento.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  return (
    <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mt-0.5 animate-spin shrink-0" />
          <span>Analizando tu rendimiento...</span>
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
