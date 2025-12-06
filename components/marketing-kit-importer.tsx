'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { applyMarketingKitSummary, persistMarketingKitImages, type MarketingKitAsset, type MarketingKitSummary, parseMarketingKitFiles, summarizeMarketingKitAssets } from '@/lib/marketing-kit'
import { predefinedTemplates } from '@/lib/templates/predefined-templates'
import { useProjectStore } from '@/store/project-store'

interface MarketingKitImporterProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onImport?: (summary: MarketingKitSummary) => void
  hideTemplateSelector?: boolean
}

export default function MarketingKitImporter({ open, onOpenChange, onImport, hideTemplateSelector }: MarketingKitImporterProps) {
  const [assets, setAssets] = useState<MarketingKitAsset[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(predefinedTemplates[0]?.id ?? '')
  const summary = useMemo(() => summarizeMarketingKitAssets(assets), [assets])
  const { currentProject } = useProjectStore()
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processed = await parseMarketingKitFiles(acceptedFiles)
    setAssets(prev => [...prev, ...processed])
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
      'text/plain': ['.txt']
    }
  })
  
  const handleGenerate = async () => {
    if (assets.length === 0) return
    setIsProcessing(true)
    try {
      const summaryToUse = await persistMarketingKitImages(summary, {
        projectId: currentProject?.id
      })
      if (onImport) {
        onImport(summaryToUse)
        setAssets([])
      } else {
        await applyMarketingKitSummary(summaryToUse, selectedTemplate)
        setAssets([])
        onOpenChange?.(false)
      }
    } finally {
      setIsProcessing(false)
    }
  }
  
  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id))
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Marketing Kit</DialogTitle>
          <DialogDescription>
            Upload your marketing kit (zip, images, copy files) and we’ll auto-build a playable you can refine.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files to import' : 'Drag & drop marketing kit files or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .zip, .png, .jpg, .svg, and .txt copy docs.
            </p>
          </div>
          
          {assets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <p className="text-sm font-medium">Imported Files</p>
                  <span className="text-xs text-muted-foreground">{assets.length} file(s)</span>
                </div>
                <ScrollArea className="h-48">
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
              
              <div className="rounded-md border p-3 space-y-3">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {predefinedTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">Detected Copy</p>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-1">
                    <p><strong>Headline:</strong> {summary.headline}</p>
                    <p><strong>Body:</strong> {summary.body}</p>
                    <p><strong>CTA:</strong> {summary.cta}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Drop your full kit (images + copy). We’ll map logos, backgrounds, and headlines automatically.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setAssets([]); onOpenChange?.(false) }}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={assets.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Playable'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
