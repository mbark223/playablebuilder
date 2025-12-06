'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Upload, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/store/project-store';
import { generatePlayableVariations } from '@/lib/playable-generator';
import { MarketingKitSummary, MarketingKitAsset, parseMarketingKitFiles, summarizeMarketingKitAssets, persistMarketingKitImages } from '@/lib/marketing-kit';
import { useDropzone } from 'react-dropzone';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SizeOption {
  id: string;
  name: string;
  width: number;
  height: number;
  selected: boolean;
}

const AVAILABLE_SIZES: SizeOption[] = [
  { id: 'portrait', name: 'Portrait (1080×1920)', width: 1080, height: 1920, selected: true },
  { id: 'square', name: 'Square (1080×1080)', width: 1080, height: 1080, selected: true },
  { id: 'landscape', name: 'Landscape (1920×1080)', width: 1920, height: 1080, selected: false },
  { id: 'story', name: 'Story (1080×1920)', width: 1080, height: 1920, selected: false },
  { id: 'banner', name: 'Banner (320×50)', width: 320, height: 50, selected: false },
  { id: 'leaderboard', name: 'Leaderboard (728×90)', width: 728, height: 90, selected: false },
];

interface MarketingKitWorkflowProps {
  onComplete: () => void;
}

// Simple dropzone component for marketing kit import
function MarketingKitDropzone({ onImport, projectId }: { onImport: (summary: MarketingKitSummary) => void; projectId?: string }) {
  const [assets, setAssets] = useState<MarketingKitAsset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const summaryPreview = summarizeMarketingKitAssets(assets);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    try {
      const parsed = await parseMarketingKitFiles(acceptedFiles);
      const updatedAssets = [...assets, ...parsed];
      setAssets(updatedAssets);

      if (updatedAssets.length > 0) {
        const summary = summarizeMarketingKitAssets(updatedAssets);
        const persisted = await persistMarketingKitImages(summary, { projectId });
        onImport(persisted);
      }
    } catch (error) {
      console.error('Failed to process marketing kit:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [assets, onImport, projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
      'text/plain': ['.txt']
    },
    multiple: true
  });

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop files here' : 'Drop marketing kit here'}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports .zip, .png, .jpg, .svg, and .txt files
        </p>
      </div>
      
      {assets.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <p className="text-sm font-medium">Imported Files</p>
              <span className="text-xs text-muted-foreground">{assets.length} file(s)</span>
            </div>
            <ScrollArea className="h-40">
              <div className="p-3 space-y-2">
                {assets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
                    <div className="flex items-center gap-2">
                      {asset.kind === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="truncate max-w-[160px]">{asset.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Detected Copy</p>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-1">
              <p><strong>Headline:</strong> {summaryPreview.headline}</p>
              <p><strong>Body:</strong> {summaryPreview.body}</p>
              <p><strong>CTA:</strong> {summaryPreview.cta}</p>
            </div>
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
export function MarketingKitWorkflow({ onComplete }: MarketingKitWorkflowProps) {
  const [step, setStep] = useState<'import' | 'sizes' | 'generating' | 'complete'>('import');
  const [marketingKitSummary, setMarketingKitSummary] = useState<MarketingKitSummary | null>(null);
  const [selectedSizes, setSelectedSizes] = useState(AVAILABLE_SIZES);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  
  const { currentProject, updateProject } = useProjectStore();

  const handleMarketingKitImport = useCallback((summary: MarketingKitSummary) => {
    setMarketingKitSummary(summary);
    setStep('sizes');
  }, []);

  const toggleSizeSelection = (id: string) => {
    setSelectedSizes(prev => 
      prev.map(size => 
        size.id === id ? { ...size, selected: !size.selected } : size
      )
    );
  };

  const handleGeneratePlayables = async () => {
    const activeSizes = selectedSizes.filter(size => size.selected);
    
    if (activeSizes.length === 0) {
      alert('Please select at least one size');
      return;
    }

    if (!marketingKitSummary) {
      alert('No marketing kit data available');
      return;
    }

    setStep('generating');
    setGenerationProgress(0);

    try {
      const variations = await generatePlayableVariations(
        marketingKitSummary,
        activeSizes,
        (progress, message) => {
          setGenerationProgress(progress);
          setGenerationMessage(message);
        }
      );

      // Update project with generated variations
      if (currentProject && variations.artboards.length > 0) {
        // Create a new canvas state to avoid reference issues
        const newCanvas = {
          ...currentProject.canvas,
          artboards: [...variations.artboards],
          elements: [...variations.elements],
          selectedArtboardId: variations.artboards[0]?.id || null,
          synchronizedEditing: true, // Enable synchronized editing by default
        };
        
        updateProject(currentProject.id, {
          canvas: newCanvas
        });
      }

      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error generating playables:', error);
      alert('Failed to generate playables. Please try again.');
      setStep('sizes');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Marketing Kit</CardTitle>
            <CardDescription>
              Drop your marketing kit files or folder to automatically generate playable ads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarketingKitDropzone onImport={handleMarketingKitImport} projectId={currentProject?.id} />
          </CardContent>
        </Card>
      )}

      {step === 'sizes' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Ad Sizes</CardTitle>
            <CardDescription>
              Choose the sizes for your playable ads. We'll generate 2-3 variations for each size.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {selectedSizes.map(size => (
                <div key={size.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={size.id}
                    checked={size.selected}
                    onCheckedChange={() => toggleSizeSelection(size.id)}
                  />
                  <Label
                    htmlFor={size.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {size.name}
                  </Label>
                </div>
              ))}
            </div>

            <Alert>
              <AlertDescription>
                All generated playables will be synchronized - edits made to one will automatically update all others.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('import')}>
                Back
              </Button>
              <Button onClick={handleGeneratePlayables}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Playables
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'generating' && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Playables</CardTitle>
            <CardDescription>
              Creating variations based on your marketing kit...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{generationMessage}</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>Playables Generated!</CardTitle>
            <CardDescription>
              Your playable ads are ready for editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium">All set! Redirecting to the editor...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
