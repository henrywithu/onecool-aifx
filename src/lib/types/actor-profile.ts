/**
 * Type definitions for Actor Profile system
 * 
 * Defines the data structures for storing actor identity, training data,
 * and generation metadata.
 */

export type EmotionIntensity = 'subtle' | 'moderate' | 'intense';

export type VideoCategory = 'facial' | 'body' | 'motion' | 'interaction';

export interface EmotionClipData {
    clips: string[]; // Storage URLs or data URIs
    quality: number; // 0-1 quality score
    intensity: EmotionIntensity;
    generatedAt: Date;
}

export interface MotorTraits {
    gait: string; // Natural language description
    gestures: string[]; // Common gestures
    posture: string; // Typical posture description
}

export interface TrainingVideos {
    facial: string[]; // Storage URLs or data URIs
    body: string[];
    motion: string[];
}

export interface ActorProfile {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;

    // Identity embeddings
    faceEmbedding: number[] | null; // 768-dim vector from Gemini
    bodyEmbedding: number[] | null; // Future: body identity vector
    referenceFrames: string[]; // Top canonical face images (URLs or data URIs)

    // Training data
    trainingVideos: TrainingVideos;

    // Emotion coverage
    emotionCoverage: Record<string, EmotionClipData>;

    // Motor traits (for full-body modeling)
    motorTraits: MotorTraits | null;

    // Quality metrics
    consistencyScore: number; // 0-1, average identity consistency
    emotionCoveragePercent: number; // 0-100, percentage of emotions covered
    dataQualityScore: number; // 0-1, overall data quality

    // Feature flags
    enableFullBody: boolean;
    enableMultiModal: boolean;
}

export interface VideoUpload {
    dataUri: string;
    category: VideoCategory;
    duration: number;
    metadata?: {
        lighting?: string;
        angle?: string;
        distance?: string;
    };
}

export interface DataQualityReport {
    overallScore: number; // 0-1
    resolution: { width: number; height: number; score: number };
    lighting: { score: number; issues: string[] };
    faceVisibility: { score: number; percentage: number };
    motionBlur: { score: number; detected: boolean };
    diversity: { score: number; angles: number; expressions: number };
    recommendations: string[];
}

export interface IdentityConsistencyResult {
    score: number; // 0-1, similarity to identity embedding
    passed: boolean; // true if score >= threshold
    threshold: number;
    details?: string;
}
