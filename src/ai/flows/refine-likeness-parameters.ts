'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.5-flash-image-preview',
          prompt: [
            { media: { url: input.baseImageDataUri } },
            { text: input.instructions },
          ],
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
          },
        });

        if (!media) {
          throw new Error('No refined image returned from the model.');
        }

        return { refinedImageDataUri: media.url };
      } catch (e: any) {
        if ((e.reason === 'rateLimit' || (e.cause as any)?.reason === 'rateLimit')) {
          retries++;
          if (retries < maxRetries) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            console.log(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw e;
      }
    }

    throw new Error('Failed to refine likeness after multiple retries.');
  }
);
