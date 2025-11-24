import { config } from 'dotenv';
config();

// Existing flows
import '@/ai/flows/refine-likeness-parameters.ts';
import '@/ai/flows/initial-data-analysis.ts';
import '@/ai/flows/generate-missing-emotions.ts';

import '@/ai/flows/data-quality-validator.ts';