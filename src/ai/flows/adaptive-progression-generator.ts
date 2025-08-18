'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating weekly workout progressions based on user data.
 *
 * - adaptiveProgressionGenerator - A function that generates a weekly workout progression.
 * - AdaptiveProgressionInput - The input type for the adaptiveProgressionGenerator function.
 * - AdaptiveProgressionOutput - The return type for the adaptiveProgressionGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveProgressionInputSchema = z.object({
  trainingData: z
    .string()
    .describe(
      'A JSON string containing the user logged training data including sets, reps and weight.
      Example: `[{\