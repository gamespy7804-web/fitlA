
'use server';
/**
 * @fileOverview This file defines a Genkit flow for a fitness debate game.
 *
 * - startOrContinueDebate - A function that handles the AI's response in a debate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DebateInputSchema, DebateOutputSchema, type DebateInput, type DebateOutput } from './types';

export async function startOrContinueDebate(input: DebateInput): Promise<DebateOutput> {
  return debateFlow(input);
}

const debateFlow = ai.defineFlow(
  {
    name: 'debateFlow',
    inputSchema: DebateInputSchema,
    outputSchema: DebateOutputSchema,
  },
  async ({ topic, userStance, history, language }) => {
    
    const historyText = history && history.length > 0 
        ? `\n\nDEBATE HISTORY:\n${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
        : '';
    
    const prompt = `You are an AI designed to engage in a friendly but challenging debate on fitness and nutrition topics. Your personality is witty, slightly sarcastic, and you enjoy playing devil's advocate. Your goal is not just to disagree, but to make the user think critically about their point of view.
Your response MUST be in the user's selected language: ${language}.

DEBATE RULES:
1.  Take the OPPOSITE stance to the user. If they are FOR the topic, you are AGAINST it, and vice-versa.
2.  Your first response should be a strong, concise opening statement (2-3 sentences) that clearly states your opposing position and why.
3.  In subsequent responses, directly address the user's last point and provide a counter-argument. Use evidence (real or plausible-sounding) to support your claims.
4.  Keep your responses concise and to the point.
5.  Maintain your persona: be clever, a bit cheeky, but always respectful. Don't be a pushover.

---
DEBATE TOPIC: "${topic}"

USER'S INITIAL STANCE: "${userStance}"
${historyText}

Your task is to generate the next response from the AI's perspective.
`;

    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      config: {
        temperature: 0.8, // Be more creative and less predictable
      },
    });

    return { response: text };
  }
);
