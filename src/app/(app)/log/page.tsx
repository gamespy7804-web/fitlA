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

const logData = [
  { date: '2024-07-22', workout: 'Upper Body Strength', duration: '55 min', volume: '5,400 kg' },
  { date: '2024-07-20', workout: 'Lower Body Power', duration: '65 min', volume: '8,200 kg' },
  { date: '2024-07-18', workout: 'Full Body Conditioning', duration: '45 min', volume: 'N/A' },
  { date: '2024-07-15', workout: 'Upper Body Strength', duration: '50 min', volume: '5,150 kg' },
];

export default function LogPage() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Training Log
          </h1>
          <p className="text-muted-foreground">
            Review your past workouts and track your long-term progress.
          </p>
        </div>
        <Button variant="secondary">
          <Share2 className="mr-2" />
          Share My Progress
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Workout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Workout</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logData.map((log) => (
                <TableRow key={log.date}>
                  <TableCell className="font-medium">{log.date}</TableCell>
                  <TableCell>{log.workout}</TableCell>
                  <TableCell>{log.duration}</TableCell>
                  <TableCell>{log.volume}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ProgressChart />
    </div>
  );
}
