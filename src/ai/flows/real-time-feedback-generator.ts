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
  prompt: `You are an AI-powered fitness coach providing real-time feedback on exercise form.

  Analyze the video of the user performing the {{{exerciseType}}} exercise and provide feedback to improve their form and reduce the risk of injury.

  Video: {{media url=videoDataUri}}`,
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
