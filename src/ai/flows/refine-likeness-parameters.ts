// src/ai/flows/refine-likeness-parameters.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for refining likeness parameters using natural language instructions.
 *
 * The flow takes natural language instructions and a base image, and returns a refined image based on those instructions.
 * It uses the googleai/gemini-2.5-flash-image-preview model for image editing.
 *
 * @param {RefineLikenessParametersInput} input - The input object containing the base image and refinement instructions.
 * @returns {Promise<RefineLikenessParametersOutput>} - A promise that resolves with the refined image data URI.
 */

import {ai} from '@/ai/genkit';
import {z, generate, sleep} from 'genkit';

const RefineLikenessParametersInputSchema = z.object({
  baseImageDataUri: z
    .string()
    .describe(
      'The base image to refine, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  instructions: z.string().describe('Natural language instructions for refining the likeness.'),
});
export type RefineLikenessParametersInput = z.infer<typeof RefineLikenessParametersInputSchema>;

const RefineLikenessParametersOutputSchema = z.object({
  refinedImageDataUri: z.string().describe('The refined image as a data URI.'),
});
export type RefineLikenessParametersOutput = z.infer<typeof RefineLikenessParametersOutputSchema>;

export async function refineLikenessParameters(
  input: RefineLikenessParametersInput
): Promise<RefineLikenessParametersOutput> {
  return refineLikenessParametersFlow(input);
}

const refineLikenessParametersFlow = ai.defineFlow(
  {
    name: 'refineLikenessParametersFlow',
    inputSchema: RefineLikenessParametersInputSchema,
    outputSchema: RefineLikenessParametersOutputSchema,
  },
  async input => {
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        const {media} = await generate({
          model: 'googleai/gemini-2.5-flash-image-preview',
          prompt: [
            {media: {url: input.baseImageDataUri}},
            {text: input.instructions},
          ],
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
          },
        });

        if (!media) {
          throw new Error('No refined image returned from the model.');
        }

        return {refinedImageDataUri: media.url};
      } catch (e: any) {
        if (e.reason === 'rateLimit' || (e.cause as any)?.reason === 'rateLimit') {
          retries++;
          if (retries < maxRetries) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            console.log(`Rate limited. Retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
          }
        }
        throw e;
      }
    }

    throw new Error('Failed to refine likeness after multiple retries.');
  }
);
