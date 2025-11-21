"use client";

import { analyzeVideoData } from "@/ai/flows/initial-data-analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type Props = {
  setVideoFile: Dispatch<SetStateAction<File | null>>;
  setVideoDataUri: Dispatch<SetStateAction<string | null>>;
  setAnalysisReport: Dispatch<SetStateAction<{ suitabilityReport: string } | null>>;
  setIsLoadingAnalysis: Dispatch<SetStateAction<boolean>>;
  isLoadingAnalysis: boolean;
  analysisReport: { suitabilityReport: string } | null;
};

export function DataIngestion({
  setVideoFile,
  setVideoDataUri,
  setAnalysisReport,
  setIsLoadingAnalysis,
  isLoadingAnalysis,
  analysisReport,
}: Props) {
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setIsLoadingAnalysis(true);
      setAnalysisReport(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setVideoDataUri(dataUri);
        try {
          const report = await analyzeVideoData({ videoDataUri: dataUri });
          setAnalysisReport(report);
        } catch (error) {
          console.error("Error analyzing video:", error);
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the video. Please try another one.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingAnalysis(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label htmlFor="video-upload" className="text-sm">Upload Video</Label>
        <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="mt-1" />
        <p className="text-xs text-muted-foreground mt-1">Upload a short video (&lt;5s) for analysis.</p>
      </div>

      {isLoadingAnalysis && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Analyzing video...</span>
        </div>
      )}

      {analysisReport && (
        <Card className="bg-card/50 shadow-inner">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Analysis Report</CardTitle>
            <CardDescription className="text-xs">AI-generated suitability assessment.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Textarea
              readOnly
              value={analysisReport.suitabilityReport}
              className="h-40 text-xs bg-muted/50"
              aria-label="Video analysis report"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
