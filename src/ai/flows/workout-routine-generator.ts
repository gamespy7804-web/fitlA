
'use server';

/**
 * @fileOverview Workout routine generator flow.
 *
 * - generateWorkoutRoutine - A function that generates a personalized workout routine.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { WorkoutRoutineOutputSchema, WorkoutRoutineInputSchema, type WorkoutRoutineOutput, type WorkoutRoutineInput } from './types';


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

{{#if skills}}
**CRITICAL: Skill-Based Progression (Highest Priority):**
The user wants to learn the following specific skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
Your primary objective is to create a routine that builds the necessary strength, mobility, and technique to achieve these skills.
- Structure the entire plan around progressions for these skills.
- For a 'beginner' user, start with the most basic progressions (e.g., 'Tuck Planche', 'Tuck Front Lever', scapular pulls).
- For 'intermediate' or 'advanced' users, select more difficult progressions (e.g., 'Straddle Planche', 'Single-Leg Front Lever').
- If multiple skills are selected, create a balanced routine (e.g., Push-Pull split) that addresses all of them.
{{/if}}


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
    -   Set 'requiresFeedback' to true ONLY for complex, high-injury-risk, free-weight or calisthenics skill-progression exercises (e.g., Squats, Deadlifts, Bench Press, Planche, Front Lever). It should be false for machine exercises, simple bodyweight exercises, or simple movements.
    -   Set 'requiresWeight' to true for any exercise that requires external weights (dumbbells, barbells, machines) and false for bodyweight or cardio exercises.
6.  **YouTube Query Generation**: For EACH exercise, generate a concise and effective 'youtubeQuery' in the user's specified language ({{language}}) that exactly matches the exercise name to find a high-quality tutorial video. Example for squats in Spanish: "como hacer sentadillas correctamente". If the exercise name is "Tuck Planche", the query must be "como hacer tuck planche".
7.  **Specific Exercise Naming**: Each exercise 'name' MUST be specific and singular (e.g., "Barbell Squat", "Tuck Planche", "Diamond Push-up"). Do NOT use generic category names or list multiple progressions in one name. For example, do NOT use "Front Lever Progressions". Instead, you must choose ONE specific progression suitable for the user, like "Tuck Front Lever". Be decisive. This is critical for the skill validation system.
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
