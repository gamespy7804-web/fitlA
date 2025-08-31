
import { z } from 'zod';

// Common Schemas
export const ExerciseDetailSchema = z.object({
  name: z.string().describe('Name of the exercise.'),
  sets: z.string().describe('Number of sets.'),
  reps: z.string().describe('Number of repetitions (e.g., "8-12") or a duration in seconds (e.g., "30 sec").'),
  rest: z.string().describe('Rest time between sets.'),
  requiresFeedback: z.boolean().describe('Whether this exercise requires video feedback for form correction.'),
  requiresWeight: z.boolean().describe('Whether this exercise requires weight to be logged.'),
  youtubeQuery: z.string().describe('A YouTube search query for a tutorial video of the exercise.'),
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
  structuredRoutine: z
    .array(DailyWorkoutSchema)
    .optional()
    .describe('A structured workout routine. This should always be populated.'),
});
export type WorkoutRoutineOutput = z.infer<typeof WorkoutRoutineOutputSchema>;


// Chatbot Schemas
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  question: z.string().describe('The user\'s latest question.'),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es').")
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


// Physique Analyst Schemas
export const PhysiqueAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user's physique, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type PhysiqueAnalysisInput = z.infer<typeof PhysiqueAnalysisInputSchema>;

export const PhysiqueAnalysisOutputSchema = z.object({
  potentialScore: z.number().min(0).max(10).describe("A score from 0 to 10 representing the user's overall muscle-building potential based on their frame and current state."),
  bodyFatPercentage: z.number().min(0).max(100).describe("An estimated body fat percentage based on visual analysis."),
  symmetryScore: z.number().min(0).max(10).describe("A score from 0 to 10 evaluating the muscular symmetry and balance between different body parts."),
  geneticsScore: z.number().min(0).max(10).describe("An estimated score from 0 to 10 for genetic potential, considering factors like muscle insertions and bone structure."),
  averageScore: z.number().min(0).max(10).describe("The average of the potential, symmetry, and genetics scores."),
  feedback: z.string().describe("Concise, actionable feedback for the user, highlighting strengths and areas for improvement based on the analysis."),
});
export type PhysiqueAnalysisOutput = z.infer<typeof PhysiqueAnalysisOutputSchema>;

// Multiple Choice Quiz Schemas
export const MultipleChoiceQuizInputSchema = z.object({
  sport: z.string().describe('The sport to generate quiz questions about. Should be broad, e.g., "powerlifting", "running", "general fitness".'),
  history: z.string().optional().describe("A JSON string of previously answered questions and whether the user was correct. Used to generate more advanced or targeted questions."),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional().default('normal').describe("The desired difficulty for the new quiz questions."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type MultipleChoiceQuizInput = z.infer<typeof MultipleChoiceQuizInputSchema>;

export const MultipleChoiceQuestionSchema = z.object({
    question: z.string().describe("The multiple choice question."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The index of the correct answer in the 'options' array."),
    explanation: z.string().describe("A concise explanation of why the answer is correct."),
});
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

export const MultipleChoiceQuizOutputSchema = z.object({
  questions: z.array(MultipleChoiceQuestionSchema).describe('A list of 5-10 multiple choice questions.'),
});
export type MultipleChoiceQuizOutput = z.infer<typeof MultipleChoiceQuizOutputSchema>;


// Trivia Schemas
export const TriviaInputSchema = z.object({
  sport: z.string().describe('The sport to generate trivia questions about. Should be broad, e.g., "powerlifting", "running", "general fitness".'),
  history: z.string().optional().describe("A JSON string of previously answered questions and whether the user was correct. Used to generate more advanced or targeted questions."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type TriviaInput = z.infer<typeof TriviaInputSchema>;

export const TriviaQuestionSchema = z.object({
    statement: z.string().describe("The statement to be evaluated as a myth or fact."),
    isMyth: z.boolean().describe("True if the statement is a myth, false if it's a fact."),
    explanation: z.string().describe("A concise explanation of why the statement is a myth or a fact."),
});
export type TriviaQuestion = z.infer<typeof TriviaQuestionSchema>;

export const TriviaOutputSchema = z.object({
  questions: z.array(TriviaQuestionSchema).describe('A list of 5-10 trivia questions.'),
});
export type TriviaOutput = z.infer<typeof TriviaOutputSchema>;

// Performance Analyst Schemas
export const PerformanceAnalystInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string of an array of completed workout logs. Each log contains the exercises, sets, reps, and weight completed by the user.'
    ),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type PerformanceAnalystInput = z.infer<typeof PerformanceAnalystInputSchema>;

export const PerformanceAnalystOutputSchema = z.object({
  analysis: z.string().describe("A concise analysis of the user's performance, highlighting strengths, weaknesses, and the proposed training methodology for the next cycle."),
});
export type PerformanceAnalystOutput = z.infer<typeof PerformanceAnalystOutputSchema>;

// Real-Time Feedback Schemas
export const RealTimeFeedbackInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A video of the user performing an exercise, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  exerciseType: z.string().describe('The type of exercise being performed.'),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type RealTimeFeedbackInput = z.infer<typeof RealTimeFeedbackInputSchema>;

export const FeedbackPointSchema = z.object({
    point: z.string().describe('A one-sentence description of the mistake or point of feedback (e.g., "Your hips are rising faster than your chest.")'),
    correction: z.string().describe('A brief explanation of why this is a problem and a clear, actionable instruction on how to fix it (e.g., "This puts strain on your lower back. Focus on lifting your chest and hips at the same rate.")'),
    summary: z.string().describe("A very short (2-3 word) summary of the feedback point. E.g., 'Hip Rise', 'Back Arch', 'Knee Valgus'"),
});

export const RealTimeFeedbackOutputSchema = z.object({
  isCorrect: z.boolean().describe("Set to true if the user's form is perfect and there are no corrections to be made. Otherwise, set to false."),
  feedback: z.array(FeedbackPointSchema).describe('An array of specific, actionable feedback points on the user\'s exercise form. If the form is correct, this array can be empty.'),
});
export type RealTimeFeedbackOutput = z.infer<typeof RealTimeFeedbackOutputSchema>;

// Adaptive Progression Schemas
export const AdaptiveProgressionInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string of an array of completed workout logs. Each log contains the exercises, sets, reps, and weight completed by the user.'
    ),
  adherence: z
    .number()
    .describe('The percentage of workouts completed by the user in the last cycle (e.g., 0.8 for 80%).'),
  selfReportedFitness: z
    .string()
    .describe(
      'The user\'s self-reported fitness level after the last cycle (e.g., "easy", "just right", "hard").'
    ),
  originalRoutine: z.string().describe("The user's original workout routine, used as a baseline for the new progression."),
  trainingDays: z.coerce.number().optional().describe("How many days per week the user wants to train for the new cycle."),
  trainingDuration: z.coerce.number().optional().describe("How long each training session should be in minutes for the new cycle."),
  userFeedback: z.string().optional().describe("Free-text feedback from the user about the last cycle and what they'd like to change."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type AdaptiveProgressionInput = z.infer<typeof AdaptiveProgressionInputSchema>;


// Workout Routine Generator Schemas
export const WorkoutRoutineInputSchema = z.object({
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

// Debate Game Schemas
export const DebateMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type DebateMessage = z.infer<typeof DebateMessageSchema>;

export const DebateInputSchema = z.object({
  topic: z.string().describe('The topic of the debate.'),
  userStance: z.string().describe("The user's initial stance or argument on the topic."),
  history: z.array(DebateMessageSchema).optional().describe('The conversation history of the debate.'),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es').")
});
export type DebateInput = z.infer<typeof DebateInputSchema>;

export const DebateOutputSchema = z.object({
  response: z.string().describe("The AI's counter-argument or response in the debate."),
});
export type DebateOutput = z.infer<typeof DebateOutputSchema>;
