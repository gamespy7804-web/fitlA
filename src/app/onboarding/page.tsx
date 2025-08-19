'use client';

import { useState } from 'react';
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

const emptyStringToUndefined = z.literal('').transform(() => undefined);

const onboardingSchema = z.object({
  sport: z.string().min(3, 'El deporte debe tener al menos 3 caracteres.'),
  goals: z.string().min(3, 'Los objetivos deben tener al menos 3 caracteres.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  age: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(10, 'Debes tener al menos 10 años').max(100, 'Debes tener 100 años o menos').optional()
  ),
  weight: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(30, 'Debe ser al menos 30kg').max(200, 'Debe ser 200kg o menos').optional()
  ),
  gender: z.enum(['male', 'female', 'other']),
  trainingDays: z.coerce.number().min(1, 'Al menos 1 día').max(7, 'Máximo 7 días'),
  trainingDuration: z.coerce.number().min(15, 'Al menos 15 minutos').max(240, 'Máximo 240 minutos'),
  clarificationAnswers: z.string().optional(),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

const questions = [
  { id: 'sport', label: 'Deporte Principal', placeholder: 'ej., Fútbol, Halterofilia', type: 'text' },
  { id: 'goals', label: 'Tus Metas', placeholder: 'ej., Aumentar salto vertical, correr 5k', type: 'text' },
  { id: 'fitnessLevel', label: 'Nivel de Condición Física', options: ['principiante', 'intermedio', 'avanzado'], type: 'select' },
  { id: 'age', label: 'Edad', placeholder: '25', type: 'number' },
  { id: 'weight', label: 'Peso (kg)', placeholder: '70', type: 'number' },
  { id: 'gender', label: 'Género', options: ['masculino', 'femenino', 'otro'], type: 'select' },
  { id: 'trainingDays', label: 'Días de entrenamiento por semana', placeholder: '4', type: 'number' },
  { id: 'trainingDuration', label: 'Tiempo por sesión (minutos)', placeholder: '60', type: 'number' },
  { id: 'clarificationAnswers', label: '', placeholder: 'ej., Puedo hacer 10 flexiones...', type: 'text' },
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
        const { sport, goals, fitnessLevel } = form.getValues();
        const result = await generateWorkoutRoutine({ sport, goals, fitnessLevel });
        if (result.clarificationQuestion) {
          setClarificationQuestion(result.clarificationQuestion);
           // The API call is done, now we can move on to the clarification step
           setCurrentQuestionIndex(questions.findIndex(q => q.id === 'clarificationAnswers'));
        } else {
          // No clarification question needed, so move to age
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener la pregunta de clarificación.' });
        // if AI fails, still go to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } finally {
        setIsLoading(false);
      }
      return; 
    }
    
    if (currentQuestionId === 'trainingDuration') {
       // if we have a clarification question, go to it, otherwise submit
       if (clarificationQuestion) {
         setCurrentQuestionIndex(questions.findIndex(q => q.id === 'clarificationAnswers'));
       } else {
         handleSubmitForm(form.getValues());
       }
       return;
    }


    if (currentQuestionId === 'clarificationAnswers') {
      handleSubmitForm(form.getValues());
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
       if (questions[currentQuestionIndex + 1].id === 'clarificationAnswers' && !clarificationQuestion) {
         // This case might not be hit anymore, but as a safeguard
         handleSubmitForm(form.getValues());
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
        // If we came from clarification question, go back to fitness level
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
      const result = await generateWorkoutRoutine(values);
      console.log('Generated Routine:', result.structuredRoutine || result.routine);
      // In a real app, you would save the routine to the user's state/DB
      // For this demo, we'll store it in localStorage
      localStorage.setItem('workoutRoutine', JSON.stringify(result));
      localStorage.setItem('onboardingComplete', 'true');

      toast({ title: '¡Rutina de Entrenamiento Generada!', description: "Te estamos redirigiendo al panel de control." });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar la rutina de entrenamiento.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (field: any) => {
    const question = questions[currentQuestionIndex];
    if (question.type === 'select') {
      let options: Record<string,string> = {};
      if (question.id === 'fitnessLevel') {
        options = { Principiante: 'beginner', Intermedio: 'intermediate', Avanzado: 'advanced' };
      } else if (question.id === 'gender') {
        options = { Masculino: 'male', Femenino: 'female', Otro: 'other' };
      }

      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger><SelectValue /></SelectTrigger>
          </FormControl>
          <SelectContent>
            {Object.entries(options).map(([label, value]) => (
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
  // Calculate total steps: 3 initial questions + optional clarification question + final steps.
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
          <CardTitle className="font-headline text-2xl text-center">Bienvenido a TrainSmart AI</CardTitle>
          <CardDescription className="text-center">
            Vamos a personalizar tu viaje de fitness.
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
                              <p className="text-secondary-foreground">{clarificationQuestion || 'La IA está pensando...'}</p>
                           </div>
                           <FormField
                              control={form.control}
                              name="clarificationAnswers"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Tu Respuesta</FormLabel>
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
                            <ChevronLeft /> Atrás
                          </Button>
                          
                          {(isClarificationStep || (currentQuestionId === 'trainingDuration' && !clarificationQuestion)) ? (
                             <Button type="submit" disabled={isLoading}>
                               {isLoading ? <Loader2 className="animate-spin" /> : <> <Sparkles className="mr-2" /> Generar Mi Plan</>}
                             </Button>
                          ) : (
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? <Loader2 className="animate-spin" /> : 'Siguiente' }
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
