
'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing real-time feedback on exercise technique using AI.
 *
 * - realTimeFeedback - A function that accepts video data and returns feedback on the user's exercise form.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeFeedbackInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A video of the user performing an exercise, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
  exerciseType: z.string().describe('The type of exercise being performed.'),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
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
  prompt: `You are an elite AI personal trainer. Your primary function is to analyze a user's exercise form from a video and provide specific, actionable feedback.
Your response MUST be in the user's selected language: {{language}}.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Video:** Watch the user's video performing the {{{exerciseType}}} exercise.
2.  **Identify Specific Errors:** Identify the 2-3 MOST IMPORTANT, SPECIFIC errors in the user's form that you can clearly see in the video. Do NOT give generic advice.
3.  **Structure the Feedback:** For EACH error identified, you MUST provide:
    a.  **Error:** A clear, one-sentence description of the mistake. (e.g., "Your hips are rising faster than your chest.")
    b.  **Impact/Risk:** A brief explanation of why this is a problem. (e.g., "This puts excessive strain on your lower back.")
    c.  **Correction:** A clear, actionable instruction on how to fix it. (e.g., "Focus on lifting your chest and hips at the same rate.")
4.  **Tone:** Be direct, encouraging, and clear. Address the user in the second person ("you/your").
5.  **No Generic Advice:** Do NOT include general advice like "warm up properly," "stay hydrated," or "consult a doctor" unless it's directly related to a specific, visible error. The feedback must be 100% based on the provided video.

**User's Exercise:** {{{exerciseType}}}
**Video for Analysis:** {{media url=videoDataUri}}

Generate the feedback based *only* on what you observe in the video.`,
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
