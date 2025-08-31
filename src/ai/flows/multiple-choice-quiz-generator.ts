
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating multiple choice quiz questions about fitness.
 *
 * - generateMultipleChoiceQuiz - A function that generates a set of multiple choice quiz questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MultipleChoiceQuizInputSchema, MultipleChoiceQuizOutputSchema, type MultipleChoiceQuizInput, type MultipleChoiceQuizOutput } from './types';


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
