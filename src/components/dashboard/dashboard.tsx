"use client";

import { useState } from 'react';
import { Film, Bot, SlidersHorizontal, Sparkles } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { DataIngestion } from './data-ingestion';
import { EmotionalSpectrum } from './emotional-spectrum';
import { LikenessRefinement } from './likeness-refinement';
import { PreviewPanel } from './preview-panel';

type AnalysisReport = {
  suitabilityReport: string;
};

export default function Dashboard() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [refinedImageUri, setRefinedImageUri] = useState<string | null>(null);
  const [isLoadingRefinement, setIsLoadingRefinement] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<{ videoDataUri: string }[]>([]);
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar collapsible="icon" className="border-r" variant="sidebar">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2 justify-center group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:px-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="font-bold text-xl group-data-[collapsible=icon]:hidden">LikenessAI</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Film />
                <span className="group-data-[collapsible=icon]:hidden">Data Ingestion</span>
              </SidebarGroupLabel>
              <div className="group-data-[collapsible=icon]:hidden">
                <DataIngestion
                  setVideoFile={setVideoFile}
                  setVideoDataUri={setVideoDataUri}
                  setAnalysisReport={setAnalysisReport}
                  setIsLoadingAnalysis={setIsLoadingAnalysis}
                  isLoadingAnalysis={isLoadingAnalysis}
                  analysisReport={analysisReport}
                />
              </div>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Bot />
                <span className="group-data-[collapsible=icon]:hidden">Emotional Spectrum</span>
              </SidebarGroupLabel>
              <div className="group-data-[collapsible=icon]:hidden">
                <EmotionalSpectrum
                  videoDataUri={videoDataUri}
                  isGeneratingClips={isGeneratingClips}
                  setIsGeneratingClips={setIsGeneratingClips}
                  setGeneratedClips={setGeneratedClips}
                />
              </div>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <SlidersHorizontal />
                <span className="group-data-[collapsible=icon]:hidden">Likeness Controls</span>
              </SidebarGroupLabel>
              <div className="group-data-[collapsible=icon]:hidden">
                <LikenessRefinement
                  videoDataUri={videoDataUri}
                  isLoadingRefinement={isLoadingRefinement}
                  setIsLoadingRefinement={setIsLoadingRefinement}
                  setRefinedImageUri={setRefinedImageUri}
                />
              </div>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col flex-1">
          <Header>
            <SidebarTrigger />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Digital Likeness Dashboard</h2>
          </Header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <PreviewPanel
              videoDataUri={videoDataUri}
              refinedImageUri={refinedImageUri}
              isLoadingRefinement={isLoadingRefinement}
              generatedClips={generatedClips}
              isGeneratingClips={isGeneratingClips}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
