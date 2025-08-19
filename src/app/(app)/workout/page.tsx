'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type WorkoutRoutineOutput,
  type DailyWorkoutSchema as DaySchema,
  type ExerciseDetailSchema as ExerciseSchema,
} from '@/ai/flows/workout-routine-generator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Flame, Loader2, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutExerciseCard } from './workout-exercise-card';
import { RestTimer } from './rest-timer';

export type SetLog = { weight: number; reps: number; completed: boolean };
export type ExerciseLog = { name: string; sets: SetLog[]; originalExercise: ExerciseSchema };

export default function WorkoutPage() {
  const [day, setDay] = useState<DaySchema | null>(null);
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    const dayParam = searchParams.get('day');
    
    if (storedRoutine && dayParam) {
      try {
        const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
        const dayIndex = parseInt(dayParam, 10);

        if (parsedRoutine.structuredRoutine && parsedRoutine.structuredRoutine[dayIndex]) {
          const targetDay = parsedRoutine.structuredRoutine[dayIndex];
          setDay(targetDay);
          initializeWorkoutLog(targetDay);
        } else {
          toast({ variant: 'destructive', title: 'Rutina no encontrada' });
          router.push('/dashboard');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al cargar la rutina' });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeWorkoutLog = (dayData: DaySchema) => {
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
  };

  const updateSetLog = (exIndex: number, newSets: SetLog[]) => {
    const newLog = [...exerciseLog];
    newLog[exIndex].sets = newSets;
    setExerciseLog(newLog);
  };
  
  const handleSetComplete = () => {
     // Find the next uncompleted set in the current exercise
    const currentSets = exerciseLog[currentExerciseIndex].sets;
    const nextSetIndex = currentSets.findIndex(set => !set.completed);
  
    // If all sets in the current exercise are complete, move to the next exercise
    if (nextSetIndex === -1) {
      if (currentExerciseIndex < exerciseLog.length - 1) {
        // Start rest period before next exercise
        const restTime = parseInt(exerciseLog[currentExerciseIndex].originalExercise.rest) || 60;
        setRestDuration(restTime);
        setIsResting(true);
      } else {
         // This was the last set of the last exercise
         handleCompleteWorkout();
      }
    } else {
       // Start rest for the next set
       const restTime = parseInt(exerciseLog[currentExerciseIndex].originalExercise.rest) || 60;
       setRestDuration(restTime);
       setIsResting(true);
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    const currentSets = exerciseLog[currentExerciseIndex].sets;
    const isExerciseFinished = currentSets.every(set => set.completed);

    if (isExerciseFinished) {
      if (currentExerciseIndex < exerciseLog.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        handleCompleteWorkout();
      }
    }
    // If not finished, the user will just proceed to the next set within the same exercise card
  };

  const handleCompleteWorkout = () => {
    if (!day) return;

    let totalVolume = 0;
    exerciseLog.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed) {
          totalVolume += (set.weight || 0) * (set.reps || 0);
        }
      });
    });

    const completedWorkout = {
      date: new Date().toISOString(),
      workout: day.title,
      duration: day.duration,
      volume: totalVolume,
    };

    const allCompleted = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
    allCompleted.push(completedWorkout);
    localStorage.setItem('completedWorkouts', JSON.stringify(allCompleted));

    toast({
      title: '¡Entrenamiento Completado!',
      description: `${day.title} ha sido guardado. Redirigiendo...`,
    });

    setTimeout(() => router.push('/dashboard'), 2000);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isResting) {
    return <RestTimer duration={restDuration} onComplete={handleRestComplete} />;
  }

  if (!day || exerciseLog.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader><CardTitle>Error al Cargar</CardTitle></CardHeader>
        <CardContent><p>No se pudo cargar el entrenamiento del día.</p></CardContent>
      </Card>
    );
  }

  const currentExercise = exerciseLog[currentExerciseIndex];
  const allExercisesComplete = currentExerciseIndex >= exerciseLog.length;

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {day.title}
        </h1>
        <p className="text-muted-foreground">
          Ejercicio {currentExerciseIndex + 1} de {exerciseLog.length}
        </p>
      </div>

      {!allExercisesComplete ? (
        <WorkoutExerciseCard
          key={currentExercise.name}
          exercise={currentExercise}
          onSetsChange={(newSets) => updateSetLog(currentExerciseIndex, newSets)}
          onSetComplete={handleSetComplete}
        />
      ) : (
        <Card>
           <CardHeader><CardTitle>¡Día completado!</CardTitle></CardHeader>
           <CardContent className="text-center">
             <p className="mb-4">Has completado todos los ejercicios para hoy.</p>
             <Button size="lg" onClick={handleCompleteWorkout}>
               <Flame className="mr-2" />
               Finalizar y Guardar Entrenamiento
             </Button>
           </CardContent>
        </Card>
      )}

      {allExercisesComplete && (
         <div className="mt-6 text-center">
            <Button size="lg" onClick={handleCompleteWorkout}>
              <Flame className="mr-2" />
              Completar Entrenamiento
            </Button>
          </div>
      )}
    </div>
  );
}
