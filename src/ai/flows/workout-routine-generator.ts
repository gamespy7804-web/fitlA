
'use server';

/**
 * @fileOverview Workout routine generator flow.
 *
 * - generateWorkoutRoutine - A function that generates a personalized workout routine.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { WorkoutRoutineOutputSchema } from './types';
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
  clarificationAnswers: z.string().optional().describe("The user's answers to the clarification questions."),
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

**Step 1: Evaluate Information Adequacy**
- Examine the user's sport, goals, and fitness level.
- If you have enough information to create a detailed plan (i.e., if 'clarificationAnswers' are provided), proceed to Step 2.
- If you DO NOT have enough information, you MUST ask a single, specific clarifying question to better understand their current fitness level in the context of their sport. For example:
  - For 'Soccer': "What distance can you currently run in 20 minutes?"
  - For 'Calisthenics': "How many consecutive push-ups and pull-ups can you do?"
  - For 'Swimming': "What is your best time for a 100-meter freestyle?"
- Return ONLY this question in the 'clarificationQuestion' field and nothing else.

**Step 2: Generate Training Plan**
- If you have received answers in the 'clarificationAnswers' field, generate a detailed and structured training plan.
- The plan MUST strictly adhere to the provided 'trainingDays' and 'trainingDuration'. The sum of exercise durations plus rest times for each day should approximate the 'trainingDuration'.
- Consider all user parameters: sport, goals, fitness level, age, weight, gender, and their answers to clarifying questions.
- For EACH exercise, determine if it would benefit from video technique analysis for form correction. Set 'requiresFeedback' to true **only** for complex, high-injury-risk, or technique-critical exercises, such as Squats, Deadlifts, Bench Press, Box Jumps, etc. For simpler, isolation, or stretching exercises (like planks, bicep curls, stretches), set it to false.
- For EACH exercise, determine if weight should be logged. Set 'requiresWeight' to true for exercises that typically involve weightlifting (e.g., Squats, Bench Press, Deadlift) and false for bodyweight exercises (e.g., Push-ups, Planks, Stretches).
- For EACH exercise, the 'reps' field MUST contain a number of repetitions (e.g., "8-12") OR a duration (e.g., "30 sec"). It should NEVER contain both.
- For EACH exercise, generate a YouTube search query for a tutorial video on how to perform the exercise correctly. For example, for "Barbell Squats", the query could be "how to do barbell squats correct technique". Save this query in the 'youtubeQuery' field.
- Determine if the sport is primarily based on weight training (e.g., Weightlifting, Powerlifting, Bodybuilding, CrossFit).
  - If IT IS a weight training sport:
    - Set 'isWeightTraining' to true.
    - Generate a simple descriptive workout routine as a single text string.
    - Return it in the 'routine' field.
  - If IT IS NOT a weight training sport:
    - Set 'isWeightTraining' to false.
    - Generate a detailed, structured training plan for the number of days specified in 'trainingDays'.
    - For each day, provide a title, a total duration, and a list of exercises with sets, reps (or duration), rest time, and the 'requiresFeedback' indicator.
    - Return this in the 'structuredRoutine' field.

**User Information:**
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
{{#if age}}- Age: {{{age}}}{{/if}}
{{#if weight}}- Weight: {{{weight}}} kg{{/if}}
{{#if gender}}- Gender: {{{gender}}}{{/if}}
{{#if trainingDays}}- Training days per week: {{{trainingDays}}}{{/if}}
{{#if trainingDuration}}- Training duration per session: {{{trainingDuration}}} minutes{{/if}}
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
