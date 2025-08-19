
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adaptiveProgressionGenerator } from '@/ai/flows/adaptive-progression-generator';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  selfReportedFitness: z.enum(['easy', 'just-right', 'hard']),
  trainingDays: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(1).max(7).optional()
  ),
  trainingDuration: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(15).max(240).optional()
  ),
});

export function AdaptiveProgressionDialog({ children, className }: { children?: React.ReactNode, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canProgress, setCanProgress] = useState(false);
  const [originalRoutine, setOriginalRoutine] = useState<WorkoutRoutineOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selfReportedFitness: 'just-right',
      trainingDays: undefined,
      trainingDuration: undefined,
    },
  });

  useEffect(() => {
    const checkProgress = () => {
      const storedRoutine = localStorage.getItem('workoutRoutine');
      const detailedLogs = JSON.parse(localStorage.getItem('detailedWorkoutLogs') || '[]');
      
      if (storedRoutine) {
        try {
            const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
            setOriginalRoutine(parsedRoutine);
            // Enable progression if there's a routine and at least one log has been completed.
            if (parsedRoutine.structuredRoutine && parsedRoutine.structuredRoutine.length > 0) {
              if (detailedLogs.length > 0) {
                setCanProgress(true);
              } else {
                setCanProgress(false);
              }
            } else {
               setCanProgress(false);
            }
        }
        catch (e) {
            setCanProgress(false);
        }
      } else {
         setCanProgress(false);
      }
    };
    
    checkProgress();
    window.addEventListener('focus', checkProgress);
    window.addEventListener('storage', checkProgress);

    return () => {
        window.removeEventListener('focus', checkProgress);
        window.removeEventListener('storage', checkProgress);
    }
  }, []);

  useEffect(() => {
    if (originalRoutine?.structuredRoutine) {
      form.setValue('trainingDays', originalRoutine.structuredRoutine.length);
      const avgDuration = originalRoutine.structuredRoutine.reduce((acc, day) => acc + day.duration, 0) / originalRoutine.structuredRoutine.length;
      form.setValue('trainingDuration', Math.round(avgDuration));
    }
  }, [originalRoutine, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const originalRoutineJSON = localStorage.getItem('workoutRoutine');
      const detailedLogsJSON = localStorage.getItem('detailedWorkoutLogs');

      if (!originalRoutineJSON || !detailedLogsJSON || !originalRoutine?.structuredRoutine) {
        toast({ variant: 'destructive', title: 'Datos insuficientes', description: 'No se encontraron datos de la rutina o registros detallados.' });
        setIsLoading(false);
        return;
      }
      
      const adherence = (JSON.parse(detailedLogsJSON).length / (originalRoutine.structuredRoutine.length || 1));

      const newRoutine = await adaptiveProgressionGenerator({
        selfReportedFitness: values.selfReportedFitness,
        originalRoutine: originalRoutineJSON,
        trainingData: detailedLogsJSON,
        adherence,
        trainingDays: values.trainingDays,
        trainingDuration: values.trainingDuration,
      });

      localStorage.setItem('workoutRoutine', JSON.stringify(newRoutine));
      localStorage.setItem('completedWorkouts', '[]');
      localStorage.setItem('detailedWorkoutLogs', '[]');

      toast({
        title: '¡Nueva Rutina Generada!',
        description: 'Tu plan de entrenamiento ha sido actualizado. ¡A por ello!',
      });
      setIsOpen(false);
      window.location.reload();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al generar la progresión',
        description: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({ selfReportedFitness: 'just-right'});
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!canProgress} className={cn("w-full", className)}>
            {children || <>
            <span>Generar Nueva Rutina</span>
            </>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Zap className="text-primary" /> Generar Progresión de IA
          </DialogTitle>
          <DialogDescription>
            Evalúa tu último ciclo y ajusta tus preferencias para generar el siguiente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="selfReportedFitness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Cómo te sentiste en el último ciclo?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Demasiado fácil</SelectItem>
                      <SelectItem value="just-right">Justo</SelectItem>
                      <SelectItem value="hard">Demasiado difícil</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Ajustes para la próxima semana (Opcional)</p>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trainingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Días/Semana</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="ej. 3" {...field} value={field.value ?? ''} />
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
                            <Input type="number" placeholder="ej. 60" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Nueva Rutina
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
