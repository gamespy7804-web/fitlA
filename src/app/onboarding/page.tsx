
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Dumbbell, Weight, HeartPulse, Puzzle, Plane, Barbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/hooks/use-user-data';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// Zod schema creator function to allow for dynamic error messages from i18n
const createFormSchema = (t: (key: string) => string) => z.object({
    sport: z.string().min(1, t('onboarding.validation.sport.min')),
    goals: z.string().min(3, t('onboarding.validation.goals.min')),
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required')}),
    equipment: z.array(z.string()).min(1, t('onboarding.validation.equipment.required')),
    trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
    trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
    age: z.coerce.number({invalid_type_error: t('onboarding.validation.age.required')}).int().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max')),
    weight: z.coerce.number({invalid_type_error: t('onboarding.validation.weight.required')}).int().min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max')),
    gender: z.enum(['male', 'female', 'other'], {required_error: t('onboarding.validation.gender.required')})
});

const steps = [
  { id: 'sport', fields: ['sport'], autoNext: true },
  { id: 'goals', fields: ['goals'] },
  { id: 'fitnessLevel', fields: ['fitnessLevel'], autoNext: true },
  { id: 'equipment', fields: ['equipment'] },
  { id: 'details', fields: ['age', 'weight', 'gender'] },
  { id: 'availability', fields: ['trainingDays', 'trainingDuration'] },
] as const;


export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { setOnboardingComplete, saveWorkoutRoutine, setInitialDiamonds } = useUserData();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [selectedSport, setSelectedSport] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const formSchema = createFormSchema((key: string) => t(key as any));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: '',
      goals: '',
      trainingDays: undefined,
      trainingDuration: undefined,
      fitnessLevel: undefined,
      equipment: [],
      age: undefined,
      weight: undefined,
      gender: undefined,
    },
  });

  const nextStep = async () => {
    const currentStepInfo = steps[currentStep];
    const fieldsToValidate = currentStepInfo.fields;

    // Special handling for 'other' sport
    if (currentStepInfo.id === 'sport' && selectedSport === 'other') {
      const sportValue = form.getValues('sport');
      if (!sportValue || sportValue.trim().length < 3) {
        form.setError('sport', { type: 'manual', message: t('onboarding.validation.sport.min') });
        return;
      }
    }
    
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setDirection(1);
        setCurrentStep(prev => prev + 1);
      }
    }
  }

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
  }

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const routine = await generateWorkoutRoutine({ ...values, language: locale });
      if (routine.structuredRoutine && routine.structuredRoutine.length > 0) {
        
        saveWorkoutRoutine({...routine, sport: values.sport });
        setOnboardingComplete(true);
        setInitialDiamonds(20);

        toast({
          title: t('onboarding.success.title'),
          description: t('onboarding.success.description'),
        });
        router.push('/dashboard');
      } else {
        toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('onboarding.errors.generation.title'), description: t('onboarding.errors.generation.description') });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAutoNext = (isAuto: boolean) => {
    if (isAuto) {
      setTimeout(() => {
          nextStep();
      }, 300);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const sportOptions = ['homeWorkout', 'gym', 'calisthenics', 'running', 'boxing', 'soccer', 'volleyball', 'other'] as const;

  const equipmentCategories = {
    'basics': { icon: Dumbbell, items: ['dumbbells', 'resistanceBands', 'yogaMat', 'pullUpBar'] },
    'gym': { icon: Barbell, items: ['benchPress', 'squatRack', 'cableMachine', 'legPress'] },
    'cardio': { icon: HeartPulse, items: ['treadmill', 'stationaryBike', 'elliptical', 'rowingMachine'] },
    'accessories': { icon: Puzzle, items: ['kettlebell', 'foamRoller'] },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center">{t('onboarding.description')}</CardDescription>
          <Progress value={((currentStep + 1) / (steps.length + 1)) * 100} className="mt-4" />
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <CardContent className="min-h-[350px]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="space-y-6 flex flex-col"
                >
                  {/* Step 1: Sport */}
                  {currentStep === 0 && (
                     <FormField
                      control={form.control}
                      name="sport"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-lg text-center block">{t('onboarding.questions.sport.label')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                setSelectedSport(value);
                                if (value !== 'other') {
                                  field.onChange(t(`onboarding.questions.sport.options.${value}` as any));
                                  handleAutoNext(true);
                                } else {
                                  field.onChange(''); // Clear value to allow custom input
                                }
                              }}
                              value={selectedSport}
                              className="grid grid-cols-2 md:grid-cols-4 gap-2"
                            >
                              {sportOptions.map(option => (
                                <FormItem key={option} className={cn(option === 'other' && "col-span-full")}>
                                  <FormControl>
                                    <RadioGroupItem value={option} id={option} className="sr-only" />
                                  </FormControl>
                                  <Label 
                                    htmlFor={option} 
                                    className={cn(
                                        "flex h-20 flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center text-sm", 
                                        selectedSport === option && "border-primary",
                                        option === 'other' && "col-span-2 md:col-span-4",
                                        )}>
                                    {t(`onboarding.questions.sport.options.${option}`)}
                                  </Label>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                           <AnimatePresence>
                          {selectedSport === 'other' && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                <FormControl>
                                    <Input 
                                      className="text-center text-lg h-12" 
                                      placeholder={t('onboarding.questions.sport.placeholder')}
                                      onChange={e => field.onChange(e.target.value)}
                                      value={field.value}
                                    />
                                </FormControl>
                             </motion.div>
                          )}
                           </AnimatePresence>
                          <FormMessage className="text-center"/>
                        </FormItem>
                      )}
                    />
                  )}
                  {/* Step 2: Goals */}
                  {currentStep === 1 && (
                     <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg text-center block">{t('onboarding.questions.goals.label')}</FormLabel>
                          <FormControl>
                            <Input className="text-center text-lg h-12" placeholder={t('onboarding.questions.goals.placeholder')} {...field} />
                          </FormControl>
                          <FormMessage className="text-center"/>
                        </FormItem>
                      )}
                    />
                  )}
                  {/* Step 3: Fitness Level */}
                  {currentStep === 2 && (
                    <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-lg text-center block">{t('onboarding.questions.fitnessLevel.label')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    handleAutoNext(true);
                                }}
                                value={field.value}
                                className="flex flex-col gap-4 items-center"
                            >
                                {(['beginner', 'intermediate', 'advanced'] as const).map(option => (
                                    <FormItem key={option} className="w-full">
                                      <FormControl>
                                        <RadioGroupItem value={option} id={option} className="sr-only" />
                                      </FormControl>
                                      <Label htmlFor={option} className={cn("flex w-full items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === option && "border-primary")}>
                                        {t(`onboarding.questions.fitnessLevel.options.${option}`)}
                                      </Label>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="text-center"/>
                        </FormItem>
                      )}
                    />
                  )}
                  {/* Step 4: Equipment */}
                  {currentStep === 3 && (
                    <FormField
                      control={form.control}
                      name="equipment"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-lg text-center block">{t('onboarding.questions.equipment.label')}</FormLabel>
                            <FormControl>
                                <div className="space-y-4">
                                     <Button
                                        type="button"
                                        variant={form.getValues('equipment').includes('none') ? 'destructive' : 'outline'}
                                        className="w-full"
                                        onClick={() => {
                                            const hasNone = form.getValues('equipment').includes('none');
                                            if (hasNone) {
                                                form.setValue('equipment', [], { shouldValidate: true });
                                            } else {
                                                form.setValue('equipment', ['none'], { shouldValidate: true });
                                            }
                                        }}
                                    >
                                        {t('onboarding.questions.equipment.options.none')}
                                    </Button>
                                    <ScrollArea className="h-64">
                                        <div className="space-y-4">
                                            {Object.entries(equipmentCategories).map(([category, { icon: Icon, items: equipmentItems }]) => (
                                            <div key={category} className="space-y-2">
                                                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4"/> {t(`onboarding.questions.equipment.categories.${category}`)}</h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                {equipmentItems.map((item) => (
                                                    <FormField
                                                        key={item}
                                                        control={form.control}
                                                        name="equipment"
                                                        render={({ field }) => (
                                                            <Button
                                                                type="button"
                                                                variant={field.value?.includes(item) ? 'default' : 'outline'}
                                                                className="h-auto py-3 justify-start text-left"
                                                                onClick={() => {
                                                                    const currentValues = field.value || [];
                                                                    const withoutNone = currentValues.filter(v => v !== 'none');
                                                                    const newValue = withoutNone.includes(item)
                                                                        ? withoutNone.filter((value) => value !== item)
                                                                        : [...withoutNone, item];
                                                                    field.onChange(newValue);
                                                                }}
                                                            >
                                                                {t(`onboarding.questions.equipment.items.${item}`)}
                                                            </Button>
                                                        )}
                                                    />
                                                ))}
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </FormControl>
                          <FormMessage className="text-center"/>
                        </FormItem>
                      )}
                    />
                  )}
                  {/* Step 5: Details */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                        <FormLabel className="text-lg text-center block">{t('onboarding.questions.details.label')}</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="age"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('onboarding.questions.age.label')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="25" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                                    </FormControl>
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
                                    <FormControl>
                                        <Input type="number" placeholder="70" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                                    </FormControl>
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
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('onboarding.questions.gender.placeholder')} />
                                            </SelectTrigger>
                                            </FormControl>
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
                    </div>
                  )}
                   {/* Step 6: Availability */}
                  {currentStep === 5 && (
                     <div className="space-y-4">
                        <FormLabel className="text-lg text-center block">{t('onboarding.questions.availability.label')}</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="trainingDays"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('onboarding.questions.trainingDays.label')}</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder={t('onboarding.questions.trainingDays.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''} />
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
                                <FormLabel>{t('onboarding.questions.trainingDuration.label')}</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder={t('onboarding.questions.trainingDuration.placeholder')} {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                    <ChevronLeft className="mr-2"/>
                    {t('onboarding.buttons.back')}
                </Button>
                {currentStep < steps.length - 1 ? (
                   ( (selectedSport === 'other' && currentStep === 0) || !steps[currentStep].autoNext) ? (
                    <Button type="button" onClick={nextStep}>
                        {t('onboarding.buttons.next')}
                        <ChevronRight className="ml-2"/>
                    </Button>
                   ) : <div />
                ) : (
                    <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Sparkles className="mr-2" />
                    {t('onboarding.buttons.generate')}
                    </Button>
                )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    