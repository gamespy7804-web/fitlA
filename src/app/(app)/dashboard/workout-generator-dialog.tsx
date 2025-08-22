
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateWorkoutRoutine, type WorkoutRoutineOutput, type AssessmentQuestion } from '@/ai/flows/workout-routine-generator';
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
import { Loader2, Sparkles, Bot, ChevronLeft } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const createFormSchema = (t: (key: string) => string) => z.object({
  goals: z.string().min(3, t('workoutGenerator.form.validations.goals.min')),
  sport: z.string().min(3, t('workoutGenerator.form.validations.sport.min')),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required') }),
  trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
  trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
});


interface WorkoutGeneratorDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WorkoutGeneratorDialog({ children, open, onOpenChange }: WorkoutGeneratorDialogProps) {
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WorkoutRoutineOutput | null>(null);
  const [step, setStep] = useState(1);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const formSchema = createFormSchema((key: string) => t(key as any));
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: '',
      sport: '',
      trainingDays: 3,
      trainingDuration: 60,
      fitnessLevel: undefined,
    }
  });

  const handleInitialSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsLoading(true);
    setResult(null);

    try {
      const values = form.getValues();
      const routine = await generateWorkoutRoutine({ ...values, language: locale, fitnessAssessment: '' });

      if (routine.assessmentQuestions && routine.assessmentQuestions.length > 0) {
        setAssessmentQuestions(routine.assessmentQuestions);
        setStep(2);
      } else {
        setResult(routine);
        localStorage.setItem('workoutRoutine', JSON.stringify({...routine, sport: values.sport}));
        setStep(3);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('workoutGenerator.errors.generationFailed.title'), description: t('workoutGenerator.errors.generationFailed.description') });
    } finally {
      setIsLoading(false);
    }
  }


  const handleAssessmentSubmit = async () => {
    if (!assessmentQuestions || Object.keys(assessmentAnswers).length < assessmentQuestions.length) {
        toast({ variant: 'destructive', title: t('onboarding.errors.validation.title'), description: t('onboarding.errors.validation.assessment') });
        return;
    }
    setIsLoading(true);

    const assessmentHistory = assessmentQuestions.map(q => `Q: ${q.question} A: ${assessmentAnswers[q.question]}`).join('\n');

    try {
        const values = form.getValues();
        const routine = await generateWorkoutRoutine({
            ...values,
            language: locale,
            fitnessAssessment: assessmentHistory
        });
        setResult(routine);
        localStorage.setItem('workoutRoutine', JSON.stringify({...routine, sport: values.sport}));
        setStep(3);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: t('workoutGenerator.errors.generationFailed.title'), description: t('workoutGenerator.errors.generationFailed.description') });
    } finally {
        setIsLoading(false);
    }
  }


  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    if (!open) {
      form.reset({
        goals: '',
        sport: '',
        trainingDays: 3,
        trainingDuration: 60,
        fitnessLevel: undefined,
      });
      setResult(null);
      setIsLoading(false);
      setStep(1);
      setAssessmentQuestions(null);
      setAssessmentAnswers({});
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
            {step === 1 && t('workoutGenerator.descriptionInitial')}
            {step === 2 && t('onboarding.aiThinking')}
            {step === 3 && t('workoutGenerator.result.title')}
          </DialogDescription>
        </DialogHeader>
        {step === 1 && (
          <Form {...form}>
            <form onSubmit={(e) => {e.preventDefault(); handleInitialSubmit()}} className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('workoutGenerator.form.trainingDays.label')}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} />
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
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('onboarding.buttons.next')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        {step === 2 && (
             <div className="space-y-4">
                {isLoading && !assessmentQuestions && <div className='flex justify-center items-center h-48'><Loader2 className='animate-spin text-primary size-10' /></div>}
                {assessmentQuestions && !isLoading && (
                    <>
                        <div className="mb-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start text-left">
                          <Bot className="text-primary size-10 shrink-0 mt-1" />
                           <p className="text-secondary-foreground font-medium">{t('onboarding.questions.assessment.intro')}</p>
                        </div>
                        <ScrollArea className="h-72 pr-4">
                            <div className='space-y-6'>
                                {assessmentQuestions.map((q, index) => (
                                    <div key={index}>
                                        <Label className="font-semibold">{q.question}</Label>
                                        <RadioGroup 
                                            className="mt-2"
                                            onValueChange={(value) => setAssessmentAnswers(prev => ({...prev, [q.question]: value}))}
                                            value={assessmentAnswers[q.question]}
                                        >
                                            {q.options.map(opt => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`dialog-${index}-${opt}`} />
                                                    <Label htmlFor={`dialog-${index}-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                         <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                                <ChevronLeft /> {t('onboarding.buttons.back')}
                            </Button>
                             <Button onClick={handleAssessmentSubmit} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('onboarding.buttons.generate')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
             </div>
        )}
        {step === 3 && result && (
          <div className="space-y-4">
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
