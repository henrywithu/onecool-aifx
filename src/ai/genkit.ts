// Polyfill localStorage for server-side environments
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  const mockStorage = {
    data: {} as Record<string, string>,
    getItem(key: string) {
      return this.data[key] || null;
    },
    setItem(key: string, value: string) {
      this.data[key] = value;
    },
    removeItem(key: string) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    },
    get length() {
      return Object.keys(this.data).length;
    },
    key(index: number) {
      const keys = Object.keys(this.data);
      return keys[index] || null;
    }
  };

  // @ts-ignore - Adding localStorage to global for server-side
  global.localStorage = mockStorage;
}

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Ensure API key is available
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn('⚠️  Warning: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables.');
  console.warn('   Please ensure your .env file contains GEMINI_API_KEY=your_api_key');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    })
  ],
  model: 'googleai/gemini-2.5-flash',
});

