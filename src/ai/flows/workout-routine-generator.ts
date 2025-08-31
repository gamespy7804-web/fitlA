
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
import { PhysiqueAnalysisOutputSchema } from './physique-analyst-generator';


const WorkoutRoutineInputSchema = z.object({
  goals: z
    .string()
    .describe('The user goals, e.g., lose weight, gain muscle, improve endurance'),
  sport: z.string().describe('The sport the user is training for.'),
  fitnessLevel: z.string().describe('The current fitness level of the user (beginner, intermediate, advanced).'),
  equipment: z.array(z.string()).optional().describe("A list of available equipment for the user. If the list contains only 'none', the user has no equipment. If it contains 'gym', the user has full gym access."),
  age: z.coerce.number().optional().describe("The user's age."),
  weight: z.coerce.number().optional().describe("The user's weight in kg."),
  gender: z.string().optional().describe("The user's gender."),
  trainingDays: z.coerce.number().optional().describe("How many days per week the user wants to train."),
  trainingDuration: z.coerce.number().optional().describe("How long each training session should be in minutes."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
  physiqueAnalysis: PhysiqueAnalysisOutputSchema.optional().describe("An optional analysis of the user's physique, including scores and feedback. This should be used to tailor the routine.")
});
export type WorkoutRoutineInput = z.infer<typeof WorkoutRoutineInputSchema>;

export async function generateWorkoutRoutine(input: WorkoutRoutineInput): Promise<WorkoutRoutineOutput> {
  return workoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutRoutinePrompt',
  input: {schema: z.object({
    ...WorkoutRoutineInputSchema.shape,
    equipmentList: z.string(),
  })},
  output: {schema: WorkoutRoutineOutputSchema},
  prompt: `You are an expert sports trainer and physiologist, specializing in generating safe, effective, and personalized training routines.
Your responses MUST be in the user's specified language: {{language}}.

Your task is to generate a full, detailed, structured training plan based on the user's provided information.
The output format MUST always be a 'structuredRoutine'. Do NOT use the 'routine' or 'isWeightTraining' fields.

**User Information:**
- Sport: {{{sport}}}
- Goals: {{{goals}}}
- Stated Fitness Level: {{{fitnessLevel}}}
- Available Equipment: {{{equipmentList}}}
- Age: {{{age}}}
- Weight: {{{weight}}} kg
- Gender: {{{gender}}}
- Training days per week: {{{trainingDays}}}
- Training duration per session: {{{trainingDuration}}} minutes

**CRITICAL: Equipment Constraints:**
- The generated routine MUST ONLY use exercises that can be performed with the user's available equipment.
- If the equipment list is 'Full Gym Access', you can use any standard commercial gym equipment.
- If the equipment list is 'none' or empty, you MUST generate a routine based exclusively on bodyweight exercises.
- Do NOT suggest exercises that require equipment the user does not have.

{{#if physiqueAnalysis}}
**CRITICAL: Physique Analysis Data (Use this to customize the plan):**
- **Potential Score:** {{physiqueAnalysis.potentialScore}}/10
- **Body Fat % (est.):** {{physiqueAnalysis.bodyFatPercentage}}%
- **Symmetry Score:** {{physiqueAnalysis.symmetryScore}}/10
- **Genetics Score:** {{physiqueAnalysis.geneticsScore}}/10
- **AI Feedback:** "{{physiqueAnalysis.feedback}}"

Based on this analysis, you MUST tailor the workout plan. For example, if the symmetry score is low due to underdeveloped legs, the routine should include more leg volume. If the feedback mentions weak shoulders, add specific shoulder exercises. Use the feedback as a primary guide for exercise selection and volume distribution.
{{/if}}

**Action: Generate a full, detailed, structured weekly routine.**

**CRITICAL INSTRUCTIONS:**
1.  **Structured Output ONLY**: You MUST generate a detailed plan in the 'structuredRoutine' field. The 'routine' and 'isWeightTraining' fields are deprecated and must not be used.
2.  **Adherence to Constraints**: The plan MUST strictly adhere to the user's 'trainingDays', 'trainingDuration', and 'equipment' constraints.
3.  **Weekly Structure**: Organize the training days logically throughout the week to allow for adequate muscle recovery. Avoid scheduling two high-intensity workouts for the same muscle group on consecutive days.
4.  **Warm-up and Cool-down**: EACH daily workout MUST begin with a specific 'Warm-up' phase (3-5 minutes of light cardio and dynamic stretches) and end with a 'Cool-down' phase (3-5 minutes of static stretches for the muscles worked). These should be included as exercises in the list. For warm-up/cool-down exercises, set 'reps' to a duration string (e.g., "60 sec").
5.  **Exercise Selection**:
    -   Set 'requiresFeedback' to true ONLY for complex, high-injury-risk, free-weight exercises (e.g., Squats, Deadlifts, Bench Press, Olympic Lifts). It should be false for machine exercises, bodyweight exercises, or simple movements.
    -   Set 'requiresWeight' to true for any exercise that requires external weights (dumbbells, barbells, machines) and false for bodyweight or cardio exercises.
6.  **YouTube Query Generation**: For EACH exercise, generate a concise and effective 'youtubeQuery' in the user's specified language ({{language}}) that exactly matches the exercise name to find a high-quality tutorial video. Example for squats in Spanish: "como hacer sentadillas correctamente". If the exercise name is "Tuck Planche", the query must be "como hacer tuck planche".
7.  **Specific Exercise Naming**: Each exercise 'name' MUST be specific and singular (e.g., "Barbell Squat", "Tuck Planche", "Diamond Push-up"). Do NOT use generic category names or list multiple progressions in one name. For example, do NOT use "Front Lever Progressions". Instead, you must choose ONE specific progression suitable for the user, like "Tuck Front Lever". Be decisive.
8.  **Safety First**: Prioritize safety and proper form. The routines should be designed to minimize injury risk.
  `,
});

const workoutRoutineFlow = ai.defineFlow(
  {
    name: 'workoutRoutineFlow',
    inputSchema: WorkoutRoutineInputSchema,
    outputSchema: WorkoutRoutineOutputSchema,
  },
  async input => {
    let equipmentList = 'none';
    if (input.equipment && input.equipment.length > 0) {
      if (input.equipment.includes('gym')) {
        equipmentList = 'Full Gym Access';
      } else if (input.equipment.length === 1 && input.equipment[0] === 'none') {
        equipmentList = 'none';
      } else {
        equipmentList = input.equipment.join(', ');
      }
    }
    
    const {output} = await prompt({
      ...input,
      equipmentList,
    });
    return output!;
  }
);
