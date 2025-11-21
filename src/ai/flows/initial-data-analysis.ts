'use server';

/**
 * @fileOverview This flow analyzes initial video data to assess its suitability for training a likeness model.
 *
 * - analyzeVideoData - Analyzes video data and provides a report on its suitability for training.
 * - AnalyzeVideoDataInput - The input type for the analyzeVideoData function.
 * - AnalyzeVideoDataOutput - The return type for the analyzeVideoData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoDataInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'The video data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected the expected format
    ),
});
export type AnalyzeVideoDataInput = z.infer<typeof AnalyzeVideoDataInputSchema>;

const AnalyzeVideoDataOutputSchema = z.object({
  suitabilityReport: z
    .string()
    .describe(
      'A detailed report on the video data suitability for training the likeness model, including identified gaps in emotional range or body posture representation.'
    ),
});
export type AnalyzeVideoDataOutput = z.infer<typeof AnalyzeVideoDataOutputSchema>;

export async function analyzeVideoData(
  input: AnalyzeVideoDataInput
): Promise<AnalyzeVideoDataOutput> {
  return analyzeVideoDataFlow(input);
}

const analyzeVideoDataPrompt = ai.definePrompt({
  name: 'analyzeVideoDataPrompt',
  input: {schema: AnalyzeVideoDataInputSchema},
  output: {schema: AnalyzeVideoDataOutputSchema},
  prompt: `You are an expert AI model analyst. Your task is to analyze the provided video data and generate a detailed report on its suitability for training a high-fidelity actor likeness model. Identify potential gaps in emotional range or body posture representation.

Video Data: {{media url=videoDataUri}}`,
});

const analyzeVideoDataFlow = ai.defineFlow(
  {
    name: 'analyzeVideoDataFlow',
    inputSchema: AnalyzeVideoDataInputSchema,
    outputSchema: AnalyzeVideoDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeVideoDataPrompt(input);
    return output!;
  }
);
