
'use client';

import { ProgressChart } from '@/components/client/progress-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/i18n/client';
import { useToast } from '@/hooks/use-toast';

type LogEntry = {
  date: string;
  workout: string;
  duration: string;
  volume: string;
};

export default function LogPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [logData, setLogData] = useState<LogEntry[]>([]);
  const dateLocale = locale === 'es' ? es : enUS;
  
  const loadLogData = useCallback(() => {
    const completed = JSON.parse(
      localStorage.getItem('completedWorkouts') || '[]'
    ) as { date: string; workout: string; duration: number; volume: number }[];

    const formattedData = completed.map((item) => ({
      ...item,
      duration: `${item.duration} min`,
      volume: item.volume > 0 ? `${item.volume.toLocaleString()} kg` : t('log.na'),
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setLogData(formattedData);
  }, [t]);


  useEffect(() => {
    loadLogData();

    // Add event listeners to update data when it changes in another tab or on focus
    window.addEventListener('storage', loadLogData);
    window.addEventListener('focus', loadLogData);

    // Cleanup listeners
    return () => {
      window.removeEventListener('storage', loadLogData);
      window.removeEventListener('focus', loadLogData);
    };
  }, [loadLogData]);

  const handleShareProgress = async () => {
    if (logData.length === 0) return;

    const totalWorkouts = logData.length;
    const totalDuration = logData.reduce((acc, log) => acc + parseInt(log.duration), 0);
    const totalVolume = logData.reduce((acc, log) => {
        const volumeNumber = parseInt(log.volume.replace(/\D/g, ''));
        return acc + (isNaN(volumeNumber) ? 0 : volumeNumber);
    }, 0);
    
    let shareText = `¡Mi progreso en TrainSmart AI!\n\n`;
    shareText += `🏋️ Entrenamientos completados: ${totalWorkouts}\n`;
    shareText += `⏱️ Tiempo total entrenando: ${totalDuration} minutos\n`;
    if (totalVolume > 0) {
      shareText += `💪 Volumen total levantado: ${totalVolume.toLocaleString()} kg\n`;
    }
    shareText += `\n¡Sigue mi progreso! #TrainSmartAI`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('log.shareTitle'),
          text: shareText,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: t('log.shareFallback.title'),
          description: t('log.shareFallback.description'),
        });
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
         toast({
            variant: 'destructive',
            title: t('log.shareFallback.error.title'),
            description: t('log.shareFallback.error.description'),
         });
      }
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {t('log.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('log.description')}
          </p>
        </div>
        <Button variant="secondary" disabled={logData.length === 0} onClick={handleShareProgress}>
          <Share2 className="mr-2" />
          {t('log.shareProgress')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('log.history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {logData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('log.history.table.date')}</TableHead>
                  <TableHead>{t('log.history.table.workout')}</TableHead>
                  <TableHead>{t('log.history.table.duration')}</TableHead>
                  <TableHead>{t('log.history.table.volume')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logData.map((log, index) => (
                  <TableRow key={`${log.date}-${index}`}>
                    <TableCell className="font-medium">
                      {format(new Date(log.date), "d 'de' MMMM, yyyy", {
                        locale: dateLocale,
                      })}
                    </TableCell>
                    <TableCell>{log.workout}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell>{log.volume}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>{t('log.history.empty.line1')}</p>
              <p className="text-sm">{t('log.history.empty.line2')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgressChart />
    </div>
  );
}
