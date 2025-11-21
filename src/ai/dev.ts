import { config } from 'dotenv';
config();

import '@/ai/flows/refine-likeness-parameters.ts';
import '@/ai/flows/initial-data-analysis.ts';
import '@/ai/flows/generate-missing-emotions.ts';