
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  generateWorkoutRoutine,
  type WorkoutRoutineOutput,
} from '@/ai/flows/workout-routine-generator';
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

const onboardingSchema = z.object({
  sport: z.string().min(3, 'Sport must be at least 3 characters.'),
  goals: z.string().min(3, 'Goals must be at least 3 characters.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  age: z.coerce.number().min(10, 'Must be at least 10').max(100, 'Must be 100 or less'),
  weight: z.coerce.number().min(30, 'Must be at least 30kg').max(200, 'Must be 200kg or less'),
  gender: z.enum(['male', 'female', 'other']),
  trainingDays: z.coerce.number().min(1, 'At least 1 day').max(7, 'At most 7 days'),
  trainingDuration: z.coerce.number().min(15, 'At least 15 minutes').max(240, 'At most 240 minutes'),
  clarificationAnswers: z.string().min(1, 'Please answer the question.'),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

const questions = [
  { id: 'sport', label: 'Primary Sport', placeholder: 'e.g., Soccer, Weightlifting', type: 'text' },
  { id: 'goals', label: 'Your Goals', placeholder: 'e.g., Increase vertical jump, run a 5k', type: 'text' },
  { id: 'fitnessLevel', label: 'Fitness Level', options: ['beginner', 'intermediate', 'advanced'], type: 'select' },
  { id: 'age', label: 'Age', placeholder: '25', type: 'number' },
  { id: 'weight', label: 'Weight (kg)', placeholder: '70', type: 'number' },
  { id: 'gender', label: 'Gender', options: ['male', 'female', 'other'], type: 'select' },
  { id: 'trainingDays', label: 'Days per week to train', placeholder: '4', type: 'number' },
  { id: 'trainingDuration', label: 'Time per session (minutes)', placeholder: '60', type: 'number' },
  { id: 'clarificationAnswers', label: '', placeholder: 'e.g., I can do 10 push-ups...', type: 'text' },
] as const;


export default function OnboardingPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
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

    // After fitnessLevel, call API to get clarification question
    if (currentQuestionId === 'fitnessLevel') {
      setIsLoading(true);
      try {
        const result = await generateWorkoutRoutine(form.getValues());
        if (result.clarificationQuestion) {
          setClarificationQuestion(result.clarificationQuestion);
           // The API call is done, now we can move on.
           if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
        } else {
          toast({ variant: 'destructive', title: 'Something went wrong' });
        }
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not get clarification question.' });
      } finally {
        setIsLoading(false);
      }
      return; // Stop here and wait for API call to finish before proceeding
    }

    if (currentQuestionId === 'clarificationAnswers') {
      handleSubmitForm();
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitForm = async () => {
    setIsLoading(true);
    try {
      const result = await generateWorkoutRoutine(form.getValues());
      console.log('Generated Routine:', result.structuredRoutine || result.routine);
      toast({ title: 'Workout Routine Generated!', description: "We're redirecting you to the dashboard." });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate workout routine.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (field: any) => {
    const question = questions[currentQuestionIndex];
    if (question.type === 'select') {
      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger><SelectValue /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {question.options?.map(option => (
              <SelectItem key={option} value={option} className="capitalize">{option}</SelectItem>
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

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Welcome to TrainSmart AI</CardTitle>
          <CardDescription className="text-center">
            Let&apos;s personalize your fitness journey.
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
            {questions.map((q, index) => (
                <div key={q.id} className={`h-2 rounded-full transition-all duration-300 ${index < currentQuestionIndex ? 'bg-primary w-6' : index === currentQuestionIndex ? 'bg-primary/50 w-6' : 'bg-muted w-2' }`} />
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
                      {currentQuestionId === 'clarificationAnswers' ? (
                         <div>
                           <div className="mt-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start">
                              <Bot className="text-primary size-8 shrink-0 mt-1" />
                              <p className="text-secondary-foreground">{clarificationQuestion || 'AI is thinking...'}</p>
                           </div>
                           <FormField
                              control={form.control}
                              name="clarificationAnswers"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Your Answer</FormLabel>
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
                          <Button type="button" variant="ghost" onClick={handleBack} disabled={currentQuestionIndex === 0}>
                            <ChevronLeft /> Back
                          </Button>
                          
                          {currentQuestionId === 'clarificationAnswers' ? (
                             <Button type="submit" disabled={isLoading}>
                               {isLoading ? <Loader2 className="animate-spin" /> : <> <Sparkles className="mr-2" /> Generate My Plan</>}
                             </Button>
                          ) : (
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? <Loader2 className="animate-spin" /> : 'Next'} <ChevronRight />
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
