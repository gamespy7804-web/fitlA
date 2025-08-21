
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import { type WorkoutRoutineOutput } from '@/ai/flows/types';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/i18n/client';

const formSchema = z.object({
  goals: z.string().min(3, 'Los objetivos deben tener al menos 3 caracteres.'),
  sport: z.string().min(3, 'El deporte debe tener al menos 3 caracteres.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDays: z.coerce.number().min(1).max(7),
  trainingDuration: z.coerce.number().min(15).max(240),
  clarificationAnswers: z.string().optional(),
});

interface WorkoutGeneratorDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WorkoutGeneratorDialog({ children, open, onOpenChange }: WorkoutGeneratorDialogProps) {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [result, setResult] = useState<WorkoutRoutineOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: '',
      sport: '',
      fitnessLevel: 'intermediate',
      trainingDays: 3,
      trainingDuration: 60,
      clarificationAnswers: '',
    },
  });
  
  const getValidationMessages = (path: 'goals' | 'sport' | 'fitnessLevel' | 'trainingDays' | 'trainingDuration') => {
      return {
        required_error: t(`workoutGenerator.form.validations.${path}.required`),
        invalid_type_error: t(`workoutGenerator.form.validations.${path}.invalid`),
      };
  };

 const localizedFormSchema = z.object({
  goals: z.string().min(3, t('workoutGenerator.form.validations.goals.min')),
  sport: z.string().min(3, t('workoutGenerator.form.validations.sport.min')),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], getValidationMessages('fitnessLevel')),
  trainingDays: z.coerce.number(getValidationMessages('trainingDays')).min(1, t('workoutGenerator.form.validations.trainingDays.min')).max(7, t('workoutGenerator.form.validations.trainingDays.max')),
  trainingDuration: z.coerce.number(getValidationMessages('trainingDuration')).min(15, t('workoutGenerator.form.validations.trainingDuration.min')).max(240, t('workoutGenerator.form.validations.trainingDuration.max')),
  clarificationAnswers: z.string().optional(),
 });

 form.resolver = zodResolver(localizedFormSchema);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const apiValues = {
        ...values,
        language: locale,
    };

    // If there's a clarification question, it means this is the second step.
    if (clarificationQuestion) {
      try {
        const routine = await generateWorkoutRoutine(apiValues);
        setResult(routine);
        localStorage.setItem('workoutRoutine', JSON.stringify(routine));
        setClarificationQuestion(''); // Reset for next time
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: t('workoutGenerator.errors.generationFailed.title'),
          description: t('workoutGenerator.errors.generationFailed.description'),
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // First step: get clarification question or full routine
    try {
      const { sport, goals, fitnessLevel } = values;
      const initialResult = await generateWorkoutRoutine({ sport, goals, fitnessLevel, language: locale });
      if (initialResult.clarificationQuestion) {
        setClarificationQuestion(initialResult.clarificationQuestion);
      } else {
        const routine = await generateWorkoutRoutine(apiValues);
        setResult(routine);
        localStorage.setItem('workoutRoutine', JSON.stringify(routine));
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('workoutGenerator.errors.generationFailed.title'),
        description: t('workoutGenerator.errors.generationFailed.description'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    if (!open) {
      form.reset();
      setResult(null);
      setClarificationQuestion('');
      setIsLoading(false);
    }
  };
  
  const handleDialogClose = () => {
    handleOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" /> {t('workoutGenerator.title')}
          </DialogTitle>
          <DialogDescription>
            {clarificationQuestion 
              ? t('workoutGenerator.descriptionClarification')
              : t('workoutGenerator.descriptionInitial')}
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {clarificationQuestion ? (
                <FormField
                  control={form.control}
                  name="clarificationAnswers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{clarificationQuestion}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('workoutGenerator.form.clarificationPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workoutGenerator.form.goals.label')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('workoutGenerator.form.goals.placeholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('workoutGenerator.form.sport.label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('workoutGenerator.form.sport.placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('workoutGenerator.form.fitnessLevel.label')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('workoutGenerator.form.fitnessLevel.placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">{t('workoutGenerator.form.fitnessLevel.options.beginner')}</SelectItem>
                              <SelectItem value="intermediate">{t('workoutGenerator.form.fitnessLevel.options.intermediate')}</SelectItem>
                              <SelectItem value="advanced">{t('workoutGenerator.form.fitnessLevel.options.advanced')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="trainingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('workoutGenerator.form.trainingDays.label')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                          <FormLabel>{t('workoutGenerator.form.trainingDuration.label')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {clarificationQuestion ? t('workoutGenerator.form.buttons.final') : t('workoutGenerator.form.buttons.next')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold font-headline">
              {t('workoutGenerator.result.title')}
            </h3>
            <ScrollArea className="h-96">
              {result.isWeightTraining === false && result.structuredRoutine ? (
                <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                  {result.structuredRoutine.map((day, index) => (
                    <AccordionItem value={`item-${index}`} key={day.day}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-4">
                          <Badge className="text-lg px-3 py-1">{t('workoutGenerator.result.day')} {day.day}</Badge>
                          <span className="text-xl font-semibold font-headline">{day.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('workoutGenerator.result.table.exercise')}</TableHead>
                              <TableHead>{t('workoutGenerator.result.table.sets')}</TableHead>
                              <TableHead>{t('workoutGenerator.result.table.repsTime')}</TableHead>
                              <TableHead>{t('workoutGenerator.result.table.rest')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {day.exercises.map((exercise) => (
                              <TableRow key={exercise.name}>
                                <TableCell className="font-medium">{exercise.name}</TableCell>
                                <TableCell>{exercise.sets}</TableCell>
                                <TableCell>{exercise.reps}</TableCell>
                                <TableCell>{exercise.rest}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-1">
                  {result.routine}
                </p>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleDialogClose}>
                {t('workoutGenerator.result.buttons.closeAndReload')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
