'use server';

/**
 * @fileOverview Consistency Validator (Simplified)
 * 
 * WORKAROUND: Genkit's embed API doesn't support multimodal content.
 * This simplified version generates a text description of the generated content
 * and compares it against the identity description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateConsistencyInputSchema = z.object({
    generatedContentUri: z
        .string()
        .describe('Generated video or image as data URI to validate'),
    identityEmbedding: z
        .array(z.number())
        .describe('Reference identity embedding (text-based)'),
    identityDescription: z
        .string()
        .optional()
        .describe('Optional text description of the identity for better validation'),
    threshold: z
        .number()
        .min(0)
        .max(1)
        .default(0.85)
        .describe('Minimum similarity threshold for passing'),
});

export type ValidateConsistencyInput = z.infer<typeof ValidateConsistencyInputSchema>;

const ValidateConsistencyOutputSchema = z.object({
    score: z.number().min(0).max(1).describe('Similarity score (0-1)'),
    passed: z.boolean().describe('True if score >= threshold'),
    threshold: z.number(),
    details: z.string().optional().describe('Additional details'),
});

export type ValidateConsistencyOutput = z.infer<typeof ValidateConsistencyOutputSchema>;

export async function validateConsistency(
    input: ValidateConsistencyInput
): Promise<ValidateConsistencyOutput> {
    return validateConsistencyFlow(input);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

const contentDescriptionPrompt = ai.definePrompt({
    name: 'contentDescriptionPrompt',
    input: {
        schema: z.object({
            contentUri: z.string(),
        }),
    },
    output: {
        schema: z.object({
            description: z.string().describe('Description of facial features in the content'),
        }),
    },
    prompt: `Analyze this image/video and provide a detailed description of the person's facial features. Focus on the same aspects as identity descriptions: face shape, eyes, nose, mouth, skin tone, hair, and distinctive features.

Content: {{media url=contentUri}}`,
});

const validateConsistencyFlow = ai.defineFlow(
    {
        name: 'validateConsistencyFlow',
        inputSchema: ValidateConsistencyInputSchema,
        outputSchema: ValidateConsistencyOutputSchema,
    },
    async (input) => {
        try {
            // Generate description of the generated content
            const { output: descriptionOutput } = await contentDescriptionPrompt({
                contentUri: input.generatedContentUri,
            });

            const contentDescription = descriptionOutput!.description;

            // Generate embedding from content description
            const contentEmbeddingResult = await ai.embed({
                embedder: 'googleai/text-embedding-004',
                content: contentDescription,
            });

            const contentEmbedding = contentEmbeddingResult[0].embedding;

            // Calculate similarity
            const score = cosineSimilarity(input.identityEmbedding, contentEmbedding);
            const passed = score >= input.threshold;

            return {
                score,
                passed,
                threshold: input.threshold,
                details: passed
                    ? `Content matches identity with ${(score * 100).toFixed(1)}% similarity`
                    : `Content similarity ${(score * 100).toFixed(1)}% is below threshold ${(input.threshold * 100).toFixed(1)}%`,
            };
        } catch (error: any) {
            console.error('Consistency validation failed:', error);

            return {
                score: 0,
                passed: false,
                threshold: input.threshold,
                details: `Validation error: ${error.message}`,
            };
        }
    }
);
