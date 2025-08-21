
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing user performance based on workout logs.
 *
 * - performanceAnalystGenerator - A function that provides an analysis of strengths, weaknesses, and training methodology.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PerformanceAnalystInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string of an array of completed workout logs. Each log contains the exercises, sets, reps, and weight completed by the user.'
    ),
});
export type PerformanceAnalystInput = z.infer<typeof PerformanceAnalystInputSchema>;

const PerformanceAnalystOutputSchema = z.object({
  analysis: z.string().describe("A concise analysis of the user's performance, highlighting strengths, weaknesses, and the proposed training methodology for the next cycle."),
});
export type PerformanceAnalystOutput = z.infer<typeof PerformanceAnalystOutputSchema>;

export async function performanceAnalystGenerator(input: PerformanceAnalystInput): Promise<PerformanceAnalystOutput> {
    return performanceAnalystFlow(input);
}

const prompt = ai.definePrompt({
    name: 'performanceAnalystPrompt',
    input: { schema: PerformanceAnalystInputSchema },
    output: { schema: PerformanceAnalystOutputSchema },
    prompt: `Eres un analista de rendimiento deportivo de IA. Tu tarea es analizar los datos de entrenamiento de un usuario y proporcionarle un resumen conciso y directo (1-2 frases) sobre sus fortalezas, debilidades y el método que utilizarás para su próxima rutina. DEBES dirigirte al usuario directamente en segunda persona (tú/tus).

- Analiza los datos de entrenamiento registrados para identificar patrones. ¿Estás progresando más rápido en ciertos levantamientos? ¿Te estás quedando atrás en otros?
- Identifica una fortaleza clave (p. ej., "Muestras un excelente progreso en tu fuerza de empuje").
- Identifica una debilidad clave (p. ej., "Tu volumen de la parte inferior del cuerpo es un área de mejora").
- Describe brevemente el enfoque para la próxima rutina (p. ej., "Nos centraremos en aumentar tu volumen de piernas mientras mantenemos tu fuerza de la parte superior del cuerpo.").

**Tus Datos de Entrenamiento Registrados:**
\`\`\`json
{{{trainingData}}}
\`\`\`

Genera un análisis conciso en el campo 'analysis' dirigido directamente al usuario.
    `,
});

const performanceAnalystFlow = ai.defineFlow(
    {
        name: 'performanceAnalystFlow',
        inputSchema: PerformanceAnalystInputSchema,
        outputSchema: PerformanceAnalystOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
