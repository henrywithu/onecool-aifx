import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Clapperboard, GalleryHorizontal } from 'lucide-react';

type Props = {
  videoDataUri: string | null;
  refinedImageUri: string | null;
  isLoadingRefinement: boolean;
  generatedClips: { videoDataUri: string }[];
  isGeneratingClips: boolean;
};

export function PreviewPanel({
  videoDataUri,
  refinedImageUri,
  isLoadingRefinement,
  generatedClips,
  isGeneratingClips,
}: Props) {
  const showGeneratedClipsSection = isGeneratingClips || generatedClips.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full auto-rows-min">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Clapperboard className="w-6 h-6 text-primary" />
          <CardTitle>Source Video</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-4">
          {videoDataUri ? (
            <video controls src={videoDataUri} className="w-full rounded-lg max-h-[60vh] object-contain" />
          ) : (
            <div className="w-full aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center p-4">
              <Clapperboard className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Upload a video to begin</h3>
              <p className="text-muted-foreground text-sm max-w-xs">Your digital likeness journey starts here. Use the sidebar to upload a source video.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <GalleryHorizontal className="w-6 h-6 text-primary" />
          <CardTitle>Refined Likeness</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-4">
          {isLoadingRefinement ? (
            <div className="w-full aspect-video bg-muted/50 rounded-lg flex items-center justify-center animate-pulse">
                <Skeleton className="w-full h-full" />
            </div>
          ) : refinedImageUri ? (
            <div className="w-full h-full flex items-center justify-center">
              <Image src={refinedImageUri} alt="Refined Likeness" width={640} height={360} className="w-full rounded-lg object-contain max-h-[60vh]" />
            </div>
          ) : (
             <div className="w-full aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center p-4">
                <GalleryHorizontal className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Refined image will appear here</h3>
                <p className="text-muted-foreground text-sm max-w-xs">Use the likeness controls in the sidebar to generate a new image from your source video.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showGeneratedClipsSection && (
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Bot className="w-6 h-6 text-primary" />
            <CardTitle>Generated Emotion Clips</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {isGeneratingClips && Array.from({length: 3}).map((_, i) => (
              <div key={i} className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                 <Skeleton className="w-full h-full" />
              </div>
            ))}
            {generatedClips.map((clip, index) => (
              <video key={index} controls src={clip.videoDataUri} className="w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
