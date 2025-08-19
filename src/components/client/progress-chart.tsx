'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type CompletedWorkout = { 
  date: string; 
  duration: number; 
  volume: number; 
};

const chartConfig = {
  volume: {
    label: 'Volumen de Entrenamiento (kg)',
    color: 'hsl(var(--primary))',
  },
  duration: {
    label: 'Duración (min)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function ProgressChart() {
  const [chartData, setChartData] = useState<any[]>([]);

  const loadChartData = useCallback(() => {
    const completedWorkouts: CompletedWorkout[] = JSON.parse(
      localStorage.getItem('completedWorkouts') || '[]'
    );

    const monthlyData = completedWorkouts.reduce((acc, log) => {
      const month = format(new Date(log.date), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { month, volume: 0, duration: 0, count: 0 };
      }
      acc[month].volume += log.volume;
      acc[month].duration += log.duration;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string, volume: number, duration: number, count: number }>);

    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        ...d,
        month: format(new Date(`${d.month}-01`), "MMMM", { locale: es }),
      }));
      
    setChartData(sortedData);
  }, []);

  useEffect(() => {
    loadChartData();

    // Add event listeners to update data when it changes
    window.addEventListener('storage', loadChartData);
    window.addEventListener('focus', loadChartData);

    // Cleanup listeners
    return () => {
        window.removeEventListener('storage', loadChartData);
        window.removeEventListener('focus', loadChartData);
    };
  }, [loadChartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Resumen de Progreso</CardTitle>
        <CardDescription>
          {chartData.length > 0 
            ? 'Volumen y duración total de entrenamiento por mes.'
            : 'Completa entrenamientos para ver tu progreso aquí.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1, 3)}
              />
              <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" tickFormatter={(value) => `${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'volume') return `${(value as number).toLocaleString()} kg`;
                    if (name === 'duration') return `${value} min`;
                    return value;
                  }}
                  labelFormatter={(label) => <span className='capitalize'>{label}</span>}
                />}
              />
              <Bar yAxisId="left" dataKey="volume" fill="var(--color-volume)" radius={4} />
              <Bar yAxisId="right" dataKey="duration" fill="var(--color-duration)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
           <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No hay datos de progreso para mostrar todavía.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
