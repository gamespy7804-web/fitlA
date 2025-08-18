export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sport: string;
  description: string;
  videoUrl: string;
  imageUrl: string;
};

export const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Sentadilla con Barra',
    muscleGroup: 'Piernas',
    sport: 'Halterofilia',
    description: 'Un ejercicio compuesto fundamental que trabaja los cuádriceps, isquiotibiales, glúteos y el core. Esencial para construir fuerza y potencia en el tren inferior.',
    videoUrl: 'https://www.youtube.com/watch?v=U3h99fayM6E',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '2',
    name: 'Salto al Cajón',
    muscleGroup: 'Piernas',
    sport: 'Baloncesto',
    description: 'Un ejercicio pliométrico que desarrolla la potencia explosiva de las piernas. Crucial para mejorar el salto vertical y el rendimiento atlético.',
    videoUrl: 'https://www.youtube.com/watch?v=B322k_Q12_0',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '3',
    name: 'Press de Banca',
    muscleGroup: 'Pecho',
    sport: 'Powerlifting',
    description: 'Un ejercicio clave para el tren superior que trabaja el pectoral mayor, los deltoides anteriores y los tríceps. Fundamental para construir fuerza en la parte superior del cuerpo.',
    videoUrl: 'https://www.youtube.com/watch?v=rT7g-Nzl0Yk',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '4',
    name: 'Dominadas',
    muscleGroup: 'Espalda',
    sport: 'Calistenia',
    description: 'Un desafiante ejercicio de peso corporal que fortalece el dorsal ancho, los bíceps y los trapecios. Excelente para desarrollar una espalda y un agarre fuertes.',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '5',
    name: 'Balanceo con Kettlebell',
    muscleGroup: 'Cuerpo Completo',
    sport: 'CrossFit',
    description: 'Un ejercicio dinámico y de alta intensidad que desarrolla potencia, resistencia y fuerza en toda la cadena posterior.',
    videoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '6',
    name: 'Plancha',
    muscleGroup: 'Core',
    sport: 'Fitness General',
    description: 'Un ejercicio isométrico de fuerza para el core que consiste en mantener una posición similar a la de una flexión durante el mayor tiempo posible.',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '7',
    name: 'Peso Muerto',
    muscleGroup: 'Cuerpo Completo',
    sport: 'Halterofilia',
    description: 'La prueba definitiva de fuerza de todo el cuerpo, el peso muerto trabaja toda la cadena posterior, desde las pantorrillas hasta la parte superior de la espalda.',
    videoUrl: 'https://www.youtube.com/watch?v=ytGaGIn3SjE',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '8',
    name: 'Sprints',
    muscleGroup: 'Piernas',
    sport: 'Fútbol',
    description: 'Ráfagas cortas de carrera a máxima velocidad, esenciales para mejorar la velocidad, la aceleración y la condición física anaeróbica en los deportes de campo.',
    videoUrl: 'https://www.youtube.com/watch?v=b_3s_n89-mo',
    imageUrl: 'https://placehold.co/600x400',
  },
];
