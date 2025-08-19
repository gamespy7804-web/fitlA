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
import { es } from 'date-fns/locale';
import { useEffect, useState, useCallback } from 'react';

type LogEntry = {
  date: string;
  workout: string;
  duration: string;
  volume: string;
};

export default function LogPage() {
  const [logData, setLogData] = useState<LogEntry[]>([]);
  
  const loadLogData = useCallback(() => {
    const completed = JSON.parse(
      localStorage.getItem('completedWorkouts') || '[]'
    ) as { date: string; workout: string; duration: number; volume: number }[];

    const formattedData = completed.map((item) => ({
      ...item,
      duration: `${item.duration} min`,
      volume: item.volume > 0 ? `${item.volume.toLocaleString()} kg` : 'N/A',
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setLogData(formattedData);
  }, []);


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
            Registro de Entrenamiento
          </h1>
          <p className="text-muted-foreground">
            Revisa tus entrenamientos pasados y sigue tu progreso a largo plazo.
          </p>
        </div>
        <Button variant="secondary" disabled={logData.length === 0}>
          <Share2 className="mr-2" />
          Compartir Mi Progreso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial de Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          {logData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrenamiento</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Volumen Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logData.map((log, index) => (
                  <TableRow key={`${log.date}-${index}`}>
                    <TableCell className="font-medium">
                      {format(new Date(log.date), "d 'de' MMMM, yyyy", {
                        locale: es,
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
              <p>Aún no has registrado ningún entrenamiento.</p>
              <p className="text-sm">Completa una sesión para verla aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgressChart />
    </div>
  );
}
