
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adaptiveProgressionGenerator } from '@/ai/flows/adaptive-progression-generator';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/client';

const formSchema = z.object({
  selfReportedFitness: z.enum(['easy', 'just-right', 'hard']),
  trainingDays: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(1).max(7).optional()
  ),
  trainingDuration: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(15).max(240).optional()
  ),
  userFeedback: z.string().optional(),
});

export function AdaptiveProgressionDialog({ children, className }: { children?: React.ReactNode, className?: string }) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canProgress, setCanProgress] = useState(false);
  const [originalRoutine, setOriginalRoutine] = useState<WorkoutRoutineOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selfReportedFitness: 'just-right',
      trainingDays: undefined,
      trainingDuration: undefined,
      userFeedback: '',
    },
  });

  useEffect(() => {
    const checkProgress = () => {
      const storedRoutine = localStorage.getItem('workoutRoutine');
      const detailedLogs = JSON.parse(localStorage.getItem('detailedWorkoutLogs') || '[]');
      
      if (storedRoutine) {
        try {
            const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
            setOriginalRoutine(parsedRoutine);
            // Enable progression if there's a routine and at least one log has been completed.
            if (parsedRoutine.structuredRoutine && parsedRoutine.structuredRoutine.length > 0) {
              if (detailedLogs.length > 0) {
                setCanProgress(true);
              } else {
                setCanProgress(false);
              }
            } else {
               setCanProgress(false);
            }
        }
        catch (e) {
            setCanProgress(false);
        }
      } else {
         setCanProgress(false);
      }
    };
    
    checkProgress();
    window.addEventListener('focus', checkProgress);
    window.addEventListener('storage', checkProgress);

    return () => {
        window.removeEventListener('focus', checkProgress);
        window.removeEventListener('storage', checkProgress);
    }
  }, []);

  useEffect(() => {
    if (originalRoutine?.structuredRoutine) {
      form.setValue('trainingDays', originalRoutine.structuredRoutine.length);
      const avgDuration = originalRoutine.structuredRoutine.reduce((acc, day) => acc + day.duration, 0) / originalRoutine.structuredRoutine.length;
      form.setValue('trainingDuration', Math.round(avgDuration));
    }
  }, [originalRoutine, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const originalRoutineJSON = localStorage.getItem('workoutRoutine');
      const detailedLogsJSON = localStorage.getItem('detailedWorkoutLogs');

      if (!originalRoutineJSON || !detailedLogsJSON || !originalRoutine?.structuredRoutine) {
        toast({ variant: 'destructive', title: t('adaptiveProgression.errors.insufficientData.title'), description: t('adaptiveProgression.errors.insufficientData.description') });
        setIsLoading(false);
        return;
      }
      
      const adherence = (JSON.parse(detailedLogsJSON).length / (originalRoutine.structuredRoutine.length || 1));

      const newRoutine = await adaptiveProgressionGenerator({
        selfReportedFitness: values.selfReportedFitness,
        originalRoutine: originalRoutineJSON,
        trainingData: detailedLogsJSON,
        adherence,
        trainingDays: values.trainingDays,
        trainingDuration: values.trainingDuration,
        userFeedback: values.userFeedback,
        language: locale,
      });

      localStorage.setItem('workoutRoutine', JSON.stringify(newRoutine));
      localStorage.setItem('completedWorkouts', '[]');
      localStorage.setItem('detailedWorkoutLogs', '[]');

      toast({
        title: t('adaptiveProgression.success.title'),
        description: t('adaptiveProgression.success.description'),
      });
      setIsOpen(false);
      window.location.reload();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('adaptiveProgression.errors.generationFailed.title'),
        description: t('adaptiveProgression.errors.generationFailed.description'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({ selfReportedFitness: 'just-right', userFeedback: ''});
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!canProgress} className={cn("w-full", className)}>
            {children || <>
            <span>{t('adaptiveProgression.generateNewRoutine')}</span>
            </>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Zap className="text-primary" /> {t('adaptiveProgression.title')}
          </DialogTitle>
          <DialogDescription>
            {t('adaptiveProgression.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="selfReportedFitness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adaptiveProgression.howDidYouFeel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">{t('adaptiveProgression.fitnessLevels.easy')}</SelectItem>
                      <SelectItem value="just-right">{t('adaptiveProgression.fitnessLevels.just-right')}</SelectItem>
                      <SelectItem value="hard">{t('adaptiveProgression.fitnessLevels.hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userFeedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adaptiveProgression.feedbackLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('adaptiveProgression.feedbackPlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">{t('adaptiveProgression.nextWeekSettings')}</p>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('adaptiveProgression.daysPerWeek')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('adaptiveProgression.daysPlaceholder')} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trainingDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('adaptiveProgression.minPerSession')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('adaptiveProgression.durationPlaceholder')} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('adaptiveProgression.generateNewRoutine')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
