'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing real-time feedback on exercise technique using AI.
 *
 * - realTimeFeedback - A function that accepts video data and returns feedback on the user's exercise form.
 * - RealTimeFeedbackInput - The input type for the realTimeFeedback function, including video data URI and exercise type.
 * - RealTimeFeedbackOutput - The return type for the realTimeFeedback function, providing feedback on the user's form.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeFeedbackInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A video of the user performing an exercise, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
  exerciseType: z.string().describe('The type of exercise being performed.'),
});
export type RealTimeFeedbackInput = z.infer<typeof RealTimeFeedbackInputSchema>;

const RealTimeFeedbackOutputSchema = z.object({
  feedback: z.string().describe('AI-powered feedback on the user\'s exercise form.'),
});
export type RealTimeFeedbackOutput = z.infer<typeof RealTimeFeedbackOutputSchema>;

export async function realTimeFeedback(input: RealTimeFeedbackInput): Promise<RealTimeFeedbackOutput> {
  return realTimeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeFeedbackPrompt',
  input: {schema: RealTimeFeedbackInputSchema},
  output: {schema: RealTimeFeedbackOutputSchema},
  prompt: `Eres un entrenador de fitness con IA que proporciona información en tiempo real sobre la forma de hacer ejercicio. Tu respuesta debe ser en español.

  Analiza el vídeo del usuario realizando el ejercicio {{{exerciseType}}} y dale tu opinión para mejorar su forma y reducir el riesgo de lesiones.

  Vídeo: {{media url=videoDataUri}}`,
});

const realTimeFeedbackFlow = ai.defineFlow(
  {
    name: 'realTimeFeedbackFlow',
    inputSchema: RealTimeFeedbackInputSchema,
    outputSchema: RealTimeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
