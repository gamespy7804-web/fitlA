'use server';

/**
 * @fileOverview Workout routine generator flow.
 *
 * - generateWorkoutRoutine - A function that generates a personalized workout routine.
 * - WorkoutRoutineInput - The input type for the generateWorkoutRoutine function.
 * - WorkoutRoutineOutput - The return type for the generateWorkoutRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutRoutineInputSchema = z.object({
  goals: z
    .string()
    .describe('The user goals, e.g., lose weight, gain muscle, improve endurance'),
  sport: z.string().describe('The sport the user is training for.'),
  fitnessLevel: z.string().describe('The current fitness level of the user (beginner, intermediate, advanced).'),
});
export type WorkoutRoutineInput = z.infer<typeof WorkoutRoutineInputSchema>;

const WorkoutRoutineOutputSchema = z.object({
  routine: z.string().describe('The generated workout routine.'),
});
export type WorkoutRoutineOutput = z.infer<typeof WorkoutRoutineOutputSchema>;

export async function generateWorkoutRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutineOutput> {
  return workoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutRoutinePrompt',
  input: {schema: WorkoutRoutineInputSchema},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `You are an expert sports coach, specialized in generating personalized workout routines based on user goals, sport, and current fitness level.

  Generate a workout routine for the following:
  Goals: {{{goals}}}
  Sport: {{{sport}}}
  Fitness Level: {{{fitnessLevel}}}
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
