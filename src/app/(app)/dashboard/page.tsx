import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dumbbell, Scan, Share2 } from 'lucide-react';
import Link from 'next/link';
import { WorkoutGeneratorDialog } from './workout-generator-dialog';
import { ProgressChart } from '@/components/client/progress-chart';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            ¡Bienvenido de nuevo, Atleta!
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tu progreso.
          </p>
        </div>
        <WorkoutGeneratorDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Dumbbell className="text-primary" />
              Entrenamiento Actual
            </CardTitle>
            <CardDescription>
              Tu plan para esta semana.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Día 3: Fuerza de Cuerpo Completo</p>
            <p className="text-sm text-muted-foreground">5 ejercicios restantes</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/workout">Ir a Entrenar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Scan className="text-primary" />
              Analizar Forma
            </CardTitle>
            <CardDescription>
              Recibe feedback en tiempo real sobre tu técnica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Grábate realizando un ejercicio para obtener feedback instantáneo de la IA.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/feedback">Analizar Técnica</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Share2 className="text-primary" />
              Compartir Progreso
            </CardTitle>
            <CardDescription>
              Comparte tus últimos logros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
             ¡Acabo de alcanzar un nuevo récord personal en sentadillas! Comparte tu éxito con tus amigos y entrenador.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/log">Ver y Compartir</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <ProgressChart />

    </div>
  );
}
