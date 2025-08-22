
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
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
import { Loader2, Sparkles, Bot, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';

const emptyStringToUndefined = z.literal('').transform(() => undefined);

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
  gender: z.enum(['male', 'female', 'other']),
  trainingDays: z.coerce.number().min(1, t('onboarding.validation.trainingDays.min')).max(7, t('onboarding.validation.trainingDays.max')),
  trainingDuration: z.coerce.number().min(15, t('onboarding.validation.trainingDuration.min')).max(240, t('onboarding.validation.trainingDuration.max')),
  clarificationAnswers: z.string().optional(),
});

type OnboardingData = z.infer<ReturnType<typeof createOnboardingSchema>>;

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // This effect runs on the client after hydration
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const questions = [
    { id: 'sport', label: t('onboarding.questions.sport.label'), placeholder: t('onboarding.questions.sport.placeholder'), type: 'text' },
    { id: 'goals', label: t('onboarding.questions.goals.label'), placeholder: t('onboarding.questions.goals.placeholder'), type: 'text' },
    { id: 'fitnessLevel', label: t('onboarding.questions.fitnessLevel.label'), options: { beginner: t('onboarding.questions.fitnessLevel.options.beginner'), intermediate: t('onboarding.questions.fitnessLevel.options.intermediate'), advanced: t('onboarding.questions.fitnessLevel.options.advanced') }, type: 'select' },
    { id: 'age', label: t('onboarding.questions.age.label'), placeholder: '25', type: 'number' },
    { id: 'weight', label: t('onboarding.questions.weight.label'), placeholder: '70', type: 'number' },
    { id: 'gender', label: t('onboarding.questions.gender.label'), options: { male: t('onboarding.questions.gender.options.male'), female: t('onboarding.questions.gender.options.female'), other: t('onboarding.questions.gender.options.other') }, type: 'select' },
    { id: 'trainingDays', label: t('onboarding.questions.trainingDays.label'), placeholder: '4', type: 'number' },
    { id: 'trainingDuration', label: t('onboarding.questions.trainingDuration.label'), placeholder: '60', type: 'number' },
    { id: 'clarificationAnswers', label: '', placeholder: t('onboarding.questions.clarification.placeholder'), type: 'text' },
  ] as const;

  const form = useForm<OnboardingData>({
    resolver: zodResolver(createOnboardingSchema(t)),
    defaultValues: {
      sport: '',
      goals: '',
      fitnessLevel: 'intermediate',
      age: undefined,
      weight: undefined,
      gender: 'male',
      trainingDays: 3,
      trainingDuration: 60,
      clarificationAnswers: '',
    },
    mode: 'onChange'
  });

  const currentQuestionId = questions[currentQuestionIndex].id;

  const handleNext = async () => {
    const isValid = await form.trigger(currentQuestionId as keyof OnboardingData);
    if (!isValid) return;

    setDirection(1);
    
    const apiValues = { ...form.getValues(), language: locale };

    // After fitnessLevel, call API to get clarification question
    if (currentQuestionId === 'fitnessLevel') {
      setIsLoading(true);
      try {
        const { sport, goals, fitnessLevel } = apiValues;
        const result = await generateWorkoutRoutine({ sport, goals, fitnessLevel, language: locale });
        if (result.clarificationQuestion) {
          setClarificationQuestion(result.clarificationQuestion);
           setCurrentQuestionIndex(questions.findIndex(q => q.id === 'clarificationAnswers'));
        } else {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: t('onboarding.errors.clarification.title'), description: t('onboarding.errors.clarification.description') });
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } finally {
        setIsLoading(false);
      }
      return; 
    }
    
    if (currentQuestionId === 'trainingDuration') {
       if (clarificationQuestion) {
         setCurrentQuestionIndex(questions.findIndex(q => q.id === 'clarificationAnswers'));
       } else {
         handleSubmitForm(apiValues);
       }
       return;
    }


    if (currentQuestionId === 'clarificationAnswers') {
      handleSubmitForm(apiValues);
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
       if (questions[currentQuestionIndex + 1].id === 'clarificationAnswers' && !clarificationQuestion) {
         handleSubmitForm(apiValues);
       } else {
         setCurrentQuestionIndex(currentQuestionIndex + 1);
       }
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentQuestionIndex > 0) {
      if (currentQuestionId === 'clarificationAnswers') {
        setCurrentQuestionIndex(questions.findIndex(q => q.id === 'trainingDuration'))
      } else if (currentQuestionId === 'age' && clarificationQuestion) {
        setCurrentQuestionIndex(questions.findIndex(q => q.id === 'fitnessLevel'))
      }
      else {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    }
  };

  const handleSubmitForm = async (values: OnboardingData) => {
    setIsLoading(true);
    try {
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

  const renderInput = (field: any) => {
    const question = questions[currentQuestionIndex];
    if (question.type === 'select') {
      const options = question.options;

      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger><SelectValue /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {Object.entries(options).map(([value, label]) => (
              <SelectItem key={value} value={value} className="capitalize">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return <Input type={question.type} placeholder={question.placeholder} {...field} value={field.value ?? ''} />;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 30 : -30,
      opacity: 0,
    }),
  };
  
  const isClarificationStep = currentQuestionId === 'clarificationAnswers';

  const finalSteps = ['age', 'weight', 'gender', 'trainingDays', 'trainingDuration'];
  const totalSteps = 3 + (clarificationQuestion ? 1 : 0) + finalSteps.length;
  let completedSteps = 0;
  if(isClarificationStep) {
    completedSteps = 3;
  } else if (currentQuestionIndex > 2) {
    completedSteps = 3 + (clarificationQuestion ? 1 : 0) + (questions.findIndex(q => q.id === currentQuestionId) - questions.findIndex(q => q.id === 'age') +1)
  } else {
    completedSteps = currentQuestionIndex;
  }


  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('onboarding.description')}
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
             {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className={`h-2 rounded-full transition-all duration-300 ${index < completedSteps ? 'bg-primary w-6' : index === completedSteps ? 'bg-primary/50 w-6' : 'bg-muted w-2' }`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden relative h-64">
           <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentQuestionIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute w-full px-6"
              >
                  <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                      {isClarificationStep ? (
                         <div>
                           <div className="mt-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start">
                              <Bot className="text-primary size-8 shrink-0 mt-1" />
                              <p className="text-secondary-foreground">{clarificationQuestion || t('onboarding.aiThinking')}</p>
                           </div>
                           <FormField
                              control={form.control}
                              name="clarificationAnswers"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>{t('onboarding.questions.clarification.label')}</FormLabel>
                                  <FormControl>{renderInput(field)}</FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name={currentQuestionId as keyof OnboardingData}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg">{questions[currentQuestionIndex].label}</FormLabel>
                              <FormControl>{renderInput(field)}</FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <div className="flex justify-between items-center pt-4">
                          <Button type="button" variant="ghost" onClick={handleBack} disabled={currentQuestionIndex === 0 || isLoading}>
                            <ChevronLeft /> {t('onboarding.buttons.back')}
                          </Button>
                          
                          {(isClarificationStep || (currentQuestionId === 'trainingDuration' && !clarificationQuestion)) ? (
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
