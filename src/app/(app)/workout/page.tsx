import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Flame, Repeat, TrendingUp, Weight } from 'lucide-react';

const workoutPlan = {
  name: "Constructor de Cimientos - Semana 1",
  days: [
    {
      day: 1,
      title: "Fuerza del Tren Superior",
      exercises: [
        { name: "Press de Banca", sets: 3, reps: "8-10" },
        { name: "Dominadas", sets: 3, reps: "Al fallo" },
        { name: "Press Militar", sets: 3, reps: "8-10" },
        { name: "Remo con Mancuerna", sets: 3, reps: "10-12" },
      ],
    },
    {
      day: 2,
      title: "Potencia del Tren Inferior",
      exercises: [
        { name: "Sentadilla con Barra", sets: 4, reps: "6-8" },
        { name: "Peso Muerto Rumano", sets: 3, reps: "10-12" },
        { name: "Prensa de Piernas", sets: 3, reps: "10-12" },
        { name: "Elevación de Talones", sets: 4, reps: "15-20" },
      ],
    },
    {
      day: 3,
      title: "Acondicionamiento de Cuerpo Completo",
      exercises: [
        { name: "Balanceo con Kettlebell", sets: 5, reps: "20" },
        { name: "Salto al Cajón", sets: 3, reps: "10" },
        { name: "Plancha", sets: 3, reps: "60s" },
        { name: "Sprints", sets: 5, reps: "30s" },
      ],
    },
  ],
};

export default function WorkoutPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {workoutPlan.name}
          </h1>
          <p className="text-muted-foreground">
            Registra tus series, repeticiones y peso para seguir tu progreso.
          </p>
        </div>
        <Button variant="secondary">
          <TrendingUp className="mr-2" />
          Generar Progresión de la Próxima Semana
        </Button>
      </div>

      <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
        {workoutPlan.days.map((day, index) => (
          <AccordionItem value={`item-${index}`} key={day.day}>
            <AccordionTrigger>
              <div className="flex items-center gap-4">
                <Badge className="text-lg px-3 py-1">Día {day.day}</Badge>
                <span className="text-xl font-semibold font-headline">{day.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2">
                {day.exercises.map((exercise) => (
                  <Card key={exercise.name}>
                    <CardHeader>
                      <CardTitle className='flex justify-between items-center'>
                        <span>{exercise.name}</span>
                        <Badge variant="outline">{exercise.sets} series x {exercise.reps} reps</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-4">
                          <div className='w-10 text-center font-bold text-primary'>Serie {setIndex + 1}</div>
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`weight-${index}-${setIndex}`} className="sr-only">Peso</Label>
                              <div className="relative">
                                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id={`weight-${index}-${setIndex}`} type="number" placeholder="Peso (kg)" className="pl-9" />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`reps-${index}-${setIndex}`} className="sr-only">Reps</Label>
                               <div className="relative">
                                <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id={`reps-${index}-${setIndex}`} type="number" placeholder="Reps" className="pl-9" />
                              </div>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                            <Check />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 text-center">
                  <Button size="lg">
                    <Flame className="mr-2" />
                    Completar Entrenamiento de {day.title}
                  </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
