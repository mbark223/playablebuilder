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
import { MarketingKitSummary } from '@/lib/marketing-kit';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { generateId } from '@/lib/utils';
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
function MarketingKitDropzone({ onImport }: { onImport: (summary: MarketingKitSummary) => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractZip = async (file: File) => {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.keys(zip.files);
    const results: any[] = [];
    
    for (const path of entries) {
      const entry = zip.files[path];
      if (entry.dir) continue;
      
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const name = path.split('/').pop() || path;
      
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        const base64 = await entry.async('base64');
        const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        results.push({
          id: generateId(),
          name,
          kind: 'image',
          dataUrl: `data:${mime};base64,${base64}`
        });
      } else if (ext === 'txt') {
        const content = await entry.async('text');
        results.push({
          id: generateId(),
          name,
          kind: 'text',
          content
        });
      }
    }
    
    return results;
  };

  const processFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      return extractZip(file);
    }
    
    if (file.type.startsWith('text') || file.name.toLowerCase().endsWith('.txt')) {
      return [{
        id: generateId(),
        name: file.name,
        kind: 'text',
        content: await file.text()
      }];
    }
    
    if (file.type.startsWith('image/')) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      return [{
        id: generateId(),
        name: file.name,
        kind: 'image',
        dataUrl
      }];
    }
    
    return [];
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    try {
      const allAssets = [];
      for (const file of acceptedFiles) {
        const fileAssets = await processFile(file);
        allAssets.push(...fileAssets);
      }
      setAssets(allAssets);
      
      // Auto-process if we have assets
      if (allAssets.length > 0) {
        const images = allAssets.filter(a => a.kind === 'image');
        const textAsset = allAssets.find(a => a.kind === 'text' && a.content);
        
        const summary: MarketingKitSummary = {
          background: images.find(img => img.name.toLowerCase().includes('background'))?.dataUrl || '',
          hero: images.find(img => img.name.toLowerCase().includes('hero') || img.name.toLowerCase().includes('character'))?.dataUrl || images[0]?.dataUrl || '',
          logo: images.find(img => img.name.toLowerCase().includes('logo'))?.dataUrl || '',
          headline: textAsset?.content?.match(/^.+$/m)?.[0] || 'Play & Win Big!',
          body: textAsset?.content?.split('\\n').slice(1, -1).join(' ') || 'Experience the thrill of winning',
          cta: 'Play Now'
        };
        
        onImport(summary);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onImport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
      'text/plain': ['.txt']
    }
  });

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
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium mb-2">Successfully imported {assets.length} files</p>
          <div className="grid grid-cols-2 gap-2">
            {assets.slice(0, 4).map(asset => (
              <div key={asset.id} className="text-xs truncate">
                {asset.kind === 'image' ? '🖼' : '📄'} {asset.name}
              </div>
            ))}
            {assets.length > 4 && (
              <div className="text-xs text-muted-foreground">
                ...and {assets.length - 4} more
              </div>
            )}
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

  // Marketing Kit asset types
  type KitAsset = {
    id: string;
    name: string;
    kind: 'image' | 'text';
    dataUrl?: string;
    content?: string;
  };

  // Helper to read file as data URL
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Helper to get MIME type from extension
  const getMimeFromExtension = (ext: string) => {
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    if (['svg'].includes(ext)) return 'image/svg+xml';
    if (ext === 'txt') return 'text/plain';
    return 'application/octet-stream';
  };

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
            <MarketingKitDropzone onImport={handleMarketingKitImport} />
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