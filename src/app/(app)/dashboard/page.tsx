import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dumbbell, Scan, Share2 } from 'lucide-react';
import Link from 'next/link';
import { WorkoutGeneratorDialog } from './workout-generator-dialog';
import { ProgressChart } from '@/components/client/progress-chart';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Welcome back, Athlete!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s a snapshot of your training progress.
          </p>
        </div>
        <WorkoutGeneratorDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Dumbbell className="text-primary" />
              Current Workout
            </CardTitle>
            <CardDescription>
              Your plan for this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Day 3: Full Body Strength</p>
            <p className="text-sm text-muted-foreground">5 exercises remaining</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/workout">Go to Workout</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Scan className="text-primary" />
              Analyze Form
            </CardTitle>
            <CardDescription>
              Get real-time feedback on your technique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Record yourself performing an exercise to get instant AI-powered feedback.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/feedback">Analyze Technique</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Share2 className="text-primary" />
              Share Progress
            </CardTitle>
            <CardDescription>
              Share your latest achievements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Just hit a new Personal Record on squats! Share your success with your friends and coach.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/log">View & Share</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <ProgressChart />

    </div>
  );
}
