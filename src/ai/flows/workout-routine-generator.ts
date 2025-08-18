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

const ExerciseDetailSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions or duration.'),
  rest: z.string().describe('Rest time between sets.'),
});

const DailyWorkoutSchema = z.object({
  day: z.number().describe('Day of the week for the workout.'),
  title: z.string().describe('Title of the workout for the day.'),
  exercises: z.array(ExerciseDetailSchema).describe('List of exercises for the day.'),
});

const WorkoutRoutineOutputSchema = z.object({
  isWeightTraining: z
    .boolean()
    .describe('Whether the generated routine is for weight training.'),
  routine: z
    .string()
    .optional()
    .describe('The generated workout routine as a single string. Provided if isWeightTraining is false.'),
  structuredRoutine: z
    .array(DailyWorkoutSchema)
    .optional()
    .describe('A structured workout routine. Provided if isWeightTraining is true.'),
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

  Determine if the sport is primarily weight-training based (e.g., Weightlifting, Powerlifting, Bodybuilding, CrossFit).
  - If it IS a weight-training sport, set isWeightTraining to true and generate a simple descriptive workout routine and return it in the 'routine' field.
  - If it is NOT a weight-training sport, set isWeightTraining to false and generate a detailed, structured 3-day workout plan. For each day, provide a title, and a list of exercises with sets, reps (or duration), and rest time. Return this in the 'structuredRoutine' field.

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
