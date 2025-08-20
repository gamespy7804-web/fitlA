
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
  history: z.string().optional().describe("A JSON string of previously answered questions and whether the user was correct. Used to generate more advanced or targeted questions.")
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
    input: { schema: MultipleChoiceQuizInputSchema },
    output: { schema: MultipleChoiceQuizOutputSchema },
    prompt: `Eres un experto tutor de fitness y nutrición deportiva. Tu tarea es generar una serie de 5 a 10 preguntas de trivia de opción múltiple en español, enfocadas en el deporte: {{{sport}}}. Tu objetivo es crear una experiencia de aprendizaje adaptativa. Si el campo 'history' está vacío o no se proporciona, genera una mezcla de preguntas de nivel principiante a intermedio para establecer una línea base. Si se proporciona 'history', analiza las respuestas anteriores del usuario para ajustar la dificultad y los temas de las nuevas preguntas, sin repetir preguntas del historial. Para cada pregunta, proporciona una 'question', un array 'options' de 4 respuestas, el 'correctAnswerIndex' (0-3) y una 'explanation' concisa de la respuesta correcta.
{{#if history}}Historial de respuestas del usuario para tu análisis: \`\`\`json{{{history}}}\`\`\`{{/if}}
Genera el array de preguntas.`,
});

const multipleChoiceQuizFlow = ai.defineFlow(
    {
        name: 'multipleChoiceQuizFlow',
        inputSchema: MultipleChoiceQuizInputSchema,
        outputSchema: MultipleChoiceQuizOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
