/**
 * Actor Profile Service
 * 
 * Manages CRUD operations for actor profiles with local storage fallback.
 * Supports both Firebase (when configured) and in-memory storage.
 */

import { ActorProfile, TrainingVideos, EmotionClipData, MotorTraits } from '@/lib/types/actor-profile';

// In-memory storage for profiles (fallback when Firebase not configured)
let profilesCache: Map<string, ActorProfile> = new Map();

/**
 * Generate a unique ID for new profiles
 */
function generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new actor profile with default values
 */
export async function createActorProfile(name: string): Promise<ActorProfile> {
    const profile: ActorProfile = {
        id: generateId(),
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        faceEmbedding: null,
        bodyEmbedding: null,
        referenceFrames: [],
        trainingVideos: {
            facial: [],
            body: [],
            motion: [],
        },
        emotionCoverage: {},
        motorTraits: null,
        consistencyScore: 0,
        emotionCoveragePercent: 0,
        dataQualityScore: 0,
        enableFullBody: false,
        enableMultiModal: false,
    };

    // Store in cache
    profilesCache.set(profile.id, profile);

    // TODO: Store in Firebase when configured
    // if (isFirebaseConfigured()) {
    //   await setDoc(doc(db, 'actorProfiles', profile.id), profile);
    // }

    return profile;
}

/**
 * Get an actor profile by ID
 */
export async function getActorProfile(id: string): Promise<ActorProfile | null> {
    // Try cache first
    const cached = profilesCache.get(id);
    if (cached) {
        return cached;
    }

    // TODO: Fetch from Firebase when configured
    // if (isFirebaseConfigured()) {
    //   const docRef = doc(db, 'actorProfiles', id);
    //   const docSnap = await getDoc(docRef);
    //   if (docSnap.exists()) {
    //     const profile = docSnap.data() as ActorProfile;
    //     profilesCache.set(id, profile);
    //     return profile;
    //   }
    // }

    return null;
}

/**
 * List all actor profiles
 */
export async function listActorProfiles(): Promise<ActorProfile[]> {
    // Return from cache
    const profiles = Array.from(profilesCache.values());

    // TODO: Fetch from Firebase when configured
    // if (isFirebaseConfigured()) {
    //   const querySnapshot = await getDocs(collection(db, 'actorProfiles'));
    //   const profiles: ActorProfile[] = [];
    //   querySnapshot.forEach((doc) => {
    //     profiles.push(doc.data() as ActorProfile);
    //   });
    //   return profiles;
    // }

    return profiles;
}

/**
 * Update an actor profile
 */
export async function updateActorProfile(
    id: string,
    updates: Partial<ActorProfile>
): Promise<ActorProfile | null> {
    const profile = await getActorProfile(id);
    if (!profile) {
        return null;
    }

    const updatedProfile: ActorProfile = {
        ...profile,
        ...updates,
        id: profile.id, // Prevent ID change
        createdAt: profile.createdAt, // Prevent createdAt change
        updatedAt: new Date(),
    };

    // Update cache
    profilesCache.set(id, updatedProfile);

    // TODO: Update in Firebase when configured
    // if (isFirebaseConfigured()) {
    //   await updateDoc(doc(db, 'actorProfiles', id), updates);
    // }

    return updatedProfile;
}

/**
 * Delete an actor profile
 */
export async function deleteActorProfile(id: string): Promise<boolean> {
    const exists = profilesCache.has(id);
    if (!exists) {
        return false;
    }

    // Delete from cache
    profilesCache.delete(id);

    // TODO: Delete from Firebase when configured
    // if (isFirebaseConfigured()) {
    //   await deleteDoc(doc(db, 'actorProfiles', id));
    // }

    return true;
}

/**
 * Add training video to profile
 */
export async function addTrainingVideo(
    profileId: string,
    category: keyof TrainingVideos,
    videoUri: string
): Promise<ActorProfile | null> {
    const profile = await getActorProfile(profileId);
    if (!profile) {
        return null;
    }

    const updatedVideos = {
        ...profile.trainingVideos,
        [category]: [...profile.trainingVideos[category], videoUri],
    };

    return updateActorProfile(profileId, { trainingVideos: updatedVideos });
}

/**
 * Update emotion coverage for a specific emotion
 */
export async function updateEmotionCoverage(
    profileId: string,
    emotion: string,
    clipData: EmotionClipData
): Promise<ActorProfile | null> {
    const profile = await getActorProfile(profileId);
    if (!profile) {
        return null;
    }

    const updatedCoverage = {
        ...profile.emotionCoverage,
        [emotion]: clipData,
    };

    // Recalculate emotion coverage percentage
    const totalEmotions = 24; // As defined in implementation plan
    const coveredEmotions = Object.keys(updatedCoverage).length;
    const emotionCoveragePercent = (coveredEmotions / totalEmotions) * 100;

    return updateActorProfile(profileId, {
        emotionCoverage: updatedCoverage,
        emotionCoveragePercent,
    });
}

/**
 * Update identity embedding
 */
export async function updateIdentityEmbedding(
    profileId: string,
    embedding: number[],
    referenceFrames: string[]
): Promise<ActorProfile | null> {
    return updateActorProfile(profileId, {
        faceEmbedding: embedding,
        referenceFrames,
    });
}

/**
 * Update motor traits
 */
export async function updateMotorTraits(
    profileId: string,
    motorTraits: MotorTraits
): Promise<ActorProfile | null> {
    return updateActorProfile(profileId, { motorTraits });
}

/**
 * Calculate and update consistency score
 */
export async function updateConsistencyScore(
    profileId: string,
    newScore: number
): Promise<ActorProfile | null> {
    const profile = await getActorProfile(profileId);
    if (!profile) {
        return null;
    }

    // Use running average for consistency score
    const currentScore = profile.consistencyScore || 0;
    const updatedScore = currentScore === 0 ? newScore : (currentScore + newScore) / 2;

    return updateActorProfile(profileId, { consistencyScore: updatedScore });
}

/**
 * Get current profile from local storage (for UI state)
 */
export function getCurrentProfileId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('currentProfileId');
}

/**
 * Set current profile in local storage (for UI state)
 */
export function setCurrentProfileId(profileId: string | null): void {
    if (typeof window === 'undefined') return;
    if (profileId) {
        localStorage.setItem('currentProfileId', profileId);
    } else {
        localStorage.removeItem('currentProfileId');
    }
}
