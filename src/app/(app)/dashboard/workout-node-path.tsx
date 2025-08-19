
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutRoutineOutput } from '@/ai/flows/workout-routine-generator';
import { Check, Dumbbell, Lock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CompletedDay = {
  workout: string;
};

export function WorkoutNodePath() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutRoutineOutput | null>(null);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    const completed = JSON.parse(localStorage.getItem('completedWorkouts') || '[]') as CompletedDay[];
    
    if (storedRoutine) {
      const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
      setWorkoutPlan(parsedRoutine);
      setCompletedDays(completed.map(c => c.workout));
    }
  }, []);

  const handleNodeClick = (dayIndex: number) => {
    router.push(`/workout?day=${dayIndex}`);
  };
  
  const routine = workoutPlan?.structuredRoutine;
  
  if (!routine || routine.length === 0) {
    return (
        <Card className="mt-10 text-center">
            <CardHeader>
                <CardTitle>No hay un plan de entrenamiento activo</CardTitle>
                <CardDescription>Usa el generador para crear una nueva rutina.</CardDescription>
            </CardHeader>
            <CardContent>
                <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  // Find the index of the last completed workout to determine the current "active" day
  let lastCompletedIndex = -1;
  for (let i = routine.length - 1; i >= 0; i--) {
      if (completedDays.includes(routine[i].title)) {
          lastCompletedIndex = i;
          break;
      }
  }
  const activeDayIndex = lastCompletedIndex + 1;


  return (
    <TooltipProvider>
      <div className="relative flex flex-col items-center w-full p-8 pt-20">
        {/* The Path SVG */}
        <svg
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto"
          width="100"
          height="100%"
          viewBox={`0 0 100 ${routine.length * 120}`}
          preserveAspectRatio="none"
        >
          <path
            d={`M 50 0 ${routine.map((_, i) => `C 50 ${i*120 + 20}, ${i % 2 === 0 ? 100 : 0} ${i*120 + 60}, 50 ${i*120 + 120}`).join(' ')}`}
            stroke="hsl(var(--border))"
            strokeWidth="4"
            fill="none"
            strokeDasharray="10 10"
          />
        </svg>

        {routine.map((day, index) => {
          const isCompleted = completedDays.includes(day.title);
          const isLocked = index > activeDayIndex;
          const isActive = index === activeDayIndex;

          return (
            <div
              key={day.day}
              className={cn(
                'relative z-10 w-48 h-48 flex items-center justify-center',
                index % 2 !== 0 ? 'self-start' : 'self-end'
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isLocked && handleNodeClick(index)}
                    disabled={isLocked}
                    className={cn(
                      'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background',
                      isCompleted ? 'bg-green-500 text-white shadow-lg' : 'bg-card border-2 border-primary shadow-md',
                      isActive && 'animate-pulse ring-4 ring-primary/50',
                      isLocked ? 'bg-muted border-dashed border-muted-foreground/50 cursor-not-allowed' : 'focus:ring-primary',
                    )}
                  >
                    {isCompleted && <Check className="w-12 h-12" />}
                    {isLocked && <Lock className="w-10 h-10 text-muted-foreground" />}
                    {!isCompleted && !isLocked && (
                        <span className="text-3xl font-bold text-primary">{day.day}</span>
                    )}
                     <div className="absolute -top-4 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-semibold">DÍA {day.day}</div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-bold'>{day.title}</p>
                  <p className='text-sm text-muted-foreground'>{isLocked ? "Completa los días anteriores" : isCompleted ? 'Completado' : "¡A entrenar!"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
