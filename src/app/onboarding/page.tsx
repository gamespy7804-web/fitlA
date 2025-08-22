
'use client';

import { useState } from 'react';
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
import { Loader2, Sparkles, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';

const createOnboardingSchema = (t: (key: string, ...args: any[]) => string) => z.object({
  sport: z.string().min(3, t('onboarding.validation.sport.min')),
  goals: z.string().min(3, t('onboarding.validation.goals.min')),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  age: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max')).optional()
  ),
  weight: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max')).optional()
  ),
  gender: z.enum(['male', 'female', 'other']).optional(),
  trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
  trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
  fitnessAssessment: z.string().min(1, t('onboarding.validation.clarification.min')),
});

type OnboardingData = z.infer<ReturnType<typeof createOnboardingSchema>>;

type StepId = 'sport' | 'goals' | 'fitnessLevel' | 'details' | 'assessment';

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<StepId>('sport');
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [showOtherSportInput, setShowOtherSportInput] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(createOnboardingSchema(t)),
    defaultValues: {
      sport: '',
      goals: '',
      fitnessLevel: 'intermediate',
      age: undefined,
      weight: undefined,
      gender: 'male',
      fitnessAssessment: '',
    },
    mode: 'onChange'
  });
  
  const sportValue = form.watch('sport');

  const popularSports = [
      { id: 'weightlifting', name: t('onboarding.questions.sport.options.weightlifting') },
      { id: 'calisthenics', name: t('onboarding.questions.sport.options.calisthenics') },
      { id: 'running', name: t('onboarding.questions.sport.options.running') },
      { id: 'yoga', name: t('onboarding.questions.sport.options.yoga') },
  ];

  const handleNext = async () => {
    setDirection(1);
    
    switch (currentStep) {
      case 'sport':
        if (await form.trigger('sport')) setCurrentStep('goals');
        break;
      case 'goals':
        if (await form.trigger('goals')) setCurrentStep('fitnessLevel');
        break;
      case 'fitnessLevel':
        if (await form.trigger('fitnessLevel')) setCurrentStep('details');
        break;
      case 'details':
        if(await form.trigger(['trainingDays', 'trainingDuration', 'age', 'weight', 'gender'])) setCurrentStep('assessment');
        break;
      case 'assessment':
        if (await form.trigger(['fitnessAssessment'])) {
          handleSubmitForm();
        }
        break;
    }
  };

  const handleBack = () => {
    setDirection(-1);
    switch (currentStep) {
      case 'assessment':
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('fitnessLevel');
        break;
      case 'fitnessLevel':
        setCurrentStep('goals');
        break;
      case 'goals':
        setCurrentStep('sport');
        break;
    }
  };

  const handleSubmitForm = async () => {
    setIsLoading(true);
    try {
      const values = form.getValues();
      const result = await generateWorkoutRoutine({...values, language: locale});
      localStorage.setItem('workoutRoutine', JSON.stringify(result));
      localStorage.setItem('onboardingComplete', 'true');

      toast({ title: t('onboarding.success.title'), description: t('onboarding.success.description') });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSportSelect = (sportName: string) => {
    form.setValue('sport', sportName, { shouldValidate: true });
    setShowOtherSportInput(false);
  }

  const handleOtherSportClick = () => {
    form.setValue('sport', '', { shouldValidate: true });
    setShowOtherSportInput(true);
  }
  
  const steps: {id: StepId, isCompleted: boolean}[] = [
      { id: 'sport', isCompleted: form.formState.dirtyFields.sport || false },
      { id: 'goals', isCompleted: form.formState.dirtyFields.goals || false },
      { id: 'fitnessLevel', isCompleted: form.formState.dirtyFields.fitnessLevel || false },
      { id: 'details', isCompleted: (form.formState.dirtyFields.trainingDays && form.formState.dirtyFields.trainingDuration) || false },
      { id: 'assessment', isCompleted: form.formState.dirtyFields.fitnessAssessment || false },
  ];
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: '0%', opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('onboarding.description')}
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
             {steps.map((step, index) => (
                <div key={step.id} className={`h-2 rounded-full transition-all duration-300 ${index < currentStepIndex ? 'bg-primary w-6' : index === currentStepIndex ? 'bg-primary/50 w-6' : 'bg-muted w-2' }`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden relative h-96">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute w-full px-6"
            >
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                  {currentStep === 'sport' && (
                    <FormField
                      control={form.control}
                      name="sport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">{t('onboarding.questions.sport.label')}</FormLabel>
                            <div className="space-y-2">
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
                                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} transition={{duration: 0.3}}>
                                      <Input type="text" placeholder={t('onboarding.questions.sport.placeholder')} {...field} value={field.value ?? ''} />
                                    </motion.div>
                                )}
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {currentStep === 'goals' && (
                     <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">{t('onboarding.questions.goals.label')}</FormLabel>
                          <FormControl><Input placeholder={t('onboarding.questions.goals.placeholder')} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {currentStep === 'fitnessLevel' && (
                    <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg">{t('onboarding.questions.fitnessLevel.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                  )}
                  
                  {currentStep === 'assessment' && (
                      <div>
                        <div className="mb-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start">
                          <Bot className="text-primary size-8 shrink-0 mt-1" />
                          <p className="text-secondary-foreground">{t('onboarding.questions.clarification.generic')}</p>
                        </div>
                        <FormField
                          control={form.control}
                          name="fitnessAssessment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg">{t('onboarding.questions.clarification.label')}</FormLabel>
                              <FormControl><Input placeholder={t('onboarding.questions.clarification.placeholder')} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                  )}

                  {currentStep === 'details' && (
                    <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="trainingDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.questions.trainingDays.label')}</FormLabel>
                              <FormControl><Input type="number" placeholder="3" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value ?? ''} /></FormControl>
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
                              <FormControl><Input type="number" placeholder="60" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <p className="text-xs text-muted-foreground pt-2">{t('onboarding.questions.optionalDetails')}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.questions.age.label')}</FormLabel>
                                <FormControl><Input type="number" placeholder="25" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0)} value={field.value ?? ''} /></FormControl>
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
                                <FormControl><Input type="number" placeholder="70" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0)} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="ghost" onClick={handleBack} disabled={currentStep === 'sport' || isLoading}>
                      <ChevronLeft /> {t('onboarding.buttons.back')}
                    </Button>
                    
                    {currentStep === 'assessment' ? (
                       <Button type="submit" disabled={isLoading}>
                         {isLoading ? <Loader2 className="animate-spin" /> : <> <Sparkles className="mr-2" /> {t('onboarding.buttons.generate')}</>}
                       </Button>
                    ) : (
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : t('onboarding.buttons.next') }
                        <ChevronRight />
                     </Button>
                    )}
                  </div>
                </form>
              </Form>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
