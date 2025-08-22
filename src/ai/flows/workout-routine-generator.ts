
'use server';

/**
 * @fileOverview Workout routine generator flow.
 *
 * - generateWorkoutRoutine - A function that generates a personalized workout routine.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { DailyWorkoutSchema, WorkoutRoutineOutputSchema } from './types';
import type { WorkoutRoutineOutput } from './types';


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
  language: z.string().describe("The user's selected language (e.g., 'en', 'es').")
});
export type WorkoutRoutineInput = z.infer<typeof WorkoutRoutineInputSchema>;

export async function generateWorkoutRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutineOutput> {
  return workoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutRoutinePrompt',
  input: {schema: WorkoutRoutineInputSchema},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `You are an expert sports trainer and physiologist, specializing in generating safe, effective, and personalized training routines.
Your responses MUST be in the user's selected language: {{language}}.

Your task is to generate a full, detailed, structured training plan based on the user's provided information.
The output format MUST always be a 'structuredRoutine'. Do NOT use the 'routine' or 'isWeightTraining' fields.

**User Information:**
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
- Age: {{{age}}}
- Weight: {{{weight}}} kg
- Gender: {{{gender}}}
- Training days per week: {{{trainingDays}}}
- Training duration per session: {{{trainingDuration}}} minutes

**Action: Generate a full, detailed, structured weekly routine.**

**CRITICAL INSTRUCTIONS:**
1.  **Structured Output ONLY**: You MUST generate a detailed plan in the 'structuredRoutine' field. The 'routine' and 'isWeightTraining' fields are deprecated and must not be used.
2.  **Adherence to Constraints**: The plan MUST strictly adhere to the user's 'trainingDays' and 'trainingDuration'.
3.  **Weekly Structure**: Organize the training days logically throughout the week to allow for adequate muscle recovery. Avoid scheduling two high-intensity workouts for the same muscle group on consecutive days.
4.  **Warm-up and Cool-down**: EACH daily workout MUST begin with a specific 'Warm-up' phase (3-5 minutes of light cardio and dynamic stretches) and end with a 'Cool-down' phase (3-5 minutes of static stretches for the muscles worked). These should be included as exercises in the list. For warm-up/cool-down exercises, set 'reps' to a duration (e.g., "60 sec").
5.  **Exercise Selection**:
    -   Set 'requiresFeedback' to true ONLY for complex, high-injury-risk, free-weight exercises (e.g., Squats, Deadlifts, Bench Press, Olympic Lifts). It should be false for machine exercises, bodyweight exercises, or simple movements.
    -   Set 'requiresWeight' to true for any exercise that requires external weights (dumbbells, barbells, machines) and false for bodyweight or cardio exercises.
6.  **YouTube Query Generation**: For EACH exercise, generate a concise and effective 'youtubeQuery' in the user's specified language ({{language}}) to find a high-quality tutorial video. Example for squats in Spanish: "como hacer sentadillas correctamente".
7.  **Safety First**: Prioritize safety and proper form. The routines should be designed to minimize injury risk.
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
`