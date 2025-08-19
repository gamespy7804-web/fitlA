'use server';
/**
 * @fileOverview This file defines a Genkit flow for a conversational chatbot.
 *
 * - chat - A function that takes conversation history and a new question, and returns an AI-generated response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  question: z.string().describe('The user\'s latest question.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, question }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
user: ${question}`,
      config: {
        // You can add safety settings or other configurations here
      },
      system: `You are TrainSmart AI, a friendly and knowledgeable fitness assistant.
Your role is to help users of the TrainSmart AI application with their fitness journey.
Answer questions about fitness, nutrition, workout plans, and how to use the app's features.
Keep your answers concise, helpful, and encouraging. Your responses should be in Spanish.`,
    });

    return { answer: text };
  }
);
