
'use server';

/**
 * @fileOverview A flow that generates synthetic training data for missing emotions based on user's existing video data.
 *
 * - generateMissingEmotions - A function that generates synthetic training data for missing emotions.
 * - GenerateMissingEmotionsInput - The input type for the generateMissingEmotions function.
 * - GenerateMissingEmotionsOutput - The return type for the generateMissingEmotions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { MediaPart } from 'genkit/media';

const GenerateMissingEmotionsInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of an actor, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  missingEmotion: z.string().describe('The emotion to generate.'),
  targetNumberOfClips: z.number().describe('The number of clips to generate for the specified emotion.'),
});

export type GenerateMissingEmotionsInput = z.infer<typeof GenerateMissingEmotionsInputSchema>;

const GenerateMissingEmotionsOutputSchema = z.object({
  syntheticVideoClips: z.array(
    z.object({
      videoDataUri: z.string().describe('A synthetic video clip as a data URI.'),
    })
  ),
});

export type GenerateMissingEmotionsOutput = z.infer<typeof GenerateMissingEmotionsOutputSchema>;

export async function generateMissingEmotions(
  input: GenerateMissingEmotionsInput
): Promise<GenerateMissingEmotionsOutput> {
  return generateMissingEmotionsFlow(input);
}

const generateMissingEmotionsFlow = ai.defineFlow(
  {
    name: 'generateMissingEmotionsFlow',
    inputSchema: GenerateMissingEmotionsInputSchema,
    outputSchema: GenerateMissingEmotionsOutputSchema,
  },
  async input => {
    const syntheticVideoClips: { videoDataUri: string }[] = [];
    
    // Helper to download video from the url provided by VEO
    async function downloadVideo(video: MediaPart) {
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

    for (let i = 0; i < input.targetNumberOfClips; i++) {
      try {
        // Use Veo to generate videos.
        let { operation } = await ai.generate({
          model: 'googleai/veo-2.0-generate-001',
          prompt: [
            {
              text: `Generate a short 5 second video of the actor in the provided video displaying the emotion: ${input.missingEmotion}.`,
            },
            {
              media: { url: input.videoDataUri },
            },
          ],
          config: {
            durationSeconds: 5,
            aspectRatio: '16:9',
            personGeneration: 'allow_adult',
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
          console.error('Veo generation failed:', operation.error);
          continue; // Skip to the next iteration if video generation fails
        }

        const video = operation.output?.message?.content.find((p) => !!p.media);
        if (!video) {
          console.error('Failed to find the generated video');
          continue;
        }

        const videoDataUri = await downloadVideo(video);

        syntheticVideoClips.push({
          videoDataUri: videoDataUri,
        });
      } catch (error) {
        console.error('Error generating video:', error);
      }
    }

    return { syntheticVideoClips };
  }
);
