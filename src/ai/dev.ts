import { config } from 'dotenv';
config();

// Existing flows
import '@/ai/flows/refine-likeness-parameters.ts';
import '@/ai/flows/initial-data-analysis.ts';
import '@/ai/flows/generate-missing-emotions.ts';

// New flows (Phase 1)
import '@/ai/flows/data-quality-validator.ts';
// Note: identity-embedding-generator and consistency-validator are disabled
// due to Genkit API limitations with multimodal embeddings