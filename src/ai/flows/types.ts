import { z } from 'zod';

export const ExerciseDetailSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions (e.g., "8-12") or a duration in seconds (e.g., "30 seg").'),
  rest: z.string().describe('Rest time between sets.'),
  requiresFeedback: z.boolean().describe('Whether this exercise requires video feedback for form correction.'),
  requiresWeight: z.boolean().describe('Whether this exercise requires weight to be logged.'),
});
export type ExerciseDetail = z.infer<typeof ExerciseDetailSchema>;


export const DailyWorkoutSchema = z.object({
  day: z.number().describe('Day of the week for the workout.'),
  title: z.string().describe('Title of the workout for the day.'),
  duration: z.number().describe("The total estimated duration of the workout in minutes."),
  exercises: z.array(ExerciseDetailSchema).describe('List of exercises for the day.'),
});
export type DailyWorkout = z.infer<typeof DailyWorkoutSchema>;

export const WorkoutRoutineOutputSchema = z.object({
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
    .describe('A structured workout routine. Provided if isWeightTraining is false.'),
});
export type WorkoutRoutineOutput = z.infer<typeof WorkoutRoutineOutputSchema>;
