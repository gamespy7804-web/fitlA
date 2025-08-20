
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
    prompt: `Eres un experto tutor de fitness y nutrición deportiva. Tu tarea es generar una serie de 5 a 10 preguntas de trivia de opción múltiple en español, enfocadas en el deporte: {{{sport}}}.

    Tu objetivo es crear una experiencia de aprendizaje adaptativa. Analizarás el historial de respuestas del usuario para generar preguntas que se ajusten a su nivel de conocimiento.

    {{#if history}}
    **Historial de Respuestas del Usuario (para tu análisis):**
    \`\`\`json
    {{{history}}}
    \`\`\`

    **Instrucciones para la Progresión:**
    1.  **NO REPITAS PREGUNTAS** del historial.
    2.  **Analiza el historial:** Identifica los temas que el usuario domina (aciertos consistentes) y sus áreas débiles (errores).
    3.  **Crea preguntas más avanzadas:** Para los temas que el usuario domina, introduce conceptos más complejos o matices. Por ejemplo, si sabe sobre la importancia de la proteína, pregúntale sobre tipos de aminoácidos o el concepto de síntesis de proteína muscular.
    4.  **Refuerza las debilidades:** Si el usuario falla en preguntas sobre un músculo específico, genera una nueva pregunta sobre la función de ese músculo o un ejercicio para fortalecerlo.
    5.  **Introduce nuevos temas:** Asegúrate de incluir también temas que no hayan aparecido antes para ampliar su conocimiento.
    {{/if}}

    **Instrucciones (Si no hay historial):**
    -   Genera una mezcla de preguntas de nivel principiante a intermedio para establecer una línea base del conocimiento del usuario.

    **Formato para cada pregunta:**
    1.  Formula una 'question' (pregunta) clara y directa.
    2.  Crea un array 'options' con 4 posibles respuestas. Una debe ser la correcta y las otras 3 deben ser "distractores" plausibles pero incorrectos.
    3.  Establece 'correctAnswerIndex' al índice (0-3) de la respuesta correcta en el array 'options'.
    4.  Escribe una 'explanation' (explicación) clara y concisa que justifique la respuesta correcta.

    Genera el array de preguntas.
    `,
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
