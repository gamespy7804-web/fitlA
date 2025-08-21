
'use server';
/**
 * @fileOverview This file defines a Genkit flow for a conversational chatbot.
 *
 * - chat - A function that takes conversation history and a new question, and returns an AI-generated response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatInputSchema, ChatOutputSchema, type ChatInput, type ChatOutput } from './types';


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, question, language }) => {
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
Keep your answers concise, helpful, and encouraging. Your response MUST be in the user's selected language: ${language}.`,
    });

    return { answer: text };
  }
);
