
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, Sparkles, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

const step1Schema = z.object({
  sport: z.string().min(3, 'Sport must be at least 3 characters.'),
  goals: z.string().min(3, 'Goals must be at least 3 characters.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

const step2Schema = z.object({
  age: z.coerce.number().min(10).max(100),
  weight: z.coerce.number().min(30).max(200),
  gender: z.enum(['male', 'female', 'other']),
  trainingDays: z.coerce.number().min(1).max(7),
  trainingDuration: z.coerce.number().min(15).max(240),
});

const step3Schema = z.object({
  clarificationAnswers: z.string().min(1, 'Please answer the question.'),
});

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [formData, setFormData] = useState({});
  const { toast } = useToast();
  const router = useRouter();

  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { sport: '', goals: '', fitnessLevel: 'intermediate' },
  });

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: { gender: 'male' },
  });
  
  const step3Form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: { clarificationAnswers: '' },
  });

  const handleStep1Submit = async (values: z.infer<typeof step1Schema>) => {
    setIsLoading(true);
    setFormData(values);
    try {
      const result = await generateWorkoutRoutine(values);
      if (result.clarificationQuestion) {
        setClarificationQuestion(result.clarificationQuestion);
        setStep(2);
      } else {
        // Should not happen if API is designed correctly
        toast({ variant: 'destructive', title: 'Something went wrong' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not get clarification question.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = (values: z.infer<typeof step2Schema>) => {
    setFormData((prev) => ({ ...prev, ...values }));
    setStep(3);
  };
  
  const handleStep3Submit = async (values: z.infer<typeof step3Schema>) => {
    setIsLoading(true);
    const finalData = { ...formData, ...values };
    try {
      const result = await generateWorkoutRoutine(finalData);
      // Here you would typically save the routine and redirect
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

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Welcome to TrainSmart AI</CardTitle>
          <CardDescription>
            Let&apos;s personalize your fitness journey. Tell us a bit about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                <h3 className="text-xl font-semibold font-headline">Step 1: Your Foundation</h3>
                 <FormField
                    control={step1Form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Sport</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Soccer, Weightlifting" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step1Form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Goals</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Increase vertical jump, run a 5k" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step1Form.control}
                    name="fitnessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fitness Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Next'}
                </Button>
              </form>
            </Form>
          )}

          {step === 2 && (
             <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                 <h3 className="text-xl font-semibold font-headline">Step 2: Your Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={step2Form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={step2Form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="70" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={step2Form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={step2Form.control}
                        name="trainingDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days per week</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="4" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={step2Form.control}
                        name="trainingDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time per session (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="60" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                 <div className="flex justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit">Next</Button>
                 </div>
              </form>
             </Form>
          )}

          {step === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
                <div>
                   <h3 className="text-xl font-semibold font-headline">Step 3: AI Assessment</h3>
                   <div className="mt-4 rounded-md bg-secondary/50 p-4 flex gap-4 items-start">
                      <Bot className="text-primary size-8 shrink-0 mt-1" />
                      <p className="text-secondary-foreground">{clarificationQuestion}</p>
                   </div>
                </div>

                <FormField
                  control={step3Form.control}
                  name="clarificationAnswers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Answer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., I can do 10 push-ups, I can run 1.5km..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <> <Sparkles className="mr-2" /> Generate My Plan</>}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

