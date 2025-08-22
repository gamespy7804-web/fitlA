
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Repeat, Weight, Video, Timer, Youtube } from 'lucide-react';
import type { ExerciseLog, SetLog } from './page';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import useAudioEffects from '@/hooks/use-audio-effects';
import { useI18n } from '@/i18n/client';

interface WorkoutExerciseCardProps {
  exercise: ExerciseLog;
  set: SetLog;
  setIndex: number;
  onSetChange: (set: SetLog) => void;
  onSetComplete: () => void;
  onStartTimer: () => void;
}

export function WorkoutExerciseCard({ exercise, set, setIndex, onSetChange, onSetComplete, onStartTimer }: WorkoutExerciseCardProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const playSound = useAudioEffects();

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

  const handleAddToFeedbackQueue = () => {
    playSound('click');
    const pending = JSON.parse(localStorage.getItem('pendingFeedbackExercises') || '[]') as string[];
    if (!pending.includes(exercise.name)) {
        pending.push(exercise.name);
        localStorage.setItem('pendingFeedbackExercises', JSON.stringify(pending));
        // Manually trigger a storage event to notify other components (like the navbar badge)
        window.dispatchEvent(new Event('storage'));
        toast({
            title: t('workoutExerciseCard.feedbackQueue.added.title'),
            description: t('workoutExerciseCard.feedbackQueue.added.description', { name: exercise.name }),
        });
    } else {
         toast({
            variant: 'default',
            title: t('workoutExerciseCard.feedbackQueue.alreadyAdded.title'),
            description: t('workoutExerciseCard.feedbackQueue.alreadyAdded.description', { name: exercise.name }),
        });
    }
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
            </div>
          </div>
           {exercise.originalExercise.requiresFeedback && (
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button id="add-to-feedback-btn" variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={handleAddToFeedbackQueue}>
                            <Video />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('workoutExerciseCard.feedbackTooltip')}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 text-center font-bold text-primary">
            {t('workoutExerciseCard.set')} {setIndex + 1}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
            {exercise.originalExercise.requiresWeight ? (
              <div>
                <Label htmlFor={`weight-${setIndex}`} className="sr-only">{t('workoutExerciseCard.weightLabel')}</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`weight-${setIndex}`}
                    type="number"
                    placeholder={t('workoutExerciseCard.weightPlaceholder')}
                    className="pl-9"
                    value={set.weight || ''}
                    onChange={(e) => handleSetFieldChange('weight', e.target.value)}
                  />
                </div>
              </div>
            ) : <div />}
            <div>
              <Label htmlFor={`reps-${setIndex}`} className="sr-only">{isTimedExercise ? t('workoutExerciseCard.secondsLabel') : t('workoutExerciseCard.repsLabel')}</Label>
              <div className="relative">
                <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`reps-${setIndex}`}
                  type="number"
                  placeholder={isTimedExercise ? t('workoutExerciseCard.secondsPlaceholder') : t('workoutExerciseCard.repsPlaceholder')}
                  className="pl-9"
                  value={set.reps || ''}
                  onChange={(e) => handleSetFieldChange('reps', e.target.value)}
                  readOnly={isTimedExercise}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center flex flex-wrap justify-center gap-4">
          {isTimedExercise && (
              <Button variant="outline" onClick={onStartTimer}>
                  <Timer className="mr-2" />
                  {t('workoutExerciseCard.startTimer')}
              </Button>
          )}
          {exercise.originalExercise.youtubeQuery && (
            <a id="view-technique-btn" href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-red-500 border border-red-500/50 hover:bg-red-500/10 hover:text-red-500 h-10 px-4 py-2">
                <Youtube className="mr-2" />
                {t('workoutExerciseCard.viewTechnique')}
            </a>
          )}
        </div>

        <div className="mt-6 text-center">
            <Button size="lg" onClick={handleCompleteClick} disabled={!isSetDataEntered()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Check className="mr-2"/>
                {isLastSet ? t('workoutExerciseCard.finishExercise') : t('workoutExerciseCard.readyToRest')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
