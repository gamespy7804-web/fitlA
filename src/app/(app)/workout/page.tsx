
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type WorkoutRoutineOutput,
  type DailyWorkout as DaySchema,
  type ExerciseDetail as ExerciseSchema,
} from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Flame, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutExerciseCard } from './workout-exercise-card';
import { RestTimer } from './rest-timer';
import { Stopwatch } from './stopwatch';
import useAudioEffects from '@/hooks/use-audio-effects';
import { useI18n } from '@/i18n/client';
import { useUserData } from '@/hooks/use-user-data';

export type SetLog = { weight: number; reps: number; completed: boolean };
export type ExerciseLog = { name: string; sets: SetLog[]; originalExercise: ExerciseSchema };

function WorkoutPageContent() {
  const { t } = useI18n();
  const [day, setDay] = useState<DaySchema | null>(null);
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isTiming, setIsTiming] = useState(false);
  const [restDuration, setRestDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playSound = useAudioEffects();
  const { workoutRoutine, addCompletedWorkout, addDetailedWorkoutLog, pendingFeedback, addXP } = useUserData();
  
  const dayParam = searchParams.get('day');

  const initializeWorkoutLog = useCallback((dayData: DaySchema) => {
    const newLog = dayData.exercises.map((exercise) => ({
      name: exercise.name,
      originalExercise: exercise,
      sets: Array.from({ length: parseInt(exercise.sets, 10) || 1 }, () => ({
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }));
    setExerciseLog(newLog);
  }, []);

  useEffect(() => {
    if (workoutRoutine && dayParam !== null) {
      try {
        const dayIndex = parseInt(dayParam, 10);

        if (workoutRoutine.structuredRoutine && workoutRoutine.structuredRoutine[dayIndex]) {
          const targetDay = workoutRoutine.structuredRoutine[dayIndex];
          setDay(targetDay);
          initializeWorkoutLog(targetDay);
        } else {
          toast({ variant: 'destructive', title: t('workoutPage.errors.routineNotFound') });
          router.push('/dashboard');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: t('workoutPage.errors.routineLoadError') });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    } else if (workoutRoutine !== null) { // We have data, but no dayParam
      router.push('/dashboard');
    }
    // If workoutRoutine is null, we are still loading, so do nothing.
  }, [dayParam, initializeWorkoutLog, router, t, toast, workoutRoutine]);

  const updateSetLog = (exIndex: number, setIndex: number, newSet: SetLog) => {
    const newLog = [...exerciseLog];
    newLog[exIndex].sets[setIndex] = newSet;
    setExerciseLog(newLog);
  };
  
  const handleSetComplete = () => {
    playSound('success');
    const newLog = [...exerciseLog];
    newLog[currentExerciseIndex].sets[currentSetIndex].completed = true;
    setExerciseLog(newLog);

    const isLastSetOfExercise = currentSetIndex === exerciseLog[currentExerciseIndex].sets.length - 1;
    const isLastExercise = currentExerciseIndex === exerciseLog.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      handleCompleteWorkout();
    } else {
      const restTime = parseInt(exerciseLog[currentExerciseIndex].originalExercise.rest) || 60;
      setRestDuration(restTime);
      setIsResting(true);
    }
  };

  const handleRestComplete = () => {
    playSound('swoosh');
    setIsResting(false);
    
    const isLastSetOfExercise = currentSetIndex === exerciseLog[currentExerciseIndex].sets.length - 1;

    if (isLastSetOfExercise) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    } else {
      setCurrentSetIndex(currentSetIndex + 1);
    }
  };

  const handleStopwatchDone = (time: number) => {
    playSound('click');
    const newLog = [...exerciseLog];
    newLog[currentExerciseIndex].sets[currentSetIndex].reps = time;
    setExerciseLog(newLog);
    setIsTiming(false);
  };

  const handleCompleteWorkout = () => {
    if (!day) return;

    playSound('success');
    let totalVolume = 0;
    
    exerciseLog.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed) {
          totalVolume += (set.weight || 0) * (set.reps || 0);
        }
      });
    });

    // Calculate XP
    const xpGained = Math.round(totalVolume / 10 + day.duration / 2);
    addXP(xpGained);

    const completedWorkoutSummary = {
      date: new Date().toISOString(),
      workout: day.title,
      duration: day.duration,
      volume: totalVolume,
    };
    addCompletedWorkout(completedWorkoutSummary);
    

    const detailedWorkoutLog = {
      date: new Date().toISOString(),
      title: day.title,
      log: exerciseLog.map(ex => ({
          name: ex.name,
          sets: ex.sets
      }))
    };
    addDetailedWorkoutLog(detailedWorkoutLog);

    const hasPendingFeedback = pendingFeedback && pendingFeedback.length > 0;
    
    toast({
        title: t('workoutPage.toast.workoutComplete'),
    });

    if (hasPendingFeedback) {
        toast({
          title: t('workoutPage.toast.goodJob'),
          description: t('workoutPage.toast.pendingFeedback'),
          duration: 5000,
        });
    }

    setTimeout(() => router.push('/dashboard'), 2000);
  };
  
  if (isLoading || workoutRoutine === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isResting) {
    return <RestTimer duration={restDuration} onComplete={handleRestComplete} />;
  }
  
  if (isTiming) {
    return <Stopwatch onDone={handleStopwatchDone} />;
  }

  if (!day || exerciseLog.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader><CardTitle>{t('workoutPage.errors.loadError.title')}</CardTitle></CardHeader>
        <CardContent><p>{t('workoutPage.errors.loadError.description')}</p></CardContent>
      </Card>
    );
  }

  const currentExercise = exerciseLog[currentExerciseIndex];
  const allExercisesComplete = currentExerciseIndex >= exerciseLog.length;

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl text-center font-bold tracking-tight font-headline">
          {t('workoutPage.exercise')} {currentExerciseIndex + 1} {t('workoutPage.of')} {exerciseLog.length}
        </h1>
      </div>

      {!allExercisesComplete ? (
        <WorkoutExerciseCard
          key={`${currentExercise.name}-${currentSetIndex}`}
          exercise={currentExercise}
          set={currentExercise.sets[currentSetIndex]}
          setIndex={currentSetIndex}
          onSetChange={(newSet) => updateSetLog(currentExerciseIndex, currentSetIndex, newSet)}
          onSetComplete={handleSetComplete}
          onStartTimer={() => setIsTiming(true)}
        />
      ) : (
        <Card>
           <CardHeader><CardTitle>{t('workoutPage.dayComplete')}</CardTitle></CardHeader>
           <CardContent className="text-center">
             <p className="mb-4">{t('workoutPage.allExercisesComplete')}</p>
             <Button size="lg" onClick={handleCompleteWorkout}>
               <Flame className="mr-2" />
               {t('workoutPage.finishAndSave')}
             </Button>
           </CardContent>
        </Card>
      )}
    </div>
  );
}


export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <WorkoutPageContent />
    </Suspense>
  )
}
