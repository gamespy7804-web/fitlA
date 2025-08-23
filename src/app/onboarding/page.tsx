
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
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
import { Loader2, ChevronLeft, Minus, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';


const createFormSchema = (t: (key: string) => string) => {
    const step1Schema = z.object({
        sport: z.string().min(1, t('onboarding.validation.sport.min')),
        goals: z.string().min(1, t('onboarding.validation.goals.min')),
        fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required') }),
    });

    const step2Schema = z.object({
        age: z.coerce.number({invalid_type_error: t('onboarding.validation.age.required')}).int().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max')),
        weight: z.coerce.number({invalid_type_error: t('onboarding.validation.weight.required')}).min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max')),
        gender: z.enum(['male', 'female', 'other'], { required_error: t('onboarding.validation.gender.required') }),
        trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
        trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
    });
    
    return step1Schema.merge(step2Schema);
};

// Stepper Component
const Stepper = ({ label, value, onValueChange, min, max, step, unit }: { label: string, value: number, onValueChange: (val: number) => void, min: number, max: number, step: number, unit?: string }) => {
  const increment = () => onValueChange(Math.min(max, value + step));
  const decrement = () => onValueChange(Math.max(min, value - step));

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center justify-between gap-2 p-2 border rounded-lg">
        <Button type="button" variant="ghost" size="icon" onClick={decrement} className="rounded-full w-10 h-10">
          <Minus className="h-5 w-5" />
        </Button>
        <span className="text-2xl font-bold font-mono min-w-24 text-center">{value} {unit}</span>
        <Button type="button" variant="ghost" size="icon" onClick={increment} className="rounded-full w-10 h-10">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherSportInput, setShowOtherSportInput] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = createFormSchema(t);
  type OnboardingData = z.infer<typeof formSchema>;

  const form = useForm<OnboardingData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      sport: '',
      goals: '',
      fitnessLevel: undefined,
      age: 25,
      weight: 70,
      gender: undefined,
      trainingDays: 3,
      trainingDuration: 60,
    }
  });
  const { watch, setValue, trigger, handleSubmit } = form;
  const sportValue = watch('sport');
  const genderValue = watch('gender');

  useEffect(() => {
    // This page is now the entry point for new (anonymous) users.
    // If for some reason a user who has already onboarded lands here, send them to dashboard.
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const popularSports = [
    { id: 'weightlifting', name: t('onboarding.questions.sport.options.weightlifting') },
    { id: 'calisthenics', name: t('onboarding.questions.sport.options.calisthenics') },
    { id: 'running', name: t('onboarding.questions.sport.options.running') },
    { id: 'yoga', name: t('onboarding.questions.sport.options.yoga') },
  ];
  
  const genderOptions = [
    { id: 'male', name: t('onboarding.questions.gender.options.male') },
    { id: 'female', name: t('onboarding.questions.gender.options.female') },
    { id: 'other', name: t('onboarding.questions.gender.options.other') },
  ]

  const handleSportSelect = (sportName: string) => {
    setValue('sport', sportName, { shouldValidate: true });
    setShowOtherSportInput(false);
  };
  
  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    setValue('gender', gender, { shouldValidate: true });
  }

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
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await generateWorkoutRoutine({ ...data, language: locale });
            if (response.structuredRoutine && response.structuredRoutine.length > 0) {
                localStorage.setItem('workoutRoutine', JSON.stringify({...response, sport: data.sport}));
                localStorage.setItem('onboardingComplete', 'true');
                toast({ title: t('onboarding.success.title'), description: t('onboarding.success.description') });
                router.push('/dashboard');
                return; // Success, exit the loop
            } else {
                // This case handles a successful API call that returns an empty/invalid routine
                throw new Error("Generated routine is empty or invalid.");
            }
        } catch(e) {
            attempts++;
            console.error(`Attempt ${attempts} failed:`, e);
            if (attempts >= maxAttempts) {
                toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
            }
        }
    }
    setIsLoading(false);
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
                          className="space-y-6"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="age"
                              render={({ field }) => (
                                  <FormItem>
                                    <Stepper 
                                      label={t('onboarding.questions.age.label')}
                                      value={field.value || 0}
                                      onValueChange={field.onChange}
                                      min={10} max={100} step={1}
                                    />
                                    <FormMessage />
                                  </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                  <FormItem>
                                    <Stepper 
                                      label={t('onboarding.questions.weight.label')}
                                      value={field.value || 0}
                                      onValueChange={field.onChange}
                                      min={30} max={200} step={1}
                                      unit="kg"
                                    />
                                  <FormMessage />
                                  </FormItem>
                              )}
                            />
                         </div>
                           <FormField
                              control={form.control}
                              name="gender"
                              render={() => (
                              <FormItem>
                                  <FormLabel>{t('onboarding.questions.gender.label')}</FormLabel>
                                   <div className="flex items-center gap-2 pt-2">
                                    {genderOptions.map(option => (
                                      <Button 
                                        key={option.id}
                                        type="button" 
                                        variant={genderValue === option.id ? 'default' : 'outline'}
                                        onClick={() => handleGenderSelect(option.id as any)}
                                        className="w-full"
                                      >
                                        {genderValue === option.id && <Check className="mr-2 h-4 w-4" />}
                                        {option.name}
                                      </Button>
                                    ))}
                                  </div>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="trainingDays"
                              render={({ field }) => (
                                  <FormItem>
                                    <Stepper 
                                      label={t('onboarding.questions.trainingDays.label')}
                                      value={field.value || 0}
                                      onValueChange={field.onChange}
                                      min={1} max={7} step={1}
                                    />
                                    <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="trainingDuration"
                              render={({ field }) => (
                                  <FormItem>
                                    <Stepper 
                                      label={t('onboarding.questions.trainingDuration.label')}
                                      value={field.value || 0}
                                      onValueChange={field.onChange}
                                      min={15} max={240} step={15}
                                      unit="min"
                                    />
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
                {t('onboarding.step', { step })}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
