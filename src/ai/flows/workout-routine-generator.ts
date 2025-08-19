'use server';

/**
 * @fileOverview Workout routine generator flow.
 *
 * - generateWorkoutRoutine - A function that generates a personalized workout routine.
 * - WorkoutRoutineInput - The input type for the generateWorkoutRoutine function.
 * - WorkoutRoutineOutput - The return type for the generateWorkoutRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutRoutineInputSchema = z.object({
  goals: z
    .string()
    .describe('The user goals, e.g., lose weight, gain muscle, improve endurance'),
  sport: z.string().describe('The sport the user is training for.'),
  fitnessLevel: z.string().describe('The current fitness level of the user (beginner, intermediate, advanced).'),
  age: z.coerce.number().optional().describe("The user's age."),
  weight: z.coerce.number().optional().describe("The user's weight in kg."),
  gender: z.string().optional().describe("The user's gender."),
  trainingDays: z.coerce.number().optional().describe("How many days per week the user wants to train."),
  trainingDuration: z.coerce.number().optional().describe("How long each training session should be in minutes."),
  clarificationAnswers: z.string().optional().describe("The user's answers to the clarification questions.")
});
export type WorkoutRoutineInput = z.infer<typeof WorkoutRoutineInputSchema>;

const ExerciseDetailSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions or duration.'),
  rest: z.string().describe('Rest time between sets.'),
  requiresFeedback: z.boolean().describe('Whether this exercise requires video feedback for form correction.'),
});

const DailyWorkoutSchema = z.object({
  day: z.number().describe('Day of the week for the workout.'),
  title: z.string().describe('Title of the workout for the day.'),
  duration: z.number().describe("The total estimated duration of the workout in minutes."),
  exercises: z.array(ExerciseDetailSchema).describe('List of exercises for the day.'),
});

const WorkoutRoutineOutputSchema = z.object({
  clarificationQuestion: z.string().optional().describe("A question to ask the user to get more details about their fitness level for the specified sport. Omit if enough information is present to generate a routine."),
  isWeightTraining: z
    .boolean()
    .optional()
    .describe('Whether the generated routine is for weight training.'),
  routine: z
    .string()
    .optional()
    .describe('The generated workout routine as a single string. Provided if isWeightTraining is true.'),
  structuredRoutine: z
    .array(DailyWorkoutSchema)
    .optional()
    .describe('A structured workout routine. Provided if isWeightTraining is true.'),
});
export type WorkoutRoutineOutput = z.infer<typeof WorkoutRoutineOutputSchema>;

export async function generateWorkoutRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutineOutput> {
  return workoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutRoutinePrompt',
  input: {schema: WorkoutRoutineInputSchema},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `Eres un experto entrenador deportivo, especializado en generar rutinas de entrenamiento personalizadas. Tus respuestas deben ser en español.

  **Paso 1: Evaluar la idoneidad de la información**
  - Examina el deporte, los objetivos y el nivel de condición física del usuario.
  - Si tienes suficiente información para crear un plan detallado (es decir, si se proporcionan 'clarificationAnswers'), pasa al Paso 2.
  - Si NO tienes suficiente información, DEBES hacer una única pregunta aclaratoria específica para comprender mejor su nivel de condición física actual en el contexto de su deporte. Por ejemplo:
    - Para 'Fútbol': "¿Qué distancia puedes correr actualmente en 20 minutos?"
    - Para 'Calistenia': "¿Cuántas flexiones y dominadas consecutivas puedes hacer?"
    - Para 'Natación': "¿Cuál es tu mejor tiempo en 100 metros estilo libre?"
  - Devuelve ÚNICAMENTE esta pregunta en el campo 'clarificationQuestion' y nada más.

  **Paso 2: Generar un plan de entrenamiento**
  - Si has recibido respuestas en el campo 'clarificationAnswers', genera un plan de entrenamiento detallado y estructurado.
  - El plan DEBE cumplir estrictamente con los 'trainingDays' y 'trainingDuration' proporcionados. La suma de las duraciones de los ejercicios más los tiempos de descanso de cada día debe aproximarse a la 'trainingDuration'.
  - Ten en cuenta todos los parámetros del usuario: deporte, objetivos, nivel de condición física, edad, peso, sexo y sus respuestas a las preguntas aclaratorias.
  - Para CADA ejercicio, determina si se beneficiaría de un análisis de la técnica mediante vídeo para corregir la postura. Establece 'requiresFeedback' en true para ejercicios complejos o de alto riesgo como Sentadillas, Pesos Muertos, Press de Banca, Saltos al cajón, etc. Para ejercicios más simples como planchas o estiramientos, establécelo en false.
  - Determina si el deporte se basa principalmente en el entrenamiento con pesas (por ejemplo, Halterofilia, Powerlifting, Fisicoculturismo, CrossFit).
    - Si ES un deporte de entrenamiento con pesas:
      - Establece 'isWeightTraining' en true.
      - Genera una rutina de ejercicios descriptiva simple como una cadena de texto.
      - Devuélvela en el campo 'routine'.
    - Si NO es un deporte de entrenamiento con pesas:
      - Establece 'isWeightTraining' en false.
      - Genera un plan de entrenamiento detallado y estructurado para el número de días especificado en 'trainingDays'.
      - Para cada día, proporciona un título, una duración total y una lista de ejercicios con series, repeticiones (o duración), tiempo de descanso y el indicador 'requiresFeedback'.
      - Devuelve esto en el campo 'structuredRoutine'.

  **Información del usuario:**
  - Deporte: {{{sport}}}
  - Metas: {{{goals}}}
  - Nivel de condición física declarado: {{{fitnessLevel}}}
  {{#if age}}- Edad: {{{age}}}{{/if}}
  {{#if weight}}- Peso: {{{weight}}} kg{{/if}}
  {{#if gender}}- Género: {{{gender}}}{{/if}}
  {{#if trainingDays}}- Días de entrenamiento por semana: {{{trainingDays}}}{{/if}}
  {{#if trainingDuration}}- Duración del entrenamiento por sesión: {{{trainingDuration}}} minutos{{/if}}
  {{#if clarificationAnswers}}- Detalles de la condición física: {{{clarificationAnswers}}}{{/if}}
  `,
});

const workoutRoutineFlow = ai.defineFlow(
  {
    name: 'workoutRoutineFlow',
    inputSchema: WorkoutRoutineInputSchema,
    outputSchema: WorkoutRoutineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
