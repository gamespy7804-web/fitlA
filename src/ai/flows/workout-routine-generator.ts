
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
  fitnessAssessment: z.string().optional().describe("A JSON string representing an array of questions and the user's answers to help quantify their fitness level. This is the history of the assessment."),
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

Your task is to act as a personal trainer. You will either generate a detailed training plan or, more importantly, generate a set of assessment questions to accurately gauge the user's fitness level before creating a routine.

**Step 1: Assess Information**
Review all the user's provided information.
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
- Fitness Assessment History: {{#if fitnessAssessment}}{{{fitnessAssessment}}}{{else}}No history yet.{{/if}}
- Training days per week: {{{trainingDays}}}
- Training duration per session: {{{trainingDuration}}} minutes

**Step 2: Decide Action - Ask or Generate**

- **IF 'fitnessAssessment' field is empty or contains fewer than 5 questions, your PRIMARY action is to generate a new set of diagnostic questions.** Do NOT generate a routine.
- You MUST generate a set of at least 5 multiple-choice questions.
- These questions must be designed to evaluate different skills and abilities relevant to the user's SPECIFIC SPORT AND GOALS.
  - For example, if the sport is "Calisthenics" and goals are "learn planche", you must ask about pushing strength (dips), pulling strength (pull-ups), core strength, and a specific question about their current planche progression (e.g., "How long can you hold a tuck planche?").
  - For "Running" with a goal of "run a 10k", ask about their best 5k time, weekly mileage, and leg strength (e.g., "How many squats can you do?").
- The questions MUST be returned in the \`assessmentQuestions\` field as an array of JSON objects, each with a "question" and an array of "options".
- Example for "Calisthenics": \`[{"question": "How many consecutive PULL-UPS can you do?", "options": ["0", "1-5", "6-10", "More than 10"]}, {"question": "How many consecutive DIPS can you do?", "options": ["0-5", "6-15", "16-25", "More than 25"]}, ...]\`
- If you generate questions, DO NOT generate a routine. The 'routine' and 'structuredRoutine' fields must be empty.

- **IF the 'fitnessAssessment' field contains answers to your previously generated questions**, you have enough information. Generate a full, detailed routine.
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

