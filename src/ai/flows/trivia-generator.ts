
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating trivia questions about fitness.
 *
 * - generateTrivia - A function that generates a set of myth/fact trivia questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TriviaInputSchema, TriviaOutputSchema, type TriviaInput, type TriviaOutput } from './types';


export async function generateTrivia(input: TriviaInput): Promise<TriviaOutput> {
    return triviaFlow(input);
}

const prompt = ai.definePrompt({
    name: 'triviaPrompt',
    input: { schema: z.object({ sport: z.string(), historyText: z.string(), language: z.string() }) },
    output: { schema: TriviaOutputSchema },
    prompt: `You are an expert fitness and sports nutrition tutor. Your task is to generate a series of 5-10 "Myth or Fact" trivia questions, focused on the sport: {{{sport}}}.
Your response MUST be in the user's selected language: {{{language}}}.
Your goal is to create an adaptive learning experience. If a response history is provided, analyze the user's previous answers to adjust the difficulty and topics of new questions, without repeating questions from the history. If the history is empty, generate a mix of beginner to intermediate questions to establish a baseline. For each question, provide a 'statement', a boolean 'isMyth', and a concise 'explanation' (1-3 sentences). {{{historyText}}}
Generate the array of questions.`,
});

const triviaFlow = ai.defineFlow(
    {
        name: 'triviaFlow',
        inputSchema: TriviaInputSchema,
        outputSchema: TriviaOutputSchema,
    },
    async (input) => {
        let historyText = "";
        if (input.history) {
            historyText = `\nUser's answer history for your analysis: \`\`\`json\n${input.history}\n\`\`\``;
        }

        const { output } = await prompt({
            sport: input.sport,
            historyText: historyText,
            language: input.language
        });
        return output!;
    }
);
