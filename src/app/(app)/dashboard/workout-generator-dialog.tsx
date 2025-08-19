'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateWorkoutRoutine } from '@/ai/flows/workout-routine-generator';
import { type WorkoutRoutineOutput } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  goals: z.string().min(3, 'Los objetivos deben tener al menos 3 caracteres.'),
  sport: z.string().min(3, 'El deporte debe tener al menos 3 caracteres.'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDays: z.coerce.number().min(1).max(7),
  trainingDuration: z.coerce.number().min(15).max(240),
  clarificationAnswers: z.string().optional(),
});

export function WorkoutGeneratorDialog({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [result, setResult] = useState<WorkoutRoutineOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: '',
      sport: '',
      fitnessLevel: 'intermediate',
      trainingDays: 3,
      trainingDuration: 60,
      clarificationAnswers: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    // If there's a clarification question, it means this is the second step.
    if (clarificationQuestion) {
      try {
        const routine = await generateWorkoutRoutine(values);
        setResult(routine);
        // In a real app, save this new routine
        localStorage.setItem('workoutRoutine', JSON.stringify(routine));
        setClarificationQuestion(''); // Reset for next time
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error al generar la rutina',
          description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // First step: get clarification question
    try {
      const { sport, goals, fitnessLevel } = values;
      const initialResult = await generateWorkoutRoutine({ sport, goals, fitnessLevel });
      if (initialResult.clarificationQuestion) {
        setClarificationQuestion(initialResult.clarificationQuestion);
      } else {
        // No clarification needed, generate full routine
        const routine = await generateWorkoutRoutine(values);
        setResult(routine);
        localStorage.setItem('workoutRoutine', JSON.stringify(routine));
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al generar la rutina',
        description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setResult(null);
      setClarificationQuestion('');
      setIsLoading(false);
    }
  };
  
  const handleDialogClose = () => {
    setIsOpen(false);
    window.location.reload();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className='w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-muted'>
            <Sparkles />
            <span>Generar Nuevo Entrenamiento</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" /> Generador de Entrenamiento con IA
          </DialogTitle>
          <DialogDescription>
            {clarificationQuestion 
              ? 'Proporciona más detalles para afinar tu rutina.'
              : 'Describe tus metas para obtener una rutina de entrenamiento personalizada.'}
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {clarificationQuestion ? (
                <FormField
                  control={form.control}
                  name="clarificationAnswers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{clarificationQuestion}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tu respuesta..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tus Metas</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ej., Perder peso, ganar músculo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deporte Principal</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., Fútbol, Baloncesto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                      control={form.control}
                      name="fitnessLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel de Condición Física</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu nivel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Principiante</SelectItem>
                              <SelectItem value="intermediate">
                                Intermedio
                              </SelectItem>
                              <SelectItem value="advanced">Avanzado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="trainingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Días/Semana</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                          <FormLabel>Min/Sesión</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {clarificationQuestion ? 'Generar Rutina Final' : 'Siguiente'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold font-headline">
              Tu Nueva Rutina de Entrenamiento
            </h3>
            <ScrollArea className="h-96">
              {result.isWeightTraining === false && result.structuredRoutine ? (
                <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                  {result.structuredRoutine.map((day, index) => (
                    <AccordionItem value={`item-${index}`} key={day.day}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-4">
                          <Badge className="text-lg px-3 py-1">Día {day.day}</Badge>
                          <span className="text-xl font-semibold font-headline">{day.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ejercicio</TableHead>
                              <TableHead>Series</TableHead>
                              <TableHead>Reps/Tiempo</TableHead>
                              <TableHead>Descanso</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {day.exercises.map((exercise) => (
                              <TableRow key={exercise.name}>
                                <TableCell className="font-medium">{exercise.name}</TableCell>
                                <TableCell>{exercise.sets}</TableCell>
                                <TableCell>{exercise.reps}</TableCell>
                                <TableCell>{exercise.rest}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-1">
                  {result.routine}
                </p>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleDialogClose}>
                Cerrar y Recargar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
