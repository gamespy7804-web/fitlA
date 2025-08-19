'use client';

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
import { useToast } from '@/hooks/use-toast';
import { Check, Flame, Repeat, TrendingUp, Weight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  WorkoutRoutineOutput,
} from '@/ai/flows/workout-routine-generator';
import { useRouter } from 'next/navigation';

type SetLog = { weight: number; reps: number; completed: boolean };
type ExerciseLog = { name: string; sets: SetLog[] };
type DayLog = { title: string; exercises: ExerciseLog[]; completed: boolean };

export default function WorkoutPage() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutRoutineOutput | null>(null);
  const [workoutLog, setWorkoutLog] = useState<DayLog[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedRoutine = localStorage.getItem('workoutRoutine');
    if (storedRoutine) {
      const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
      setWorkoutPlan(parsedRoutine);
      initializeWorkoutLog(parsedRoutine);
    } else {
      // If no routine, maybe redirect to generator or show a message
      router.push('/dashboard');
    }
  }, [router]);

  const initializeWorkoutLog = (plan: WorkoutRoutineOutput) => {
    if (plan.isWeightTraining === false && plan.structuredRoutine) {
      const newLog = plan.structuredRoutine.map((day) => ({
        title: day.title,
        completed: false,
        exercises: day.exercises.map((exercise) => ({
          name: exercise.name,
          sets: Array.from({ length: parseInt(exercise.sets, 10) || 3 }, () => ({
            weight: 0,
            reps: 0,
            completed: false,
          })),
        })),
      }));
      setWorkoutLog(newLog);
    }
  };

  const handleSetChange = (
    dayIndex: number,
    exIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string
  ) => {
    const newLog = [...workoutLog];
    const numValue = parseInt(value, 10) || 0;
    newLog[dayIndex].exercises[exIndex].sets[setIndex][field] = numValue;
    setWorkoutLog(newLog);
  };

  const toggleSetComplete = (dayIndex: number, exIndex: number, setIndex: number) => {
    const newLog = [...workoutLog];
    const currentStatus = newLog[dayIndex].exercises[exIndex].sets[setIndex].completed;
    newLog[dayIndex].exercises[exIndex].sets[setIndex].completed = !currentStatus;
    setWorkoutLog(newLog);
  }

  const handleCompleteWorkout = (dayIndex: number) => {
    const day = workoutLog[dayIndex];
    if (!day) return;

    let totalVolume = 0;
    let totalDuration = 0; // Simple duration estimate
    const workoutTitle = workoutPlan?.structuredRoutine?.[dayIndex].title || 'Entrenamiento';
    const workoutOriginalDuration = workoutPlan?.structuredRoutine?.[dayIndex].duration || 60;


    day.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
          // Estimate 2 mins per completed set (work + rest)
          totalDuration += 2;
        }
      })
    });

    if (totalVolume === 0 && totalDuration === 0) {
      toast({
        variant: 'destructive',
        title: 'Entrenamiento Vacío',
        description: 'Debes completar al menos una serie para guardar el registro.',
      });
      return;
    }

    const completedWorkout = {
      date: new Date().toISOString(),
      workout: workoutTitle,
      duration: workoutOriginalDuration,
      volume: totalVolume,
    };

    // Store in local storage
    const allCompleted = JSON.parse(localStorage.getItem('completedWorkouts') || '[]');
    allCompleted.push(completedWorkout);
    localStorage.setItem('completedWorkouts', JSON.stringify(allCompleted));
    
    // Mark day as complete in UI
    const newLog = [...workoutLog];
    newLog[dayIndex].completed = true;
    setWorkoutLog(newLog);

    toast({
      title: '¡Entrenamiento Completado!',
      description: `${workoutTitle} ha sido guardado en tu registro.`,
    });
  };

  if (!workoutPlan) {
    return <div>Cargando rutina...</div>; // Or a better loading state
  }
  
  const routine = workoutPlan.structuredRoutine;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
             Tu Entrenamiento
          </h1>
          <p className="text-muted-foreground">
            Registra tus series, repeticiones y peso para seguir tu progreso.
          </p>
        </div>
        <Button variant="secondary">
          <TrendingUp className="mr-2" />
          Generar Progresión
        </Button>
      </div>
       {workoutPlan.isWeightTraining === false && routine ? (
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {routine.map((day, dayIndex) => (
              <AccordionItem value={`item-${dayIndex}`} key={day.day} disabled={workoutLog[dayIndex]?.completed}>
                <AccordionTrigger>
                  <div className="flex items-center gap-4 w-full">
                    <Badge className="text-lg px-3 py-1">Día {day.day}</Badge>
                    <span className="text-xl font-semibold font-headline">{day.title}</span>
                    {workoutLog[dayIndex]?.completed && (
                      <Badge variant="outline" className="ml-auto mr-4 bg-green-800/50 text-primary-foreground border-green-500">
                        <Check className="mr-2" /> Completado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {day.exercises.map((exercise, exIndex) => (
                      <Card key={exercise.name}>
                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{exercise.name}</span>
                            <Badge variant="outline">
                              {exercise.sets} series x {exercise.reps} reps
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {workoutLog[dayIndex]?.exercises[exIndex]?.sets.map((_, setIndex) => (
                              <div key={setIndex} className="flex items-center gap-2 sm:gap-4">
                                <div className="w-10 text-center font-bold text-primary">
                                  Serie {setIndex + 1}
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
                                  <div>
                                    <Label
                                      htmlFor={`weight-${dayIndex}-${exIndex}-${setIndex}`}
                                      className="sr-only"
                                    >
                                      Peso
                                    </Label>
                                    <div className="relative">
                                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        id={`weight-${dayIndex}-${exIndex}-${setIndex}`}
                                        type="number"
                                        placeholder="Peso (kg)"
                                        className="pl-9"
                                        onChange={(e) => handleSetChange(dayIndex, exIndex, setIndex, 'weight', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor={`reps-${dayIndex}-${exIndex}-${setIndex}`}
                                      className="sr-only"
                                    >
                                      Reps
                                    </Label>
                                    <div className="relative">
                                      <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        id={`reps-${dayIndex}-${exIndex}-${setIndex}`}
                                        type="number"
                                        placeholder="Reps"
                                        className="pl-9"
                                        onChange={(e) => handleSetChange(dayIndex, exIndex, setIndex, 'reps', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant={workoutLog[dayIndex]?.exercises[exIndex]?.sets[setIndex]?.completed ? 'default' : 'ghost'}
                                  onClick={() => toggleSetComplete(dayIndex, exIndex, setIndex)}
                                  className={workoutLog[dayIndex]?.exercises[exIndex]?.sets[setIndex]?.completed ? "bg-green-500 hover:bg-green-600" : "text-muted-foreground hover:text-primary"}
                                >
                                  <Check />
                                </Button>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button size="lg" onClick={() => handleCompleteWorkout(dayIndex)}>
                      <Flame className="mr-2" />
                      Completar Entrenamiento de {day.title}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Rutina de Entrenamiento con Pesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{workoutPlan.routine}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                El registro detallado para rutinas de entrenamiento con pesas estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
       )}
    </div>
  );
}
