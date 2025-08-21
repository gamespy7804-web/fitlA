
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

type LogEntry = {
  date: string;
  workout: string;
  duration: string;
  volume: string;
};

export default function LogPage() {
  const { t, locale } = useI18n();
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
        <Button variant="secondary" disabled={logData.length === 0}>
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
