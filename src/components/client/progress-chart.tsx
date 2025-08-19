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
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Example log data structure. In a real app, this would come from a database or state management.
const getInitialLogData = () => [
  { date: '2024-07-22', workout: 'Fuerza del Tren Superior', duration: 55, volume: 5400 },
  { date: '2024-07-20', workout: 'Potencia del Tren Inferior', duration: 65, volume: 8200 },
  { date: '2024-07-18', workout: 'Acondicionamiento de Cuerpo Completo', duration: 45, volume: 0 },
  { date: '2024-07-15', workout: 'Fuerza del Tren Superior', duration: 50, volume: 5150 },
  { date: '2024-06-25', workout: 'Fuerza del Tren Superior', duration: 50, volume: 4900 },
  { date: '2024-06-22', workout: 'Potencia del Tren Inferior', duration: 60, volume: 7800 },
  { date: '2024-05-15', workout: 'Acondicionamiento de Cuerpo Completo', duration: 45, volume: 0 },
  { date: '2024-05-10', workout: 'Fuerza del Tren Superior', duration: 52, volume: 4500 },
];

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

  useEffect(() => {
    // In a real app, you'd fetch this data. Here we use the static log and local storage.
    const logData = getInitialLogData();
    // In a real app, we would have a more robust way to store workout logs.
    // For now, let's simulate adding to the log when a workout is completed.
    // const completedWorkouts = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
    // const combinedData = [...logData, ...completedWorkouts];


    const monthlyData = logData.reduce((acc, log) => {
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
        // Format month name for display
        month: format(new Date(d.month), 'MMMM', { locale: es }),
      }));
      
    setChartData(sortedData);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Resumen de Progreso</CardTitle>
        <CardDescription>
          Volumen y duración total de entrenamiento por mes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
            <ChartTooltip
              content={<ChartTooltipContent
                formatter={(value, name) => {
                  if (name === 'volume') return `${value.toLocaleString()} kg`;
                  if (name === 'duration') return `${value} min`;
                  return value;
                }}
              />}
            />
            <Bar yAxisId="left" dataKey="volume" fill="var(--color-volume)" radius={4} />
            <Bar yAxisId="right" dataKey="duration" fill="var(--color-duration)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
