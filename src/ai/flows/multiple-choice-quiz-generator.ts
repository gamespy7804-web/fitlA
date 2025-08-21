
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating multiple choice quiz questions about fitness.
 *
 * - generateMultipleChoiceQuiz - A function that generates a set of multiple choice quiz questions.
 * - MultipleChoiceQuizInput - The input type for the quiz generator function.
 * - MultipleChoiceQuizOutput - The return type for the quiz generator function.
 * - MultipleChoiceQuestion - A single quiz question object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MultipleChoiceQuizInputSchema = z.object({
  sport: z.string().describe('The sport to generate quiz questions about. Should be broad, e.g., "powerlifting", "running", "general fitness".'),
  history: z.string().optional().describe("A JSON string of previously answered questions and whether the user was correct. Used to generate more advanced or targeted questions."),
  difficulty: z.enum(['easy', 'normal', 'hard']).optional().default('normal').describe("The desired difficulty for the new quiz questions."),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type MultipleChoiceQuizInput = z.infer<typeof MultipleChoiceQuizInputSchema>;

const MultipleChoiceQuestionSchema = z.object({
    question: z.string().describe("The multiple choice question."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The index of the correct answer in the 'options' array."),
    explanation: z.string().describe("A concise explanation of why the answer is correct."),
});
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;


const MultipleChoiceQuizOutputSchema = z.object({
  questions: z.array(MultipleChoiceQuestionSchema).describe('A list of 5-10 multiple choice questions.'),
});
export type MultipleChoiceQuizOutput = z.infer<typeof MultipleChoiceQuizOutputSchema>;

export async function generateMultipleChoiceQuiz(input: MultipleChoiceQuizInput): Promise<MultipleChoiceQuizOutput> {
    return multipleChoiceQuizFlow(input);
}

const prompt = ai.definePrompt({
    name: 'multipleChoiceQuizPrompt',
    input: { schema: z.object({ sport: z.string(), historyText: z.string(), difficulty: z.string(), language: z.string() }) },
    output: { schema: MultipleChoiceQuizOutputSchema },
    prompt: `You are an expert fitness and sports nutrition tutor. Your task is to generate a series of 5 to 10 multiple-choice trivia questions, focused on the sport: {{{sport}}}.
The requested difficulty level for this quiz is: {{{difficulty}}}.
Your response MUST be in the user's selected language: {{{language}}}.
Your goal is to create an adaptive learning experience. If a response history is provided, analyze the user's previous answers to adjust the difficulty and topics of the new questions, without repeating questions from the history. If the history is empty, generate a mix of beginner to intermediate questions to establish a baseline. For each question, provide a 'question', an array 'options' of 4 answers, the 'correctAnswerIndex' (0-3), and a concise 'explanation' of the correct answer. {{{historyText}}}
Generate the array of questions.`,
});

const multipleChoiceQuizFlow = ai.defineFlow(
    {
        name: 'multipleChoiceQuizFlow',
        inputSchema: MultipleChoiceQuizInputSchema,
        outputSchema: MultipleChoiceQuizOutputSchema,
    },
    async (input) => {
        let historyText = "";
        if (input.history) {
            historyText = `\nUser's answer history for your analysis: \`\`\`json\n${input.history}\n\`\`\``;
        }

        const { output } = await prompt({
            sport: input.sport,
            historyText: historyText,
            difficulty: input.difficulty || 'normal',
            language: input.language
        });
        return output!;
    }
);
