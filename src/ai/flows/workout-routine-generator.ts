
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
  trainingDays: z.coerce.number().describe("How many days per week the user wants to train."),
  trainingDuration: z.coerce.number().describe("How long each training session should be in minutes."),
  fitnessAssessment: z.string().describe("The user's answer to a question that helps quantify their fitness level."),
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

Your task is to generate a detailed and structured training plan based on the user's provided information.
The plan MUST strictly adhere to the provided 'trainingDays' and 'trainingDuration'. The sum of exercise durations plus rest times for each day should approximate the 'trainingDuration'.

Consider all user parameters: sport, goals, fitness level, age, weight, gender, and their fitness assessment.
The 'fitnessAssessment' is a key piece of information to accurately gauge the user's current capabilities. Use it to create a challenging but achievable routine.

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
- Fitness Assessment: {{{fitnessAssessment}}}
- Training days per week: {{{trainingDays}}}
- Training duration per session: {{{trainingDuration}}} minutes
{{#if age}}- Age: {{{age}}}{{/if}}
{{#if weight}}- Weight: {{{weight}}} kg{{/if}}
{{#if gender}}- Gender: {{{gender}}}{{/if}}
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
    // Ensure clarificationQuestion is not part of the final output
    if (output?.clarificationQuestion) {
        output.clarificationQuestion = undefined;
    }
    return output!;
  }
);
