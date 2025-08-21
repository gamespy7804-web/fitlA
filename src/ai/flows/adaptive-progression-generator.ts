
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
import { i18n } from '@/i18n/server';

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
  userFeedback: z.string().optional().describe("Free-text feedback from the user about the last cycle and what they'd like to change."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type AdaptiveProgressionInput = z.infer<typeof AdaptiveProgressionInputSchema>;


export async function adaptiveProgressionGenerator(input: AdaptiveProgressionInput): Promise<WorkoutRoutineOutput> {
  return adaptiveProgressionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveProgressionPrompt',
  input: {schema: z.object({
    trainingData: z.string(),
    adherence: z.number(),
    selfReportedFitness: z.string(),
    originalRoutine: z.string(),
    trainingDays: z.coerce.number().optional(),
    trainingDuration: z.coerce.number().optional(),
    userFeedback: z.string().optional(),
    language: z.string(),
    selfReportedFitnessLabel: z.string(),
  })},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `You are an expert AI sports trainer, specializing in creating weekly training progressions.
Your response MUST be in the user's selected language: {{language}}.

Your task is to analyze a user's previous training cycle data, their adherence, self-reported fitness level, and most importantly, their direct feedback to generate a NEW progressive training plan for the upcoming week.

**User Feedback (Highest Priority):**
{{#if userFeedback}}
- The user has provided the following feedback, which MUST be the primary guide for your adjustments: "{{{userFeedback}}}"
- Prioritize this feedback over the general rules below if there is a conflict. For example, if the user says it was "easy" but asks for "less volume", you must reduce the volume.
{{/if}}

Use the original routine as a baseline and adjust it for progression. The key principles are progressive overload and recovery.

- If adherence is low (< 75%), the plan was likely too demanding. Consider reducing volume (fewer sets or exercises) or intensity.
- If the user reported the cycle was "{{selfReportedFitnessLabel}}" (easy) and adherence is high (> 90%), increase the intensity significantly. Increment weight, reps, or introduce more difficult exercise variations.
- If the user reported it was "too hard", reduce the intensity. Decrease weight, reps, or simplify the exercises.
- If the user reported it was "just right" and adherence is high, apply moderate progressive overload. Slightly increase reps or weight on key exercises.
- Analyze the actual performance (training data) to make precise adjustments. If the user consistently exceeded target reps, increase the weight or reps for that exercise. If they fell short, maintain or slightly reduce the difficulty.

**New Preferences (Optional):**
{{#if trainingDays}}- **New Training Days per Week:** {{{trainingDays}}}. If this value is provided, the NEW plan must have this exact number of training days. If not, maintain the number of days from the original plan.{{/if}}
{{#if trainingDuration}}- **New Training Duration per Session:** {{{trainingDuration}}} minutes. If this value is provided, the duration of each session in the NEW plan should approximate this number. If not, maintain a similar duration as the original plan.{{/if}}

The new plan you generate MUST follow the same structure as the original in terms of 'requiresFeedback' and 'requiresWeight' indicators for similar exercises. If new exercises are added, determine these indicators appropriately.

**Original Routine (for structural reference):**
\`\`\`json
{{{originalRoutine}}}
\`\`\`

**Previous Cycle Data:**
- Adherence: {{{adherence}}}
- Reported Fitness Level: {{{selfReportedFitness}}}
- Logged Training Data:
\`\`\`json
{{{trainingData}}}
\`\`\`
  
Generate the new routine in the 'structuredRoutine' format.
`,
});

const adaptiveProgressionFlow = ai.defineFlow(
  {
    name: 'adaptiveProgressionFlow',
    inputSchema: AdaptiveProgressionInputSchema,
    outputSchema: WorkoutRoutineOutputSchema,
  },
  async input => {
    const { t } = await i18n(input.language as any);
    const {output} = await prompt({
      ...input,
      selfReportedFitnessLabel: t(`adaptiveProgression.fitnessLevels.${input.selfReportedFitness}` as any)
    });
    return output!;
  }
);
