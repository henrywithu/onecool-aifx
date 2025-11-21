import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

console.log('Import successful');

try {
    const ai = genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-2.5-flash',
    });
    console.log('Genkit initialized');
} catch (e) {
    console.error('Error initializing genkit:', e);
}
