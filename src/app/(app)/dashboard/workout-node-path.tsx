
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { Check, Dumbbell, Lock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdaptiveProgressionDialog } from './adaptive-progression-dialog';
import useAudioEffects, { stopMusic } from '@/hooks/use-audio-effects';
import { useI18n } from '@/i18n/client';

type CompletedDay = {
  workout: string;
};

export function WorkoutNodePath() {
  const { t } = useI18n();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutRoutineOutput | null>(null);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const router = useRouter();
  const playSound = useAudioEffects();

  useEffect(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    const completed = JSON.parse(localStorage.getItem('completedWorkouts') || '[]') as CompletedDay[];
    
    if (storedRoutine) {
      try {
        const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
        setWorkoutPlan(parsedRoutine);
        setCompletedDays(completed.map(c => c.workout));
      } catch (e) {
        console.error("Failed to parse workout routine:", e);
        setWorkoutPlan(null);
      }
    }
  }, []);

  const handleNodeClick = (dayIndex: number) => {
    stopMusic();
    playSound('startWorkout');
    setTimeout(() => {
      router.push(`/workout?day=${dayIndex}`);
    }, 500); // Wait for sound to play a bit
  };
  
  const routine = workoutPlan?.structuredRoutine;
  
  if (!routine || routine.length === 0) {
    return (
        <Card className="mt-10 text-center">
            <CardHeader>
                <CardTitle>{t('workoutNodePath.noPlan.title')}</CardTitle>
                <CardDescription>{t('workoutNodePath.noPlan.description')}</CardDescription>
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
  const allDaysComplete = activeDayIndex >= routine.length;


  return (
    <TooltipProvider>
      <div className="relative flex flex-col items-center w-full p-8 pt-20 pb-24">
        {/* The Path SVG */}
        <svg
          className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto"
          width="100"
          height="100%"
          viewBox={`0 0 100 ${(routine.length + 1) * 120}`}
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
                'relative z-10 w-48 h-48 flex items-center justify-center workout-node',
                index % 2 !== 0 ? 'self-start' : 'self-end'
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isLocked && handleNodeClick(index)}
                    disabled={isLocked}
                    className={cn(
                      'relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background',
                      // Base styles for active nodes
                      'bg-card border-2 shadow-lg',
                      // Completed State
                      isCompleted && 'bg-gradient-to-br from-green-400 to-green-600 border-green-700 text-white shadow-green-500/30',
                      // Active State
                      isActive && 'border-primary animate-pulse ring-4 ring-primary/50 shadow-primary/40',
                      // Locked State
                      isLocked ? 'bg-muted/50 border-dashed border-muted-foreground/30 cursor-not-allowed opacity-50' : 'hover:scale-110 focus:ring-primary',
                    )}
                  >
                    {isCompleted && <Check className="w-16 h-16 stroke-3" />}
                    {isLocked && <Lock className="w-12 h-12 text-muted-foreground/50" />}
                    {!isCompleted && !isLocked && (
                        <span className="text-5xl font-bold text-primary font-headline">{day.day}</span>
                    )}
                     <div className="absolute -top-4 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-semibold shadow-md">{t('workoutNodePath.day')} {day.day}</div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='font-bold'>{day.title}</p>
                  <p className='text-sm text-muted-foreground'>{isLocked ? t('workoutNodePath.tooltip.locked') : isCompleted ? t('workoutNodePath.tooltip.completed') : t('workoutNodePath.tooltip.active')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}

        <div className={cn(
            'relative z-10 w-48 h-48 flex items-center justify-center',
             routine.length % 2 !== 0 ? 'self-start' : 'self-end'
        )}>
            <AdaptiveProgressionDialog className="w-full md:w-auto text-accent-foreground justify-center bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed" >
                {t('workoutNodePath.generateNextWeek')}
            </AdaptiveProgressionDialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
