'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating weekly workout progressions based on user data.
 *
 * - adaptiveProgressionGenerator - A function that generates a weekly workout progression.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { WorkoutRoutineOutputSchema } from './types';
import type { WorkoutRoutineOutput } from './types';

const AdaptiveProgressionInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string of an array of completed workout logs. Each log contains the exercises, sets, reps, and weight completed by the user.'
    ),
  adherence: z
    .number()
    .describe('The percentage of workouts completed by the user in the last cycle (e.g., 0.8 for 80%).'),
  selfReportedFitness: z
    .string()
    .describe(
      'The user\'s self-reported fitness level after the last cycle (e.g., "easy", "just right", "hard").'
    ),
  originalRoutine: z.string().describe("The user's original workout routine, used as a baseline for the new progression."),
  trainingDays: z.coerce.number().optional().describe("How many days per week the user wants to train for the new cycle."),
  trainingDuration: z.coerce.number().optional().describe("How long each training session should be in minutes for the new cycle."),
});
export type AdaptiveProgressionInput = z.infer<typeof AdaptiveProgressionInputSchema>;


export async function adaptiveProgressionGenerator(input: AdaptiveProgressionInput): Promise<WorkoutRoutineOutput> {
  return adaptiveProgressionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveProgressionPrompt',
  input: {schema: AdaptiveProgressionInputSchema},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `Eres un entrenador deportivo experto en IA, especializado en crear progresiones de entrenamiento semanales. Tu respuesta debe ser en español.

  Tu tarea es analizar los datos de entrenamiento del ciclo anterior de un usuario, su adherencia y su nivel de condición física auto-reportado para generar un NUEVO plan de entrenamiento progresivo para la próxima semana.

  Utiliza la rutina original como base y ajústala para la progresión. Los principios clave son la sobrecarga progresiva y la recuperación.

  - Si la adherencia es baja (< 75%), el plan fue probablemente demasiado exigente. Considera reducir el volumen (menos series o ejercicios) o la intensidad.
  - Si el usuario reportó que el ciclo fue "fácil" y la adherencia es alta (> 90%), aumenta la intensidad significativamente. Incrementa el peso, las repeticiones, o introduce variaciones de ejercicio más difíciles.
  - Si el usuario reportó que fue "demasiado difícil", reduce la intensidad. Disminuye el peso, las repeticiones, o simplifica los ejercicios.
  - Si el usuario reportó que fue "justo" y la adherencia es alta, aplica una sobrecarga progresiva moderada. Aumenta ligeramente las repeticiones o el peso en los ejercicios clave.
  - Analiza el rendimiento real (datos de entrenamiento) para hacer ajustes precisos. Si el usuario superó consistentemente las repeticiones objetivo, aumenta el peso o las repeticiones para ese ejercicio. Si no alcanzó el objetivo, mantén o reduce ligeramente la dificultad.

  **Nuevas Preferencias (Opcional):**
  {{#if trainingDays}}- **Nuevos Días de Entrenamiento por Semana:** {{{trainingDays}}}. Si se proporciona este valor, el NUEVO plan debe tener este número exacto de días de entrenamiento. Si no, mantén el número de días del plan original.{{/if}}
  {{#if trainingDuration}}- **Nueva Duración del Entrenamiento por Sesión:** {{{trainingDuration}}} minutos. Si se proporciona este valor, la duración de cada sesión en el NUEVO plan debe aproximarse a este número. Si no, mantén una duración similar a la del plan original.{{/if}}

  El nuevo plan que generes DEBE seguir la misma estructura que el original en términos de indicadores 'requiresFeedback' y 'requiresWeight' para ejercicios similares. Si se agregan nuevos ejercicios, determina estos indicadores de manera apropiada.

  **Rutina Original (para referencia estructural):**
  \`\`\`json
  {{{originalRoutine}}}
  \`\`\`

  **Datos del Ciclo Anterior:**
  - Adherencia: {{{adherence}}}
  - Nivel de Condición Física Reportado: {{{selfReportedFitness}}}
  - Datos de Entrenamiento Registrados:
  \`\`\`json
  {{{trainingData}}}
  \`\`\`
  
  Genera la nueva rutina en el formato 'structuredRoutine'.
  `,
});

const adaptiveProgressionFlow = ai.defineFlow(
  {
    name: 'adaptiveProgressionFlow',
    inputSchema: AdaptiveProgressionInputSchema,
    outputSchema: WorkoutRoutineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
