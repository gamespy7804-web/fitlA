
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating trivia questions about fitness.
 *
 * - generateTrivia - A function that generates a set of myth/fact trivia questions.
 * - TriviaInput - The input type for the trivia generator function.
 * - TriviaOutput - The return type for the trivia generator function.
 * - TriviaQuestion - A single trivia question object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TriviaInputSchema = z.object({
  sport: z.string().describe('The sport to generate trivia questions about. Should be broad, e.g., "powerlifting", "running", "general fitness".'),
  history: z.string().optional().describe("A JSON string of previously answered questions and whether the user was correct. Used to generate more advanced or targeted questions.")
});
export type TriviaInput = z.infer<typeof TriviaInputSchema>;

const TriviaQuestionSchema = z.object({
    statement: z.string().describe("The statement to be evaluated as a myth or fact."),
    isMyth: z.boolean().describe("True if the statement is a myth, false if it's a fact."),
    explanation: z.string().describe("A concise explanation of why the statement is a myth or a fact."),
});
export type TriviaQuestion = z.infer<typeof TriviaQuestionSchema>;


const TriviaOutputSchema = z.object({
  questions: z.array(TriviaQuestionSchema).describe('A list of 5-10 trivia questions.'),
});
export type TriviaOutput = z.infer<typeof TriviaOutputSchema>;

export async function generateTrivia(input: TriviaInput): Promise<TriviaOutput> {
    return triviaFlow(input);
}

const prompt = ai.definePrompt({
    name: 'triviaPrompt',
    input: { schema: z.object({ sport: z.string(), historyText: z.string() }) },
    output: { schema: TriviaOutputSchema },
    prompt: `Eres un experto tutor de fitness y nutrición deportiva. Tu tarea es generar una serie de 5 a 10 preguntas de trivia del tipo "Mito o Realidad" en español, enfocadas en el deporte: {{{sport}}}. Tu objetivo es crear una experiencia de aprendizaje adaptativa. Si se proporciona un historial de respuestas, analiza las respuestas anteriores del usuario para ajustar la dificultad y los temas de las nuevas preguntas, sin repetir preguntas del historial. Si el historial está vacío, genera una mezcla de preguntas de nivel principiante a intermedio para establecer una línea base. Para cada pregunta, proporciona un 'statement', un booleano 'isMyth' y una 'explanation' concisa (1-3 frases). {{{historyText}}}
Genera el array de preguntas.`,
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
            historyText = `\nHistorial de respuestas del usuario para tu análisis: \`\`\`json\n${input.history}\n\`\`\``;
        }

        const { output } = await prompt({
            sport: input.sport,
            historyText: historyText,
        });
        return output!;
    }
);
