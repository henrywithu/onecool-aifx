"use client";

import { refineLikenessParameters } from "@/ai/flows/refine-likeness-parameters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "../ui/label";

type Props = {
  videoDataUri: string | null;
  isLoadingRefinement: boolean;
  setIsLoadingRefinement: Dispatch<SetStateAction<boolean>>;
  setRefinedImageUri: Dispatch<SetStateAction<string | null>>;
};

export function LikenessRefinement({
  videoDataUri,
  isLoadingRefinement,
  setIsLoadingRefinement,
  setRefinedImageUri,
}: Props) {
  const [instructions, setInstructions] = useState("");
  const [baseImageDataUri, setBaseImageDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoDataUri) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous"; // Handle potential CORS issues
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


  const handleRefine = async () => {
    if (!baseImageDataUri) {
      toast({
        title: "No Base Image",
        description: "Please upload a video first to get a base image.",
        variant: "destructive",
      });
      return;
    }
    if (!instructions) {
      toast({
        title: "No Instructions",
        description: "Please provide refinement instructions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingRefinement(true);
    setRefinedImageUri(null);
    try {
      const result = await refineLikenessParameters({
        baseImageDataUri,
        instructions,
      });
      setRefinedImageUri(result.refinedImageDataUri);
    } catch (error) {
      console.error("Error refining likeness:", error);
      toast({
        title: "Refinement Failed",
        description: "Could not refine the likeness. The AI may have had trouble with the instructions.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRefinement(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label htmlFor="refinement-instructions" className="text-sm">Refinement Instructions</Label>
        <Textarea
          id="refinement-instructions"
          placeholder="e.g., 'Make the smile wider', 'add a blue shirt'"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={!videoDataUri || isLoadingRefinement}
          className="mt-1"
          rows={4}
        />
      </div>
      <Button
        onClick={handleRefine}
        disabled={!videoDataUri || isLoadingRefinement || !instructions}
        className="w-full"
      >
        {isLoadingRefinement ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refining...
          </>
        ) : (
          "Refine Likeness"
        )}
      </Button>
    </div>
  );
}
