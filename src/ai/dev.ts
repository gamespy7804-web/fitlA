'use server';
/**
 * @fileOverview This file imports all the Genkit flows that are used in the application.
 * It is used by the Genkit CLI to start the development server.
 */
import { config } from 'dotenv';
config();

import '@/ai/flows/workout-routine-generator.ts';
import '@/ai/flows/adaptive-progression-generator.ts';
import '@/ai/flows/real-time-feedback-generator.ts';
import '@/ai/flows/performance-analyst-generator.ts';
import '@/ai/flows/chatbot-flow.ts';
