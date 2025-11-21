'use server';

/**
 * @fileOverview Data Quality Validator
 * 
 * Validates video quality for training data suitability.
 * Checks resolution, lighting, face visibility, motion blur, and diversity.
 * 
 * - validateDataQuality - Validates video quality
 * - ValidateDataQualityInput - Input schema
 * - ValidateDataQualityOutput - Output schema (DataQualityReport)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateDataQualityInputSchema = z.object({
    videoDataUri: z
        .string()
        .describe(
            'Video to validate as a data URI. Expected format: data:<mimetype>;base64,<encoded_data>'
        ),
});

export type ValidateDataQualityInput = z.infer<typeof ValidateDataQualityInputSchema>;

const ValidateDataQualityOutputSchema = z.object({
    overallScore: z.number().min(0).max(1).describe('Overall quality score (0-1)'),
    resolution: z.object({
        width: z.number(),
        height: z.number(),
        score: z.number().min(0).max(1),
    }),
    lighting: z.object({
        score: z.number().min(0).max(1),
        issues: z.array(z.string()),
    }),
    faceVisibility: z.object({
        score: z.number().min(0).max(1),
        percentage: z.number().min(0).max(100),
    }),
    motionBlur: z.object({
        score: z.number().min(0).max(1),
        detected: z.boolean(),
    }),
    diversity: z.object({
        score: z.number().min(0).max(1),
        angles: z.number(),
        expressions: z.number(),
    }),
    recommendations: z.array(z.string()),
});

export type ValidateDataQualityOutput = z.infer<typeof ValidateDataQualityOutputSchema>;

export async function validateDataQuality(
    input: ValidateDataQualityInput
): Promise<ValidateDataQualityOutput> {
    return validateDataQualityFlow(input);
}

const qualityAnalysisPrompt = ai.definePrompt({
    name: 'qualityAnalysisPrompt',
    input: { schema: ValidateDataQualityInputSchema },
    output: { schema: ValidateDataQualityOutputSchema },
    prompt: `You are an expert video quality analyst for AI training data. Analyze the provided video and generate a comprehensive quality report.

Evaluate the following aspects:

1. **Resolution**: Assess video resolution. Score 1.0 for 1080p+, 0.7 for 720p, 0.4 for 480p, 0.0 for lower.

2. **Lighting**: Evaluate lighting quality. Score 1.0 for consistent, well-lit footage. Deduct for harsh shadows, overexposure, underexposure, or inconsistent lighting. List specific issues.

3. **Face Visibility**: Determine what percentage of frames show a clearly visible face. Score based on visibility percentage and clarity.

4. **Motion Blur**: Detect if motion blur is present. Score 1.0 if no blur, 0.5 if minor blur, 0.0 if significant blur.

5. **Diversity**: Assess variety in camera angles and facial expressions. Score based on how many different angles (frontal, profile, 3/4, etc.) and expressions are captured.

6. **Recommendations**: Provide 3-5 specific, actionable recommendations to improve data quality.

Calculate an overall score as the weighted average:
- Resolution: 20%
- Lighting: 25%
- Face Visibility: 30%
- Motion Blur: 10%
- Diversity: 15%

Video: {{media url=videoDataUri}}`,
});

const validateDataQualityFlow = ai.defineFlow(
    {
        name: 'validateDataQualityFlow',
        inputSchema: ValidateDataQualityInputSchema,
        outputSchema: ValidateDataQualityOutputSchema,
    },
    async (input) => {
        const { output } = await qualityAnalysisPrompt(input);
        return output!;
    }
);
