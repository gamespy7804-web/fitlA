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

const chartData = [
  { month: 'January', volume: 186, pr: 80 },
  { month: 'February', volume: 305, pr: 200 },
  { month: 'March', volume: 237, pr: 120 },
  { month: 'April', volume: 73, pr: 190 },
  { month: 'May', volume: 209, pr: 130 },
  { month: 'June', volume: 214, pr: 140 },
];

const chartConfig = {
  volume: {
    label: 'Training Volume',
    color: 'hsl(var(--primary))',
  },
  pr: {
    label: 'Personal Record (kg)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function ProgressChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-headline'>Progress Overview</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
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
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
            <Bar dataKey="pr" fill="var(--color-pr)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
