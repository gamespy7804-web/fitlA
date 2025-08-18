import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { exercises, type Exercise } from '@/lib/placeholder-data';
import { Eye, Search } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{exercise.name}</CardTitle>
        <CardDescription>
          {exercise.muscleGroup} - {exercise.sport}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-video relative mb-4">
          <Image
            src={exercise.imageUrl}
            alt={exercise.name}
            fill
            className="object-cover rounded-md"
            data-ai-hint={`${exercise.muscleGroup} ${exercise.sport}`}
          />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {exercise.description}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full">
          <Eye className="mr-2" />
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Biblioteca de Ejercicios
        </h1>
        <p className="text-muted-foreground">
          Explora nuestra base de datos de ejercicios específicos para cada deporte.
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar ejercicios..." className="pl-9" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
