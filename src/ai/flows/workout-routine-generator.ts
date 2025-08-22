
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
  prompt: `You are an expert sports trainer, specializing in generating personalized training routines.
Your responses MUST be in the user's selected language: {{language}}.

Your task is to act as a personal trainer and generate a detailed training plan based on the user's provided information.

**User Information:**
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
- Age: {{{age}}}
- Weight: {{{weight}}} kg
- Gender: {{{gender}}}
- Training days per week: {{{trainingDays}}}
- Training duration per session: {{{trainingDuration}}} minutes

**Action: Generate a full, detailed routine.**
- The plan MUST strictly adhere to the provided 'trainingDays' and 'trainingDuration'.
- For EACH exercise, set 'requiresFeedback' to true ONLY for complex, high-injury-risk exercises (e.g., Squats, Deadlifts, Olympic Lifts).
- For EACH exercise, set 'requiresWeight' to true for weightlifting exercises and false for bodyweight ones.
- For EACH exercise, generate a 'youtubeQuery' for a tutorial video.
- Determine if the sport is primarily weight training.
  - If YES (e.g., Weightlifting, Powerlifting, Bodybuilding): Set 'isWeightTraining' to true and provide the routine as a simple text string in the 'routine' field.
  - If NO (e.g., Calisthenics, Running, general fitness): Set 'isWeightTraining' to false and generate a detailed, structured plan in the 'structuredRoutine' field, with varied days.
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
