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
  age: z.number().optional().describe("The user's age."),
  weight: z.number().optional().describe("The user's weight in kg."),
  gender: z.string().optional().describe("The user's gender."),
  trainingDays: z.number().optional().describe("How many days per week the user wants to train."),
  trainingDuration: z.number().optional().describe("How long each training session should be in minutes."),
  clarificationAnswers: z.string().optional().describe("The user's answers to the clarification questions.")
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
  duration: z.number().describe("The total estimated duration of the workout in minutes."),
  exercises: z.array(ExerciseDetailSchema).describe('List of exercises for the day.'),
});

const WorkoutRoutineOutputSchema = z.object({
  clarificationQuestion: z.string().optional().describe("A question to ask the user to get more details about their fitness level for the specified sport. Omit if enough information is present to generate a routine."),
  isWeightTraining: z
    .boolean()
    .optional()
    .describe('Whether the generated routine is for weight training.'),
  routine: z
    .string()
    .optional()
    .describe('The generated workout routine as a single string. Provided if isWeightTraining is true.'),
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
  prompt: `You are an expert sports coach, specialized in generating personalized workout routines.

  **Step 1: Assess Information Adequacy**
  - Examine the user's sport, goals, and fitness level.
  - If you have enough information to create a detailed plan (i.e., if 'clarificationAnswers' is provided), proceed to Step 2.
  - If you DO NOT have enough information, you MUST ask a single, specific, clarifying question to better understand their current fitness level in the context of their sport. For example:
    - For 'Soccer': "How far can you currently run in 20 minutes?"
    - For 'Calisthenics': "How many consecutive push-ups and pull-ups can you do?"
    - For 'Swimming': "What is your best time for a 100m freestyle swim?"
  - Return ONLY this question in the 'clarificationQuestion' field and nothing else.

  **Step 2: Generate Workout Plan**
  - If you have received answers in the 'clarificationAnswers' field, generate a detailed and structured workout plan.
  - The plan MUST strictly adhere to the 'trainingDays' and 'trainingDuration' provided. The sum of exercise durations plus rest times for each day should approximate the 'trainingDuration'.
  - Take into account all user parameters: sport, goals, fitness level, age, weight, gender, and their answers to the clarification questions.
  - Determine if the sport is primarily weight-training based (e.g., Weightlifting, Powerlifting, Bodybuilding, CrossFit).
    - If it IS a weight-training sport:
      - Set 'isWeightTraining' to true.
      - Generate a simple descriptive workout routine as a string.
      - Return it in the 'routine' field.
    - If it is NOT a weight-training sport:
      - Set 'isWeightTraining' to false.
      - Generate a detailed, structured workout plan for the number of days specified in 'trainingDays'.
      - For each day, provide a title, a total duration, and a list of exercises with sets, reps (or duration), and rest time.
      - Return this in the 'structuredRoutine' field.

  **User Information:**
  - Sport: {{{sport}}}
  - Goals: {{{goals}}}
  - Stated Fitness Level: {{{fitnessLevel}}}
  {{#if age}}- Age: {{{age}}}{{/if}}
  {{#if weight}}- Weight: {{{weight}}} kg{{/if}}
  {{#if gender}}- Gender: {{{gender}}}{{/if}}
  {{#if trainingDays}}- Training Days per Week: {{{trainingDays}}}{{/if}}
  {{#if trainingDuration}}- Training Duration per Session: {{{trainingDuration}}} minutes{{/if}}
  {{#if clarificationAnswers}}- Fitness Details: {{{clarificationAnswers}}}{{/if}}
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
