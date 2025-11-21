'use server';

/**
 * @fileOverview Identity Embedding Generator (Simplified)
 * 
 * WORKAROUND: Genkit's embed API doesn't support multimodal content.
 * This simplified version uses Gemini Vision to generate text descriptions
 * of faces, then embeds those descriptions as a proxy for face embeddings.
 * 
 * Future improvement: Use dedicated face recognition API or wait for Genkit multimodal embeddings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIdentityEmbeddingInputSchema = z.object({
    referenceFrames: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
            'Array of reference face images as data URIs. Should include diverse angles and lighting.'
        ),
});

export type GenerateIdentityEmbeddingInput = z.infer<typeof GenerateIdentityEmbeddingInputSchema>;

const GenerateIdentityEmbeddingOutputSchema = z.object({
    embedding: z.array(z.number()).describe('Identity embedding vector (text-based proxy)'),
    faceDescription: z.string().describe('Detailed text description of the face'),
    consistencyScore: z.number().min(0).max(1).describe('Consistency score (placeholder: 1.0)'),
    canonicalFrameIndex: z.number().describe('Index of the best reference frame'),
});

export type GenerateIdentityEmbeddingOutput = z.infer<typeof GenerateIdentityEmbeddingOutputSchema>;

export async function generateIdentityEmbedding(
    input: GenerateIdentityEmbeddingInput
): Promise<GenerateIdentityEmbeddingOutput> {
    return generateIdentityEmbeddingFlow(input);
}

const faceDescriptionPrompt = ai.definePrompt({
    name: 'faceDescriptionPrompt',
    input: {
        schema: z.object({
            imageDataUri: z.string(),
        }),
    },
    output: {
        schema: z.object({
            description: z.string().describe('Detailed description of facial features'),
        }),
    },
    prompt: `Analyze this facial photograph and provide a detailed, objective description of the person's distinctive facial features. Focus on:
- Face shape and structure
- Eye shape, color, and spacing
- Nose shape and size
- Mouth and lip characteristics
- Skin tone and texture
- Hair color and style
- Any distinctive features (freckles, moles, etc.)
- Overall facial proportions

Be precise and detailed. This description will be used for identity consistency.

Image: {{media url=imageDataUri}}`,
});

const generateIdentityEmbeddingFlow = ai.defineFlow(
    {
        name: 'generateIdentityEmbeddingFlow',
        inputSchema: GenerateIdentityEmbeddingInputSchema,
        outputSchema: GenerateIdentityEmbeddingOutputSchema,
    },
    async (input) => {
        // Use the first frame as canonical (in a real implementation, we'd analyze all)
        const canonicalFrameIndex = 0;
        const canonicalFrame = input.referenceFrames[canonicalFrameIndex];

        // Generate detailed face description using Gemini Vision
        const { output: descriptionOutput } = await faceDescriptionPrompt({
            imageDataUri: canonicalFrame,
        });

        const faceDescription = descriptionOutput!.description;

        // Generate text embedding from the description
        const embeddingResult = await ai.embed({
            embedder: 'googleai/text-embedding-004',
            content: faceDescription,
        });

        const embedding = embeddingResult[0].embedding;

        return {
            embedding,
            faceDescription,
            consistencyScore: 1.0, // Placeholder - would need multiple frames to calculate
            canonicalFrameIndex,
        };
    }
);
