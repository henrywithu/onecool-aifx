
"use client";

import { generateMissingEmotions } from "@/ai/flows/generate-missing-emotions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "../ui/label";

const emotions = [
  "Happy",
  "Sad",
  "Angry",
  "Surprised",
  "Fearful",
  "Disgusted",
  "Ecstatic",
  "Weary",
  "Neutral"
];

type Props = {
  videoDataUri: string | null;
  isGeneratingClips: boolean;
  setIsGeneratingClips: Dispatch<SetStateAction<boolean>>;
  setGeneratedClips: Dispatch<SetStateAction<{ videoDataUri: string }[]>>;
};

export function EmotionalSpectrum({
  videoDataUri,
  isGeneratingClips,
  setIsGeneratingClips,
  setGeneratedClips,
}: Props) {
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [baseImageDataUri, setBaseImageDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoDataUri) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoDataUri;
      video.onloadeddata = () => {
        video.currentTime = 1; // Capture frame at 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setBaseImageDataUri(canvas.toDataURL("image/jpeg"));
        }
      }
    } else {
        setBaseImageDataUri(null);
    }
  }, [videoDataUri]);

  const handleGenerate = async () => {
    if (!baseImageDataUri) {
      toast({
        title: "No Base Image",
        description: "Please upload and process a video first.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedEmotion) {
      toast({
        title: "No Emotion Selected",
        description: "Please select an emotion to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingClips(true);
    setGeneratedClips([]);
    try {
      const result = await generateMissingEmotions({
        imageDataUri: baseImageDataUri,
        missingEmotion: selectedEmotion,
        targetNumberOfClips: 3,
      });
      setGeneratedClips(result.syntheticVideoClips);
      if (result.syntheticVideoClips.length === 0) {
        toast({
            title: "Generation Incomplete",
            description: "The AI completed but did not return any clips.",
            variant: "destructive",
          });
      }
    } catch (error: any) {
      console.error("Error generating emotions:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate emotional clips.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingClips(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label htmlFor="emotion-select" className="text-sm">Generate Missing Emotions</Label>
        <Select onValueChange={setSelectedEmotion} value={selectedEmotion} disabled={!videoDataUri || isGeneratingClips}>
          <SelectTrigger id="emotion-select" className="mt-1">
            <SelectValue placeholder="Select an emotion" />
          </SelectTrigger>
          <SelectContent>
            {emotions.map((emotion) => (
              <SelectItem key={emotion} value={emotion}>
                {emotion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleGenerate}
        disabled={!videoDataUri || isGeneratingClips || !selectedEmotion}
        className="w-full"
      >
        {isGeneratingClips ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Clips"
        )}
      </Button>
    </div>
  );
}
