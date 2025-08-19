'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Repeat, Weight, Video, Zap } from 'lucide-react';
import type { ExerciseLog, SetLog } from './page';

interface WorkoutExerciseCardProps {
  exercise: ExerciseLog;
  onSetsChange: (sets: SetLog[]) => void;
  onSetComplete: () => void;
}

export function WorkoutExerciseCard({ exercise, onSetsChange, onSetComplete }: WorkoutExerciseCardProps) {
  const [lastSetCompleted, setLastSetCompleted] = useState(false);

  const handleSetFieldChange = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...exercise.sets];
    const numValue = parseInt(value, 10) || 0;
    newSets[setIndex][field] = numValue;
    onSetsChange(newSets);
  };

  const handleToggleSetComplete = (setIndex: number) => {
    const newSets = [...exercise.sets];
    const isNowComplete = !newSets[setIndex].completed;
    newSets[setIndex].completed = isNowComplete;
    onSetsChange(newSets);

    if(isNowComplete) {
      const allPreviousSetsDone = newSets.slice(0, setIndex).every(s => s.completed);
      if(allPreviousSetsDone) {
        setLastSetCompleted(true);
      }
    } else {
       setLastSetCompleted(false);
    }
  };

  const handleReadyClick = () => {
    setLastSetCompleted(false);
    onSetComplete();
  };
  
  const allSetsCompleted = exercise.sets.every(s => s.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex-1 font-headline text-2xl">{exercise.name}</span>
          <Badge variant="outline" className="mx-2">
            {exercise.originalExercise.sets} series x {exercise.originalExercise.reps} reps
          </Badge>
          {exercise.originalExercise.requiresFeedback && (
            <Button asChild size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
              <Link href={`/feedback?exercise=${encodeURIComponent(exercise.name)}`} target="_blank">
                <Video className="mr-2" />
                Analizar
              </Link>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exercise.sets.map((set, setIndex) => {
           const isLocked = setIndex > 0 && !exercise.sets[setIndex - 1].completed;
           return (
            <div key={setIndex} className={`flex items-center gap-2 sm:gap-4 transition-opacity ${isLocked ? 'opacity-50' : 'opacity-100'}`}>
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
                        onChange={(e) => handleSetFieldChange(setIndex, 'weight', e.target.value)}
                        disabled={isLocked || set.completed}
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
                      placeholder={exercise.originalExercise.reps.includes('seg') ? 'Segundos' : 'Reps'}
                      className="pl-9"
                      value={set.reps || ''}
                      onChange={(e) => handleSetFieldChange(setIndex, 'reps', e.target.value)}
                      disabled={isLocked || set.completed}
                    />
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant={set.completed ? 'default' : 'ghost'}
                onClick={() => handleToggleSetComplete(setIndex)}
                disabled={isLocked}
                className={set.completed ? "bg-green-500 hover:bg-green-600" : "text-muted-foreground hover:text-primary"}
              >
                <Check />
              </Button>
            </div>
           )}
        )}
         {(lastSetCompleted || allSetsCompleted) && (
             <div className="mt-6 text-center">
                 <Button size="lg" onClick={handleReadyClick} className="bg-accent text-accent-foreground hover:bg-accent/90">
                     <Zap className="mr-2"/>
                     {allSetsCompleted ? "Siguiente Ejercicio" : "Listo para Descansar"}
                 </Button>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
