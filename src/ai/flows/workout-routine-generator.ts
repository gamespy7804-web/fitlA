
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
  fitnessAssessment: z.string().optional().describe("A history of questions and the user's answers to help quantify their fitness level."),
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

Your task is to act as a personal trainer. You will either generate a detailed training plan or ask a clarifying question to better understand the user's fitness level.

**Step 1: Assess Information**
Review all the user's provided information.
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
{{#if fitnessAssessment}}- Fitness Assessment History (Questions and User's Answers): {{{fitnessAssessment}}}{{/if}}
{{#if age}}- Age: {{{age}}}{{/if}}
{{#if weight}}- Weight: {{{weight}}} kg{{/if}}
{{#if gender}}- Gender: {{{gender}}}{{/if}}
{{#if trainingDays}}- Training days per week: {{{trainingDays}}}{{/if}}
{{#if trainingDuration}}- Training duration per session: {{{trainingDuration}}} minutes{{/if}}

**Step 2: Decide Action - Ask or Generate**
- **If the information is too generic** (e.g., fitnessLevel is just "intermediate" without concrete data), you MUST ask a clarifying question.
- The question should be specific to the sport to quantify the user's ability.
- Frame the question in the \`clarificationQuestion\` field. Provide 3-4 multiple-choice options.
- Example for "Calisthenics": \`{"question": "How many consecutive push-ups can you do?", "options": ["Fewer than 5", "5-15", "16-30", "More than 30"]}\`
- Example for "Running": \`{"question": "What is your best time for a 5km run?", "options": ["I haven't run a 5k", "More than 30 minutes", "25-30 minutes", "Under 25 minutes"]}\`
- If you ask a question, DO NOT generate a routine. The other fields in the output should be empty.

- **If you have enough information** (either from the initial assessment or previous answers), generate a full routine.
- The plan MUST strictly adhere to the provided 'trainingDays' and 'trainingDuration'.
- For EACH exercise, set 'requiresFeedback' to true ONLY for complex, high-injury-risk exercises (e.g., Squats, Deadlifts).
- For EACH exercise, set 'requiresWeight' to true for weightlifting exercises and false for bodyweight ones.
- For EACH exercise, generate a 'youtubeQuery' for a tutorial video.
- Determine if the sport is primarily weight training.
  - If YES (e.g., Weightlifting, Powerlifting): Set 'isWeightTraining' to true and provide the routine as a simple text string in the 'routine' field.
  - If NO: Set 'isWeightTraining' to false and generate a detailed, structured plan in the 'structuredRoutine' field.
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

    