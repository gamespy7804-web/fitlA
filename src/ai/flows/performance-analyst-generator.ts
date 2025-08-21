
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing user performance based on workout logs.
 *
 * - performanceAnalystGenerator - A function that provides an analysis of strengths, weaknesses, and a training methodology.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PerformanceAnalystInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string of an array of completed workout logs. Each log contains the exercises, sets, reps, and weight completed by the user.'
    ),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
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
    prompt: `You are an AI sports performance analyst. Your task is to analyze a user's training data and provide a concise, direct summary (1-2 sentences) of their strengths, weaknesses, and the method you will use for their next routine. You MUST address the user directly in the second person (you/your).
Your response MUST be in the user's selected language: {{language}}.

- Analyze the logged training data to identify patterns. Are they progressing faster on certain lifts? Are they lagging on others?
- Identify one key strength (e.g., "You show excellent progress in your pushing strength").
- Identify one key weakness (e.g., "Your lower body volume is an area for improvement").
- Briefly describe the approach for the next routine (e.g., "We will focus on increasing your leg volume while maintaining your upper body strength.").

**Your Logged Training Data:**
\`\`\`json
{{{trainingData}}}
\`\`\`

Generate a concise analysis in the 'analysis' field addressed directly to the user.
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
