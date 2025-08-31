
'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing real-time feedback on exercise technique using AI.
 *
 * - realTimeFeedback - A function that accepts video data and returns feedback on the user's exercise form.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { RealTimeFeedbackInputSchema, RealTimeFeedbackOutputSchema, type RealTimeFeedbackInput, type RealTimeFeedbackOutput } from './types';


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
2.  **Identify Specific Errors:** Identify up to 3 of the MOST IMPORTANT, SPECIFIC errors in the user's form that you can clearly see in the video. Do NOT give generic advice. If the form is excellent, set 'isCorrect' to true and leave the 'feedback' array empty.
3.  **Structure the Feedback:** For EACH error identified, you MUST provide:
    a.  **summary:** A very short, 2-3 word title for the error (e.g., "Hip Rise", "Knees Inward").
    b.  **point:** A clear, one-sentence description of the mistake. (e.g., "Your hips are rising faster than your chest.")
    c.  **correction:** A brief explanation of why this is a problem AND a clear, actionable instruction on how to fix it. (e.g., "This puts excessive strain on your lower back. Focus on lifting your chest and hips at the same rate.")
4.  **Tone:** Be direct, encouraging, and clear. Address the user in the second person ("you/your").
5.  **No Generic Advice:** Do NOT include general advice like "warm up properly," "stay hydrated," or "consult a doctor" unless it's directly related to a specific, visible error. The feedback must be 100% based on the provided video.

**User's Exercise:** {{{exerciseType}}}
**Video for Analysis:** {{media url=videoDataUri}}

Generate the feedback based *only* on what you observe in the video.
`,
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
