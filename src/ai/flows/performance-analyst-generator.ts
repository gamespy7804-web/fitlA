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
    prompt: `Eres un analista de rendimiento deportivo de IA. Tu respuesta debe ser en español.

    Tu tarea es analizar los datos de entrenamiento de un usuario y proporcionar un resumen conciso (1-2 frases) sobre sus fortalezas, debilidades y el método que utilizarás para su próxima rutina.

    - Analiza los datos de entrenamiento registrados para identificar patrones. ¿El usuario está progresando más rápido en ciertos levantamientos? ¿Se está quedando atrás en otros?
    - Identifica una fortaleza clave (por ejemplo, "excelente progreso en la fuerza de empuje").
    - Identifica una debilidad clave (por ejemplo, "el volumen de la parte inferior del cuerpo es un área de mejora").
    - Describe brevemente el enfoque para la próxima rutina (por ejemplo, "Nos centraremos en aumentar el volumen de las piernas mientras mantenemos la fuerza de la parte superior del cuerpo.").

    **Datos de Entrenamiento Registrados:**
    \`\`\`json
    {{{trainingData}}}
    \`\`\`

    Genera un análisis conciso en el campo 'analysis'.
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
