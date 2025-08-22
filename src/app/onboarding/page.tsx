
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { generateWorkoutRoutine, type WorkoutRoutineOutput } from '@/ai/flows/workout-routine-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { useAuth } from '@/hooks/use-auth';


const createFormSchema = (t: (key: string) => string) => {
    const step1Schema = z.object({
        sport: z.string().min(1, t('onboarding.validation.sport.min')),
        goals: z.string().min(1, t('onboarding.validation.goals.min')),
        fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required') }),
    });

    const step2Schema = z.object({
        age: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.coerce.number({invalid_type_error: t('onboarding.validation.age.required')}).int().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max'))
        ),
        weight: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.coerce.number({invalid_type_error: t('onboarding.validation.weight.required')}).min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max'))
        ),
        gender: z.enum(['male', 'female', 'other'], { required_error: t('onboarding.validation.gender.required') }),
        trainingDays: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max'))
        ),
        trainingDuration: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max'))
        ),
    });
    
    return step1Schema.merge(step2Schema);
};


export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherSportInput, setShowOtherSportInput] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const formSchema = createFormSchema(t);
  type OnboardingData = z.infer<typeof formSchema>;

  const form = useForm<OnboardingData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      sport: '',
      goals: '',
      fitnessLevel: undefined,
      age: undefined,
      weight: undefined,
      gender: undefined,
      trainingDays: 3,
      trainingDuration: 60,
    }
  });
  const { watch, setValue, trigger, handleSubmit } = form;
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
  
  const handleNextStep = async () => {
    const isValid = await trigger(step === 1 ? ['sport', 'goals', 'fitnessLevel'] : ['age', 'weight', 'gender', 'trainingDays', 'trainingDuration']);
    if (!isValid) {
        toast({variant: 'destructive', title: t('onboarding.errors.validation.title'), description: t('onboarding.errors.validation.description')});
        return;
    }
    setStep(s => s + 1);
  }

  const handleFinalSubmit = async (data: OnboardingData) => {
    setIsLoading(true);
    try {
      const response = await generateWorkoutRoutine({ ...data, language: locale });
      if (response.routine || response.structuredRoutine) {
        localStorage.setItem('workoutRoutine', JSON.stringify({...response, sport: data.sport}));
        localStorage.setItem('onboardingComplete', 'true');
        toast({ title: t('onboarding.success.title'), description: t('onboarding.success.description') });
        router.push('/');
      } else {
        toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
      }
    } catch(e) {
      console.error(e);
      toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
      setIsLoading(false);
    }
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
            {t('onboarding.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-4">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="space-y-4"
                    >
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
                            <Button type="button" onClick={handleNextStep} className="w-full" size="lg">
                                {t('onboarding.buttons.next')}
                            </Button>
                        </div>
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
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField
                              control={form.control}
                              name="age"
                              render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('onboarding.questions.age.label')}</FormLabel>
                                    <FormControl><Input type="number" placeholder={t('onboarding.questions.age.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>{t('onboarding.questions.weight.label')}</FormLabel>
                                  <FormControl><Input type="number" placeholder={t('onboarding.questions.weight.placeholder')} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ''} /></FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                              <FormItem>
                                  <FormLabel>{t('onboarding.questions.gender.label')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder={t('onboarding.questions.gender.placeholder')} /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      <SelectItem value="male">{t('onboarding.questions.gender.options.male')}</SelectItem>
                                      <SelectItem value="female">{t('onboarding.questions.gender.options.female')}</SelectItem>
                                      <SelectItem value="other">{t('onboarding.questions.gender.options.other')}</SelectItem>
                                  </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                         </div>
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
                                  {isLoading ? <Loader2 className="animate-spin" /> : t('onboarding.buttons.generate')}
                              </Button>
                          </div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
                Paso {step} de 2
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    