// NOTE: The Genkit embed API currently doesn't support media content in the way we need.
// This is a known limitation. For now, identity embedding generation is disabled.
// Alternative approaches:
// 1. Use Gemini Vision API directly (not through Genkit) to generate face descriptions
// 2. Use a dedicated face recognition service (e.g., Face API, AWS Rekognition)
// 3. Wait for Genkit to support multimodal embeddings
//
// For the MVP, we'll skip identity embedding and focus on prompt engineering
// to improve consistency.

export const IDENTITY_EMBEDDING_DISABLED = true;
export const EMBEDDING_WORKAROUND_NOTE = `
Identity embedding is currently disabled due to Genkit API limitations.
Consistency is achieved through enhanced prompting and reference frame inclusion.
`;
