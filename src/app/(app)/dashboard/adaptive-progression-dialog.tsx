
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

const formSchema = z.object({
  selfReportedFitness: z.enum(['easy', 'just-right', 'hard']),
});

export function AdaptiveProgressionDialog({ children, className }: { children?: React.ReactNode, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canProgress, setCanProgress] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkProgress = () => {
      const storedRoutine = localStorage.getItem('workoutRoutine');
      const detailedLogs = JSON.parse(localStorage.getItem('detailedWorkoutLogs') || '[]');
      
      if (storedRoutine) {
        try {
            const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
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
    
    // Check on mount and when dialog opens
    checkProgress();

    // Also check when window gets focus, in case logs were updated in another tab.
    window.addEventListener('focus', checkProgress);

    return () => {
        window.removeEventListener('focus', checkProgress);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selfReportedFitness: 'just-right',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const originalRoutineJSON = localStorage.getItem('workoutRoutine');
      const detailedLogsJSON = localStorage.getItem('detailedWorkoutLogs');

      if (!originalRoutineJSON || !detailedLogsJSON) {
        toast({ variant: 'destructive', title: 'Datos insuficientes', description: 'No se encontraron datos de la rutina o registros detallados.' });
        setIsLoading(false);
        return;
      }
      const originalRoutine: WorkoutRoutineOutput = JSON.parse(originalRoutineJSON);
      const adherence = (JSON.parse(detailedLogsJSON).length / (originalRoutine.structuredRoutine?.length || 1));

      const newRoutine = await adaptiveProgressionGenerator({
        selfReportedFitness: values.selfReportedFitness,
        originalRoutine: originalRoutineJSON,
        trainingData: detailedLogsJSON,
        adherence,
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
      form.reset();
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!canProgress} className={cn("w-full", className)}>
            {children || <>
            <Zap />
            <span>Generar Próxima Semana</span>
            </>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Zap className="text-primary" /> Generar Progresión de IA
          </DialogTitle>
          <DialogDescription>
            Evalúa tu último ciclo de entrenamiento para generar el siguiente.
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

