
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
    input: { schema: TriviaInputSchema },
    output: { schema: TriviaOutputSchema },
    prompt: `Eres un experto en fitness y nutrición deportiva. Tu tarea es generar una serie de 5 a 10 preguntas de trivia del tipo "Mito o Realidad" en español, enfocadas en el deporte: {{{sport}}}.

    Para cada pregunta:
    1.  Crea una 'statement' (afirmación) que sea un mito común o un hecho interesante sobre entrenamiento, técnica o nutrición relacionado con ese deporte.
    2.  Establece 'isMyth' en 'true' si la afirmación es un mito, o en 'false' si es una realidad (un hecho).
    3.  Escribe una 'explanation' (explicación) clara y concisa (1-3 frases) que aclare por qué la afirmación es un mito o una realidad, proporcionando contexto útil.

    Ejemplo para el deporte "Correr":
    - statement: "Estirar antes de correr previene lesiones."
    - isMyth: true
    - explanation: "Mito. El estiramiento estático antes de correr puede reducir el rendimiento. Es mejor hacer un calentamiento dinámico y estirar después de la actividad para mejorar la flexibilidad."

    Genera el array de preguntas.
    `,
});

const triviaFlow = ai.defineFlow(
    {
        name: 'triviaFlow',
        inputSchema: TriviaInputSchema,
        outputSchema: TriviaOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

