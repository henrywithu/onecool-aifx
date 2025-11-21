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

const generateMissingEmotionsPrompt = ai.definePrompt({
  name: 'generateMissingEmotionsPrompt',
  input: {schema: GenerateMissingEmotionsInputSchema},
  output: {schema: GenerateMissingEmotionsOutputSchema},
  prompt: `You are an expert in generating realistic video clips of actors displaying specific emotions.

  Based on the provided video data and the target emotion, generate {{targetNumberOfClips}} synthetic video clips showing the actor expressing the emotion: {{missingEmotion}}.

  Ensure the generated clips maintain facial consistency with the original video and accurately represent the target emotion.

  Original Video: {{media url=videoDataUri}}
  Target Emotion: {{missingEmotion}}

  Output the synthesized video clips as data URIs.
  `, 
});

const generateMissingEmotionsFlow = ai.defineFlow(
  {
    name: 'generateMissingEmotionsFlow',
    inputSchema: GenerateMissingEmotionsInputSchema,
    outputSchema: GenerateMissingEmotionsOutputSchema,
  },
  async input => {
    const syntheticVideoClips = [];
    for (let i = 0; i < input.targetNumberOfClips; i++) {
      try {
        // Use Veo to generate videos.
        let { operation } = await ai.generate({
          model: 'googleai/veo-2.0-generate-001',
          prompt: [
            {
              text: `Generate a video of the actor in the provided video displaying the emotion: ${input.missingEmotion}.`,
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

        syntheticVideoClips.push({
          videoDataUri: video.media!.url,
        });
      } catch (error) {
        console.error('Error generating video:', error);
      }
    }

    return { syntheticVideoClips };
  }
);

