
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import { analyzePhysique, type PhysiqueAnalysisOutput } from '@/ai/flows/physique-analyst-generator';
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
  FormDescription,
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
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Puzzle, Upload, CheckCircle, Star } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

// Zod schema creator function to allow for dynamic error messages from i18n
const createFormSchema = (t: (key: string) => string) => z.object({
    sport: z.string().min(1, t('onboarding.validation.sport.min')),
    skills: z.array(z.string()).optional(),
    otherSkills: z.string().optional(),
    goals: z.string().min(3, t('onboarding.validation.goals.min')),
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: t('workoutGenerator.form.validations.fitnessLevel.required')}),
    equipment: z.array(z.string()).min(1, t('onboarding.validation.equipment.required')),
    trainingDays: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDays.required')}).int().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
    trainingDuration: z.coerce.number({invalid_type_error: t('onboarding.validation.trainingDuration.required')}).int().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
    age: z.coerce.number({invalid_type_error: t('onboarding.validation.age.required')}).int().min(10, t('onboarding.validation.age.min')).max(100, t('onboarding.validation.age.max')),
    weight: z.coerce.number({invalid_type_error: t('onboarding.validation.weight.required')}).int().min(30, t('onboarding.validation.weight.min')).max(200, t('onboarding.validation.weight.max')),
    gender: z.enum(['male', 'female'], {required_error: t('onboarding.validation.gender.required')})
});

const steps = [
  { id: 'sport', fields: ['sport'], autoNext: true },
  { id: 'skills', fields: ['skills', 'otherSkills'] },
  { id: 'goals', fields: ['goals'] },
  { id: 'fitnessLevel', fields: ['fitnessLevel'], autoNext: true },
  { id: 'equipment', fields: ['equipment'] },
  { id: 'details', fields: ['age', 'weight', 'gender'] },
  { id: 'availability', fields: ['trainingDays', 'trainingDuration'] },
  { id: 'physique', fields: [] },
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

  // Physique analysis state
  const physiqueFileInputRef = useRef<HTMLInputElement>(null);
  const [physiquePhoto, setPhysiquePhoto] = useState<string | null>(null);
  const [physiquePhotoUrl, setPhysiquePhotoUrl] = useState<string | null>(null);
  const [physiqueAnalysis, setPhysiqueAnalysis] = useState<PhysiqueAnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formSchema = createFormSchema((key: string) => t(key as any));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sport: '',
      skills: [],
      otherSkills: '',
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

  const sportValue = form.watch('sport');
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);
  
  const sportHasSkills = (sport: string) => {
    const lowerCaseSport = sport.toLowerCase();
    const sportsWithSkills = ['calistenia', 'calisthenics', 'gimnasio', 'gym', 'running'];
    return sportsWithSkills.some(s => lowerCaseSport.includes(s));
  }

  const filteredSteps = steps.filter(step => {
    if (step.id === 'skills') {
      const sportKey = t(`onboarding.questions.sport.options.homeWorkout`);
      return sportValue && sportValue.toLowerCase() !== sportKey.toLowerCase() && sportHasSkills(sportValue);
    }
    return true;
  });

  const nextStep = async () => {
    const currentStepInfo = filteredSteps[currentStep];
    const fieldsToValidate = currentStepInfo.fields;
    
    if (currentStepInfo.id === 'physique') {
        if (currentStep < filteredSteps.length) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
        return;
    }

    if (currentStepInfo.id === 'sport' && selectedSport === 'other') {
      const sportValue = form.getValues('sport');
      if (!sportValue || sportValue.trim().length < 3) {
        form.setError('sport', { type: 'manual', message: t('onboarding.validation.sport.min') });
        return;
      }
    }
    
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < filteredSteps.length - 1) {
        setDirection(1);
        setCurrentStep(prev => prev + 1);
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
        setDirection(-1);
        setCurrentStep(prev => prev - 1);
    }
  }

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const combinedSkills = [...(values.skills || [])];
      if (values.otherSkills) {
        combinedSkills.push(values.otherSkills);
      }

      const routine = await generateWorkoutRoutine({ 
        ...values, 
        skills: combinedSkills,
        language: locale,
        physiqueAnalysis: physiqueAnalysis ?? undefined,
      });

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

  const handlePhysiqueFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: t('feedbackTool.physiqueAnalysis.upload.invalidFileType') });
        return;
    }
    if (physiquePhotoUrl) {
      URL.revokeObjectURL(physiquePhotoUrl);
    }
    const newUrl = URL.createObjectURL(file);
    setPhysiquePhotoUrl(newUrl);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
          setPhysiquePhoto(dataUri);
          setIsAnalyzing(true);
          try {
            const result = await analyzePhysique({ photoDataUri: dataUri, language: locale });
            setPhysiqueAnalysis(result);
          } catch(err) {
             toast({ variant: 'destructive', title: t('feedbackTool.physiqueAnalysis.errors.title') });
             setPhysiquePhoto(null);
             setPhysiquePhotoUrl(null);
          } finally {
            setIsAnalyzing(false);
          }
      }
    };
    reader.readAsDataURL(file);
  };
  
  if (authLoading || !user) {
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

 const skillOptionsBySport: Record<string, { id: string; label: string }[]> = {
    calistenia: [
        { id: 'muscleUp', label: 'Muscle Up'},
        { id: 'frontLever', label: 'Front Lever'},
        { id: 'planche', label: 'Planche'},
        { id: 'handstand', label: 'Handstand'},
        { id: 'humanFlag', label: 'Human Flag'},
        { id: 'vSit', label: 'V-Sit'}
    ],
    calisthenics: [
        { id: 'muscleUp', label: 'Muscle Up'},
        { id: 'frontLever', label: 'Front Lever'},
        { id: 'planche', label: 'Planche'},
        { id: 'handstand', label: 'Handstand'},
        { id: 'humanFlag', label: 'Human Flag'},
        { id: 'vSit', label: 'V-Sit'}
    ],
    gimnasio: [
        { id: 'bench100kg', label: 'Press de Banca con 100kg'},
        { id: 'squat140kg', label: 'Sentadilla con 140kg'},
        { id: 'deadlift180kg', label: 'Peso Muerto con 180kg'},
        { id: 'overhead50kg', label: 'Press Militar con 50kg'},
    ],
    gym: [
        { id: 'bench100kg', label: 'Bench Press 100kg'},
        { id: 'squat140kg', label: 'Squat 140kg'},
        { id: 'deadlift180kg', label: 'Deadlift 180kg'},
        { id: 'overhead50kg', label: 'Overhead Press 50kg'},
    ],
    running: [
        { id: 'run5k', label: 'Correr 5km sin parar'},
        { id: 'run10k', label: 'Correr 10km'},
        { id: 'sub25min5k', label: 'Correr 5km en menos de 25min'},
        { id: 'runHalfMarathon', label: 'Correr una media maratón'},
    ]
 };

  const getSkillOptionsForSport = (sport: string) => {
    if (!sport) return [];
    const lowerCaseSport = sport.toLowerCase();
    for (const key in skillOptionsBySport) {
        if (lowerCaseSport.includes(key)) {
            return skillOptionsBySport[key];
        }
    }
    return [];
  };

  const currentSkillOptions = getSkillOptionsForSport(sportValue);

  const equipmentCategories = {
    'basics': { icon: Dumbbell, items: ['dumbbells', 'resistanceBands', 'yogaMat', 'pullUpBar'] },
    'gym': { icon: Dumbbell, items: ['benchPress', 'squatRack', 'cableMachine', 'legPress'] },
    'cardio': { icon: HeartPulse, items: ['treadmill', 'stationaryBike', 'elliptical', 'rowingMachine'] },
    'accessories': { icon: Puzzle, items: ['kettlebell', 'foamRoller'] },
  };

  const handleEquipmentButtonClick = (item: string) => {
    const currentValues = form.getValues('equipment') || [];
    
    if (item === 'none') {
      form.setValue('equipment', ['none'], { shouldValidate: true });
      return;
    }
    
    if (item === 'gym') {
      form.setValue('equipment', ['gym'], { shouldValidate: true });
      return;
    }

    const withoutSpecialOptions = currentValues.filter(v => v !== 'none' && v !== 'gym');
    const newValue = withoutSpecialOptions.includes(item)
      ? withoutSpecialOptions.filter(value => value !== item)
      : [...withoutSpecialOptions, item];
      
    form.setValue('equipment', newValue.length > 0 ? newValue : [], { shouldValidate: true });
  };

  const currentStepInfo = filteredSteps[currentStep];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center">{t('onboarding.description')}</CardDescription>
          <Progress value={((currentStep + 1) / (filteredSteps.length + 1)) * 100} className="mt-4" />
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
                  {/* Render steps only if currentStepInfo is defined */}
                  {currentStepInfo && (
                    <>
                      {/* Step 1: Sport */}
                      {currentStepInfo.id === 'sport' && (
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
                      {/* Step 2: Skills (Conditional) */}
                      {currentStepInfo.id === 'skills' && (
                        <div className="space-y-4">
                            <FormLabel className="text-lg text-center block">{t('onboarding.questions.skills.label')}</FormLabel>
                            <FormDescription className='text-center -mt-4'>{t('onboarding.questions.skills.description')}</FormDescription>
                            
                            {currentSkillOptions.length > 0 ? (
                                <FormField
                                  control={form.control}
                                  name="skills"
                                  render={() => (
                                    <FormItem>
                                      <div className="grid grid-cols-2 gap-3 pt-2">
                                        {currentSkillOptions.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="skills"
                                                render={({ field }) => (
                                                    <FormItem
                                                        key={item.id}
                                                        className="flex flex-row items-center space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                        <Button
                                                            type="button"
                                                            variant={field.value?.includes(item.label) ? 'default' : 'outline'}
                                                            className='w-full h-auto py-4'
                                                            onClick={() => {
                                                                const currentSkills = field.value || [];
                                                                const newSkills = currentSkills.includes(item.label)
                                                                    ? currentSkills.filter(value => value !== item.label)
                                                                    : [...currentSkills, item.label];
                                                                field.onChange(newSkills);
                                                            }}
                                                            >
                                                            {item.label}
                                                        </Button>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            ) : (
                                <FormField
                                  control={form.control}
                                  name="otherSkills"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm text-muted-foreground">{t('onboarding.questions.skills.otherLabel')}</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder={t('onboarding.questions.skills.otherPlaceholder')} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            )}
                        </div>
                      )}
                      {/* Step 3: Goals */}
                      {currentStepInfo.id === 'goals' && (
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
                      {/* Step 4: Fitness Level */}
                      {currentStepInfo.id === 'fitnessLevel' && (
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
                      {/* Step 5: Equipment */}
                      {currentStepInfo.id === 'equipment' && (
                        <FormField
                          control={form.control}
                          name="equipment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg text-center block">{t('onboarding.questions.equipment.label')}</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      type="button"
                                      variant={(field.value || []).includes('gym') ? 'default' : 'outline'}
                                      onClick={() => handleEquipmentButtonClick('gym')}
                                    >
                                      {t('onboarding.questions.equipment.options.gymAccess')}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={(field.value || []).includes('none') ? 'destructive' : 'outline'}
                                      onClick={() => handleEquipmentButtonClick('none')}
                                    >
                                      {t('onboarding.questions.equipment.options.none')}
                                    </Button>
                                  </div>
                                  <ScrollArea className="h-56 pr-3">
                                      <div className="space-y-4">
                                        {Object.entries(equipmentCategories).map(([category, value]) => {
                                            const CategoryIcon = value.icon;
                                            return (
                                                <div key={category} className="space-y-2">
                                                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><CategoryIcon className="h-4 w-4"/> {t(`onboarding.questions.equipment.categories.${category}`)}</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {value.items.map((item) => (
                                                            <Button
                                                                key={item}
                                                                type="button"
                                                                variant={field.value?.includes(item) ? 'default' : 'outline'}
                                                                className="h-auto py-3 justify-start text-left"
                                                                onClick={() => handleEquipmentButtonClick(item)}
                                                            >
                                                                {t(`onboarding.questions.equipment.items.${item}`)}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                      </div>
                                  </ScrollArea>
                                </div>
                              </FormControl>
                              <FormMessage className="text-center"/>
                            </FormItem>
                          )}
                        />
                      )}
                      {/* Step 6: Details */}
                      {currentStepInfo.id === 'details' && (
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
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                      )}
                      {/* Step 7: Availability */}
                      {currentStepInfo.id === 'availability' && (
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
                      {/* Step 8: Physique Analysis */}
                      {currentStepInfo.id === 'physique' && (
                        <div className="space-y-4">
                            <FormLabel className="text-lg text-center block">{t('onboarding.questions.physique.label')}</FormLabel>
                            <p className="text-sm text-center text-muted-foreground -mt-4">{t('onboarding.questions.physique.description')}</p>
                            
                            <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative p-1 text-center border-2 border-dashed">
                              {isAnalyzing ? (
                                    <>
                                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                        <p className="mt-2 text-sm text-muted-foreground px-4">{t('onboarding.questions.physique.analyzing')}</p>
                                    </>
                              ) : physiqueAnalysis ? (
                                    <>
                                        <CheckCircle className="h-16 w-16 text-green-500" />
                                        <p className="mt-2 text-sm font-semibold text-muted-foreground px-4">{t('onboarding.questions.physique.complete')}</p>
                                        <p className="text-xs text-muted-foreground">({t('onboarding.questions.physique.score')}: {physiqueAnalysis.averageScore})</p>
                                    </>
                              ) : (
                                <>
                                    <Upload className="h-12 w-12 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground px-4">{t('onboarding.questions.physique.prompt')}</p>
                                    <Button variant="link" size="sm" className="mt-1" onClick={() => physiqueFileInputRef.current?.click()}>
                                        {t('feedbackTool.physiqueAnalysis.upload.selectFile')}
                                    </Button>
                                </>
                              )}
                              <Input ref={physiqueFileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhysiqueFileChange} disabled={isAnalyzing || !!physiqueAnalysis} />
                            </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                    <ChevronLeft className="mr-2"/>
                    {t('onboarding.buttons.back')}
                </Button>
                {currentStep < filteredSteps.length - 1 ? (
                   ( (selectedSport === 'other' && currentStepInfo?.id === 'sport') || !currentStepInfo?.autoNext) ? (
                    <Button type="button" onClick={nextStep}>
                        {t('onboarding.buttons.next')}
                        <ChevronRight className="ml-2"/>
                    </Button>
                   ) : <div />
                ) : (
                    <Button type="submit" disabled={isLoading || isAnalyzing}>
                    {(isLoading || isAnalyzing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
