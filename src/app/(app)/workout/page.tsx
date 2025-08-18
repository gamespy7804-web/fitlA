import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Flame, Repeat, TrendingUp, Weight } from 'lucide-react';

const workoutPlan = {
  name: "Foundation Builder - Week 1",
  days: [
    {
      day: 1,
      title: "Upper Body Strength",
      exercises: [
        { name: "Bench Press", sets: 3, reps: "8-10" },
        { name: "Pull Ups", sets: 3, reps: "To Failure" },
        { name: "Overhead Press", sets: 3, reps: "8-10" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12" },
      ],
    },
    {
      day: 2,
      title: "Lower Body Power",
      exercises: [
        { name: "Barbell Squats", sets: 4, reps: "6-8" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Calf Raises", sets: 4, reps: "15-20" },
      ],
    },
    {
      day: 3,
      title: "Full Body Conditioning",
      exercises: [
        { name: "Kettlebell Swings", sets: 5, reps: "20" },
        { name: "Box Jumps", sets: 3, reps: "10" },
        { name: "Plank", sets: 3, reps: "60s" },
        { name: "Sprints", sets: 5, reps: "30s" },
      ],
    },
  ],
};

export default function WorkoutPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {workoutPlan.name}
          </h1>
          <p className="text-muted-foreground">
            Log your sets, reps, and weight to track your progress.
          </p>
        </div>
        <Button variant="secondary">
          <TrendingUp className="mr-2" />
          Generate Next Week&apos;s Progression
        </Button>
      </div>

      <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
        {workoutPlan.days.map((day, index) => (
          <AccordionItem value={`item-${index}`} key={day.day}>
            <AccordionTrigger>
              <div className="flex items-center gap-4">
                <Badge className="text-lg px-3 py-1">Day {day.day}</Badge>
                <span className="text-xl font-semibold font-headline">{day.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                {day.exercises.map((exercise) => (
                  <Card key={exercise.name}>
                    <CardHeader>
                      <CardTitle className='flex justify-between items-center'>
                        <span>{exercise.name}</span>
                        <Badge variant="outline">{exercise.sets} sets x {exercise.reps} reps</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-4">
                          <div className='w-10 text-center font-bold text-primary'>Set {setIndex + 1}</div>
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`weight-${index}-${setIndex}`} className="sr-only">Weight</Label>
                              <div className="relative">
                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id={`weight-${index}-${setIndex}`} type="number" placeholder="Weight (kg)" className="pl-9" />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`reps-${index}-${setIndex}`} className="sr-only">Reps</Label>
                               <div className="relative">
                                <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id={`reps-${index}-${setIndex}`} type="number" placeholder="Reps" className="pl-9" />
                              </div>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                            <Check />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 text-center">
                  <Button size="lg">
                    <Flame className="mr-2" />
                    Complete {day.title} Workout
                  </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
