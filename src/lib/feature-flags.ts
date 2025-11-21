/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for gradual rollout of new capabilities.
 * Flags can be controlled via environment variables or runtime configuration.
 */

export interface FeatureFlags {
    // Multi-modal data capture
    enableMultiModal: boolean;

    // Full-body modeling
    enableFullBody: boolean;

    // Identity embedding and consistency validation
    enableIdentityEmbedding: boolean;

    // Expanded emotion taxonomy (24 emotions)
    enableExpandedEmotions: boolean;

    // Firebase storage integration
    enableFirebaseStorage: boolean;

    // Advanced analytics and monitoring
    enableAnalytics: boolean;
}

/**
 * Get feature flags from environment variables
 */
function getEnvFlags(): Partial<FeatureFlags> {
    if (typeof process === 'undefined') return {};

    return {
        enableMultiModal: process.env.NEXT_PUBLIC_ENABLE_MULTIMODAL === 'true',
        enableFullBody: process.env.NEXT_PUBLIC_ENABLE_FULLBODY === 'true',
        enableIdentityEmbedding: process.env.NEXT_PUBLIC_ENABLE_IDENTITY_EMBEDDING === 'true',
        enableExpandedEmotions: process.env.NEXT_PUBLIC_ENABLE_EXPANDED_EMOTIONS === 'true',
        enableFirebaseStorage: process.env.NEXT_PUBLIC_ENABLE_FIREBASE_STORAGE === 'true',
        enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    };
}

/**
 * Default feature flags (conservative - all new features disabled by default)
 */
const DEFAULT_FLAGS: FeatureFlags = {
    enableMultiModal: false,
    enableFullBody: false,
    enableIdentityEmbedding: false,
    enableExpandedEmotions: false,
    enableFirebaseStorage: false,
    enableAnalytics: false,
};

/**
 * Get current feature flags (merges defaults with environment overrides)
 */
export function getFeatureFlags(): FeatureFlags {
    const envFlags = getEnvFlags();
    return {
        ...DEFAULT_FLAGS,
        ...envFlags,
    };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    const flags = getFeatureFlags();
    return flags[feature];
}

/**
 * Get feature flag status for display in UI
 */
export function getFeatureFlagStatus(): Array<{ name: string; enabled: boolean; description: string }> {
    const flags = getFeatureFlags();

    return [
        {
            name: 'Multi-Modal Capture',
            enabled: flags.enableMultiModal,
            description: 'Upload multiple videos for comprehensive data capture',
        },
        {
            name: 'Full-Body Modeling',
            enabled: flags.enableFullBody,
            description: 'Capture and generate full-body clips with motor traits',
        },
        {
            name: 'Identity Embedding',
            enabled: flags.enableIdentityEmbedding,
            description: 'Advanced facial consistency using identity embeddings',
        },
        {
            name: 'Expanded Emotions',
            enabled: flags.enableExpandedEmotions,
            description: '24 emotions with intensity control',
        },
        {
            name: 'Firebase Storage',
            enabled: flags.enableFirebaseStorage,
            description: 'Cloud storage for training data and generated clips',
        },
        {
            name: 'Analytics',
            enabled: flags.enableAnalytics,
            description: 'Usage tracking and performance monitoring',
        },
    ];
}
