
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { generateWorkoutRoutine, type WorkoutRoutineOutput, type AssessmentQuestion } from '@/ai/flows/workout-routine-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Loader2, Bot, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { useAuth } from '@/hooks/use-auth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Step 1: Initial info
const step1Schema = z.object({
  sport: z.string().min(1, 'onboarding.validation.sport.min'),
  goals: z.string().min(1, 'onboarding.validation.goals.min'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: 'workoutGenerator.form.validations.fitnessLevel.required' }),
});

// Step 2: Training preferences
const step2Schema = z.object({
    trainingDays: z.coerce.number({invalid_type_error: 'onboarding.validation.trainingDays.required'}).int().min(1, 'onboarding.validation.trainingDays.min').max(7, 'onboarding.validation.trainingDays.max'),
    trainingDuration: z.coerce.number({invalid_type_error: 'onboarding.validation.trainingDuration.required'}).int().min(15, 'onboarding.validation.trainingDuration.min').max(240, 'onboarding.validation.trainingDuration.max'),
});

const formSchema = step1Schema.merge(step2Schema);

type OnboardingData = z.infer<typeof formSchema>;

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherSportInput, setShowOtherSportInput] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      sport: '',
      goals: '',
      fitnessLevel: undefined,
      trainingDays: undefined,
      trainingDuration: undefined,
    }
  });
  const { watch, setValue, trigger } = form;
  const sportValue = watch('sport');

  useEffect(() => {
    if (!authLoading && user) {
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        if (onboardingComplete === 'true') {
            router.replace('/dashboard');
        }
    }
  }, [user, authLoading, router]);

  const popularSports = [
    { id: 'weightlifting', name: t('onboarding.questions.sport.options.weightlifting') },
    { id: 'calisthenics', name: t('onboarding.questions.sport.options.calisthenics') },
    { id: 'running', name: t('onboarding.questions.sport.options.running') },
    { id: 'yoga', name: t('onboarding.questions.sport.options.yoga') },
  ];

  const handleSportSelect = (sportName: string) => {
    setValue('sport', sportName, { shouldValidate: true });
    setShowOtherSportInput(false);
  };

  const handleOtherSportClick = () => {
    setValue('sport', '', { shouldValidate: true });
    setShowOtherSportInput(true);
  };
  
  const handleInitialSubmit = async () => {
    const isValid = await trigger(['sport', 'goals', 'fitnessLevel']);
    if (!isValid) {
        toast({variant: 'destructive', title: t('onboarding.errors.validation.title'), description: t('onboarding.errors.validation.description')});
        return;
    }
    setStep(2);
  }
  
  const handlePreferencesSubmit = async () => {
    const isValid = await trigger(['trainingDays', 'trainingDuration']);
    if (!isValid) {
        toast({variant: 'destructive', title: t('onboarding.errors.validation.title'), description: t('onboarding.errors.validation.description')});
        return;
    }

    setIsLoading(true);
    setAssessmentQuestions([]);

    try {
        const values = form.getValues();
        const response = await generateWorkoutRoutine({ ...values, language: locale, fitnessAssessment: '' });
        
        if (response.assessmentQuestions && response.assessmentQuestions.length > 0) {
            setAssessmentQuestions(response.assessmentQuestions);
            setStep(3); // Go to assessment step
        } else {
             // This case should ideally not happen with the new prompt, but as a fallback, we finish.
             handleFinish(response);
        }
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
        setIsLoading(false);
    }
  }

  const handleAssessmentSubmit = async () => {
    if (Object.keys(assessmentAnswers).length < assessmentQuestions.length) {
      toast({ variant: 'destructive', title: t('onboarding.errors.validation.title'), description: t('onboarding.errors.validation.assessment') });
      return;
    }
    
    setIsLoading(true);
    
    const assessmentHistory = assessmentQuestions.map(q => `Q: ${q.question} A: ${assessmentAnswers[q.question]}`).join('\n');

    try {
        const values = form.getValues();
        const response = await generateWorkoutRoutine({ 
            ...values, 
            language: locale, 
            fitnessAssessment: assessmentHistory
        });

        if(response.routine || response.structuredRoutine) {
            handleFinish(response);
        } else {
            // This might happen if the AI needs more info, but our current flow aims to prevent this.
            toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
        }
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleFinish = (result: WorkoutRoutineOutput) => {
      localStorage.setItem('workoutRoutine', JSON.stringify({...result, sport: form.getValues('sport')}));
      localStorage.setItem('onboardingComplete', 'true');
      toast({ title: t('onboarding.success.title'), description: t('onboarding.success.description') });
      router.push('/dashboard');
  }


  if (authLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center">
            {step === 3 ? t('onboarding.aiThinking') : t('onboarding.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
              >
                <FormProvider {...form}>
                  <form onSubmit={(e) => { e.preventDefault(); handleInitialSubmit(); }} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sport"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base">{t('onboarding.questions.sport.label')}</FormLabel>
                          <div className="space-y-2 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {popularSports.map(sport => (
                                <Button key={sport.id} type="button" variant={sportValue === sport.name ? 'default' : 'outline'} onClick={() => handleSportSelect(sport.name)}>
                                  {sport.name}
                                </Button>
                              ))}
                              <Button type="button" variant={showOtherSportInput ? 'default' : 'outline'} onClick={handleOtherSportClick}>
                                {t('onboarding.questions.sport.options.other')}
                              </Button>
                            </div>
                            {(showOtherSportInput || (!popularSports.some(p => p.name === sportValue) && sportValue)) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                                <Input type="text" placeholder={t('onboarding.questions.sport.placeholder')} {...form.register('sport')} />
                              </motion.div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">{t('onboarding.questions.goals.label')}</FormLabel>
                          <FormControl><Input placeholder={t('onboarding.questions.goals.placeholder')} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('onboarding.questions.fitnessLevel.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={t('workoutGenerator.form.fitnessLevel.placeholder')} /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">{t('onboarding.questions.fitnessLevel.options.beginner')}</SelectItem>
                              <SelectItem value="intermediate">{t('onboarding.questions.fitnessLevel.options.intermediate')}</SelectItem>
                              <SelectItem value="advanced">{t('onboarding.questions.fitnessLevel.options.advanced')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button type="submit" className="w-full" size="lg">
                        {t('onboarding.buttons.next')}
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              </motion.div>
            )}

            {step === 2 && (
                 <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="space-y-4"
                >
                    <FormProvider {...form}>
                     <form onSubmit={(e) => { e.preventDefault(); handlePreferencesSubmit(); }} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="trainingDays"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('onboarding.questions.trainingDays.label')}</FormLabel>
                                <FormControl><Input type="number" placeholder={t('onboarding.questions.trainingDays.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="trainingDuration"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('onboarding.questions.trainingDuration.label')}</FormLabel>
                                <FormControl><Input type="number" placeholder={t('onboarding.questions.trainingDuration.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="pt-4 flex items-center gap-4">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                                <ChevronLeft /> {t('onboarding.buttons.back')}
                            </Button>
                            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                                {isLoading ? <Loader2 className="animate-spin" /> : t('onboarding.buttons.next')}
                            </Button>
                        </div>
                     </form>
                    </FormProvider>
                </motion.div>
            )}

            {step === 3 && (
               <motion.div
                key="assessment"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="space-y-6"
               >
                 {isLoading && assessmentQuestions.length === 0 ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="animate-spin text-primary size-10" />
                    </div>
                 ) : (
                    <>
                        <div className="mb-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start text-left">
                          <Bot className="text-primary size-10 shrink-0 mt-1" />
                           <p className="text-secondary-foreground font-medium">{t('onboarding.questions.assessment.intro')}</p>
                        </div>
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
                                                <RadioGroupItem value={opt} id={`${index}-${opt}`} />
                                                <Label htmlFor={`${index}-${opt}`}>{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex items-center gap-4">
                            <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={isLoading}>
                                <ChevronLeft /> {t('onboarding.buttons.back')}
                            </Button>
                            <Button onClick={handleAssessmentSubmit} disabled={isLoading} className="w-full" size="lg">
                                {isLoading ? <Loader2 className="animate-spin" /> : t('onboarding.buttons.generate')}
                            </Button>
                        </div>
                    </>
                 )}
               </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
