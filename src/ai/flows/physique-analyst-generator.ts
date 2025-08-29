'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's physique from a photo.
 *
 * - analyzePhysique - A function that provides an analysis of potential, body fat, symmetry, and genetics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PhysiqueAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user's physique, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe("The user's selected language (e.g., 'en', 'es')."),
});
export type PhysiqueAnalysisInput = z.infer<typeof PhysiqueAnalysisInputSchema>;

export const PhysiqueAnalysisOutputSchema = z.object({
  potentialScore: z.number().min(0).max(10).describe("A score from 0 to 10 representing the user's overall muscle-building potential based on their frame and current state."),
  bodyFatPercentage: z.number().min(0).max(100).describe("An estimated body fat percentage based on visual analysis."),
  symmetryScore: z.number().min(0).max(10).describe("A score from 0 to 10 evaluating the muscular symmetry and balance between different body parts."),
  geneticsScore: z.number().min(0).max(10).describe("An estimated score from 0 to 10 for genetic potential, considering factors like muscle insertions and bone structure."),
  averageScore: z.number().min(0).max(10).describe("The average of the potential, symmetry, and genetics scores."),
  feedback: z.string().describe("Concise, actionable feedback for the user, highlighting strengths and areas for improvement based on the analysis."),
});
export type PhysiqueAnalysisOutput = z.infer<typeof PhysiqueAnalysisOutputSchema>;


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
