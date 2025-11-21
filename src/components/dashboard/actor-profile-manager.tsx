"use client";

/**
 * Actor Profile Manager Component
 * 
 * Allows users to create, view, and switch between actor profiles.
 * Displays profile metrics and feature flag status.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Plus, Check } from 'lucide-react';
import {
    createActorProfile,
    listActorProfiles,
    getCurrentProfileId,
    setCurrentProfileId,
} from '@/lib/actor-profile-service';
import { getFeatureFlagStatus } from '@/lib/feature-flags';
import type { ActorProfile } from '@/lib/types/actor-profile';

export function ActorProfileManager() {
    const [profiles, setProfiles] = useState<ActorProfile[]>([]);
    const [currentProfileId, setCurrentProfile] = useState<string | null>(null);
    const [newProfileName, setNewProfileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const featureFlags = getFeatureFlagStatus();

    // Load profiles on mount
    useEffect(() => {
        loadProfiles();
        setCurrentProfile(getCurrentProfileId());
    }, []);

    const loadProfiles = async () => {
        const loadedProfiles = await listActorProfiles();
        setProfiles(loadedProfiles);
    };

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) return;

        setIsCreating(true);
        try {
            const newProfile = await createActorProfile(newProfileName.trim());
            await loadProfiles();
            setCurrentProfileId(newProfile.id);
            setCurrentProfile(newProfile.id);
            setNewProfileName('');
        } catch (error) {
            console.error('Failed to create profile:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectProfile = (profileId: string) => {
        setCurrentProfileId(profileId);
        setCurrentProfile(profileId);
    };

    const currentProfile = profiles.find((p) => p.id === currentProfileId);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Actor Profiles
                    </CardTitle>
                    <CardDescription>
                        Create and manage digital likeness profiles
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Create New Profile */}
                    <div className="space-y-2">
                        <Label htmlFor="profile-name">Create New Profile</Label>
                        <div className="flex gap-2">
                            <Input
                                id="profile-name"
                                placeholder="Actor name"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                            />
                            <Button
                                onClick={handleCreateProfile}
                                disabled={!newProfileName.trim() || isCreating}
                                size="icon"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Profile List */}
                    <div className="space-y-2">
                        <Label>Existing Profiles ({profiles.length})</Label>
                        {profiles.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No profiles yet. Create one to get started.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {profiles.map((profile) => (
                                    <Card
                                        key={profile.id}
                                        className={`cursor-pointer transition-colors ${profile.id === currentProfileId
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:bg-muted/50'
                                            }`}
                                        onClick={() => handleSelectProfile(profile.id)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{profile.name}</h4>
                                                        {profile.id === currentProfileId && (
                                                            <Check className="w-4 h-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {profile.emotionCoveragePercent.toFixed(0)}% emotions
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            Consistency: {(profile.consistencyScore * 100).toFixed(0)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Current Profile Details */}
                    {currentProfile && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Current Profile Details</Label>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{currentProfile.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Training Videos:</span>
                                        <span className="font-medium">
                                            {currentProfile.trainingVideos.facial.length +
                                                currentProfile.trainingVideos.body.length +
                                                currentProfile.trainingVideos.motion.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Emotions Covered:</span>
                                        <span className="font-medium">
                                            {Object.keys(currentProfile.emotionCoverage).length} / 24
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Data Quality:</span>
                                        <span className="font-medium">
                                            {(currentProfile.dataQualityScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Feature Flags Status */}
                    <Separator />
                    <div className="space-y-2">
                        <Label>Available Features</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {featureFlags.map((flag) => (
                                <Badge
                                    key={flag.name}
                                    variant={flag.enabled ? 'default' : 'secondary'}
                                    className="justify-center text-xs"
                                >
                                    {flag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
