
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's physique from a photo.
 *
 * - analyzePhysique - A function that provides an analysis of potential, body fat, symmetry, and genetics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PhysiqueAnalysisInputSchema, PhysiqueAnalysisOutputSchema, type PhysiqueAnalysisInput, type PhysiqueAnalysisOutput } from './types';


export async function analyzePhysique(input: PhysiqueAnalysisInput): Promise<PhysiqueAnalysisOutput> {
    return physiqueAnalysisFlow(input);
}

const prompt = ai.definePrompt({
    name: 'physiqueAnalysisPrompt',
    input: { schema: PhysiqueAnalysisInputSchema },
    output: { schema: PhysiqueAnalysisOutputSchema },
    prompt: `You are a world-class bodybuilding coach and physique analyst. Your task is to analyze a user's physique from a single photograph. Provide an objective, encouraging, and professional evaluation.
Your response MUST be in the user's selected language: {{language}}.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Photo:** Carefully examine the user's photo to assess their current physical state.
2.  **Estimate Metrics:**
    *   **potentialScore:** Evaluate their structural frame (shoulder-to-waist ratio, bone structure) and current muscle mass to estimate their potential for future muscle growth on a scale of 0-10.
    *   **bodyFatPercentage:** Provide a visual estimation of their body fat percentage. Be as accurate as possible.
    *   **symmetryScore:** Assess the balance between muscle groups (e.g., upper vs. lower body, left vs. right side, chest vs. back). Score it from 0-10.
    *   **geneticsScore:** Based on visible muscle insertions (e.g., bicep peaks, calf insertions) and overall structure, estimate their genetic predisposition for bodybuilding on a scale of 0-10.
3.  **Calculate Average:** Compute the average of potential, symmetry, and genetics scores.
4.  **Provide Feedback:** Write a concise (3-5 sentences) feedback paragraph. Start by highlighting a key strength (e.g., "You have a great V-taper potential" or "Your leg development is a solid foundation"). Then, point out the primary area for improvement in a constructive way (e.g., "To enhance your symmetry, focusing on back width would be beneficial."). Address the user directly ("you/your").

**User's Photo for Analysis:** {{media url=photoDataUri}}

Generate the analysis. Be realistic and motivating. Avoid making definitive health claims. Frame your analysis as an estimate based on visual information.
`,
});

const physiqueAnalysisFlow = ai.defineFlow(
    {
        name: 'physiqueAnalysisFlow',
        inputSchema: PhysiqueAnalysisInputSchema,
        outputSchema: PhysiqueAnalysisOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        
        if (!output) {
            throw new Error('The physique analysis returned no output.');
        }

        // Recalculate average server-side to ensure accuracy
        const average = (output.potentialScore + output.symmetryScore + output.geneticsScore) / 3;
        output.averageScore = parseFloat(average.toFixed(1));

        return output;
    }
);
