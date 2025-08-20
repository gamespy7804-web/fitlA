
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Repeat, Weight, Video, Timer, Youtube } from 'lucide-react';
import type { ExerciseLog, SetLog } from './page';

interface WorkoutExerciseCardProps {
  exercise: ExerciseLog;
  set: SetLog;
  setIndex: number;
  onSetChange: (set: SetLog) => void;
  onSetComplete: () => void;
  onStartTimer: () => void;
}

export function WorkoutExerciseCard({ exercise, set, setIndex, onSetChange, onSetComplete, onStartTimer }: WorkoutExerciseCardProps) {

  const handleSetFieldChange = (field: 'weight' | 'reps', value: string) => {
    const newSet = { ...set };
    const numValue = parseInt(value, 10) || 0;
    newSet[field] = numValue;
    onSetChange(newSet);
  };

  const handleCompleteClick = () => {
    onSetComplete();
  };
  
  const allSetsInExercise = exercise.sets.length;
  const isLastSet = setIndex === allSetsInExercise - 1;
  const isTimedExercise = exercise.originalExercise.reps.includes('seg');

  const isSetDataEntered = () => {
    // For timed exercises, we only need a value greater than 0 in reps (seconds)
    if (isTimedExercise) {
        return set.reps > 0;
    }
    // For rep-based exercises
    if (exercise.originalExercise.requiresWeight) {
      return (set.reps > 0) && (set.weight > 0);
    }
    return set.reps > 0;
  }

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.originalExercise.youtubeQuery)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start gap-2">
          <div className="flex-1 space-y-1">
            <span className="font-headline text-2xl">{exercise.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {exercise.originalExercise.reps}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Descanso: {exercise.originalExercise.rest}
              </Badge>
            </div>
          </div>
           {exercise.originalExercise.requiresFeedback && (
              // This is a standard a tag now to ensure it's treated as an external link
              <a href={`/feedback?exercise=${encodeURIComponent(exercise.name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 text-primary hover:bg-primary/10">
                  <Video />
              </a>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 text-center font-bold text-primary">
            Serie {setIndex + 1}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
            {exercise.originalExercise.requiresWeight ? (
              <div>
                <Label htmlFor={`weight-${setIndex}`} className="sr-only">Peso</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`weight-${setIndex}`}
                    type="number"
                    placeholder="Peso (kg)"
                    className="pl-9"
                    value={set.weight || ''}
                    onChange={(e) => handleSetFieldChange('weight', e.target.value)}
                  />
                </div>
              </div>
            ) : <div />}
            <div>
              <Label htmlFor={`reps-${setIndex}`} className="sr-only">Reps</Label>
              <div className="relative">
                <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`reps-${setIndex}`}
                  type="number"
                  placeholder={isTimedExercise ? 'Segundos' : 'Reps'}
                  className="pl-9"
                  value={set.reps || ''}
                  onChange={(e) => handleSetFieldChange('reps', e.target.value)}
                  readOnly={isTimedExercise}
                />
              </div>
            </div>
          </div>
        </div>

        {isTimedExercise ? (
             <div className="mt-4 text-center">
                <Button variant="outline" onClick={onStartTimer}>
                    <Timer className="mr-2" />
                    Iniciar Cronómetro
                </Button>
            </div>
        ) : (
             exercise.originalExercise.youtubeQuery && (
                <div className="mt-4 text-center">
                    <Button asChild variant="outline" className="text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-500">
                        <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer">
                            <Youtube className="mr-2" />
                            Ver Técnica
                        </a>
                    </Button>
                </div>
             )
        )}

        <div className="mt-6 text-center">
            <Button size="lg" onClick={handleCompleteClick} disabled={!isSetDataEntered()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Check className="mr-2"/>
                {isLastSet ? "Finalizar Ejercicio" : "Listo para Descansar"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
