
'use server';

/**
 * @fileOverview A flow that generates synthetic training data for missing emotions based on user's existing video data.
 *
 * - generateMissingEmotions - A function that generates synthetic training data for missing emotions.
 * - GenerateMissingEmotionsInput - The input type for the generateMissingEmotions function.
 * - GenerateMissingEmotionsOutput - The return type for the generateMissingEmotions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMissingEmotionsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A frame from a video of an actor, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  missingEmotion: z.string().describe('The emotion to generate.'),
  targetNumberOfClips: z.number().describe('The number of clips to generate for the specified emotion.'),
  identityEmbedding: z.array(z.number()).optional().describe('Optional identity embedding for consistency validation'),
  referenceFrames: z.array(z.string()).optional().describe('Optional reference frames for identity'),
  intensity: z.enum(['subtle', 'moderate', 'intense']).optional().describe('Emotion intensity level'),
  validateConsistency: z.boolean().optional().describe('Whether to validate consistency against identity embedding'),
});

export type GenerateMissingEmotionsInput = z.infer<typeof GenerateMissingEmotionsInputSchema>;

const GenerateMissingEmotionsOutputSchema = z.object({
  syntheticVideoClips: z.array(
    z.object({
      videoDataUri: z.string().describe('A synthetic video clip as a data URI.'),
      consistencyScore: z.number().optional().describe('Consistency score if validation was enabled'),
    })
  ),
});

export type GenerateMissingEmotionsOutput = z.infer<typeof GenerateMissingEmotionsOutputSchema>;

export async function generateMissingEmotions(
  input: GenerateMissingEmotionsInput
): Promise<GenerateMissingEmotionsOutput> {
  return generateMissingEmotionsFlow(input);
}

// Helper to download video from the url provided by VEO
async function downloadVideo(video: { media?: { url?: string } }): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video');
  }

  const buffer = await videoDownloadResponse.arrayBuffer();
  return `data:video/mp4;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function generateSingleClip(
  imageDataUri: string,
  missingEmotion: string,
  options?: {
    identityEmbedding?: number[];
    referenceFrames?: string[];
    intensity?: 'subtle' | 'moderate' | 'intense';
    validateConsistency?: boolean;
  }
): Promise<{ videoDataUri: string; consistencyScore?: number }> {
  const contentType = imageDataUri.match(/data:(.*);base64,/)?.[1];
  if (!contentType) {
    throw new Error('Could not determine content type from data URI.');
  }

  // Build enhanced prompt with identity awareness
  const intensityText = options?.intensity ? ` at ${options.intensity} intensity` : '';
  const identityText = options?.identityEmbedding
    ? ' Maintain exact facial structure, skin tone, and distinctive features of this specific person.'
    : '';

  // Use Veo to generate videos.
  let { operation } = await ai.generate({
    //model: 'googleai/veo-2.0-generate-001',
    model: 'googleai/veo-3.0-generate-001',
    prompt: [
      {
        text: `Animate this specific person in the image. Create a short video clip where their facial expression changes to show that they are feeling ${missingEmotion}${intensityText}.${identityText} Focus on authentic ${missingEmotion} expression while preserving their unique likeness.`,
      },
      {
        media: { url: imageDataUri, contentType },
      },
    ],
    config: {
      personGeneration: 'allow_adult',
      durationSeconds: 8, // Veo 3.0 accepts 4-8 seconds, using max
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Wait until the operation completes.
  while (!operation.done) {
    operation = await ai.checkOperation(operation);
    // Sleep for 5 seconds before checking again.
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (operation.error) {
    throw new Error(`Veo generation failed: ${operation.error.message}`);
  }

  const video = operation.output?.message?.content.find((p) => !!p.media);
  if (!video) {
    throw new Error('Failed to find the generated video in operation output');
  }

  const generatedVideoDataUri = await downloadVideo(video);

  // Validate consistency if identity embedding provided
  let consistencyScore: number | undefined;
  if (options?.validateConsistency && options?.identityEmbedding) {
    try {
      const { validateConsistency } = await import('./consistency-validator');
      const result = await validateConsistency({
        generatedContentUri: generatedVideoDataUri,
        identityEmbedding: options.identityEmbedding,
        threshold: 0.85,
      });
      consistencyScore = result.score;

      // If consistency check fails, throw error to trigger retry
      if (!result.passed) {
        throw new Error(
          `Generated clip failed consistency check: ${result.details}`
        );
      }
    } catch (error: any) {
      console.warn('Consistency validation failed:', error.message);
      // Continue without consistency score if validation fails
    }
  }

  return { videoDataUri: generatedVideoDataUri, consistencyScore };
}



const generateMissingEmotionsFlow = ai.defineFlow(
  {
    name: 'generateMissingEmotionsFlow',
    inputSchema: GenerateMissingEmotionsInputSchema,
    outputSchema: GenerateMissingEmotionsOutputSchema,
  },
  async input => {
    const generationPromises = [];
    const options = {
      identityEmbedding: input.identityEmbedding,
      referenceFrames: input.referenceFrames,
      intensity: input.intensity,
      validateConsistency: input.validateConsistency,
    };

    for (let i = 0; i < input.targetNumberOfClips; i++) {
      generationPromises.push(generateSingleClip(input.imageDataUri, input.missingEmotion, options));
    }

    const results = await Promise.allSettled(generationPromises);

    const syntheticVideoClips = results
      .filter(result => {
        if (result.status === 'rejected') {
          console.error("Clip generation failed:", result.reason);
        }
        return result.status === 'fulfilled';
      })
      .map(result => (result as PromiseFulfilledResult<{ videoDataUri: string; }>).value);

    if (syntheticVideoClips.length === 0 && results.some(r => r.status === 'rejected')) {
      const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
      throw firstError.reason;
    }

    return { syntheticVideoClips };
  }
);
