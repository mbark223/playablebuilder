'use client'

import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import JSZip from 'jszip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateId } from '@/lib/utils'
import { applyMarketingKitSummary, type MarketingKitSummary } from '@/lib/marketing-kit'
import { predefinedTemplates } from '@/lib/templates/predefined-templates'

interface MarketingKitImporterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type KitAsset = {
  id: string
  name: string
  kind: 'image' | 'text'
  dataUrl?: string
  content?: string
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const getMimeFromExtension = (ext: string) => {
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`
  if (['svg'].includes(ext)) return 'image/svg+xml'
  if (ext === 'txt') return 'text/plain'
  if (ext === 'json') return 'application/json'
  return 'application/octet-stream'
}

const summarizeAssets = (assets: KitAsset[]): MarketingKitSummary => {
  const images = assets.filter(asset => asset.kind === 'image')
  const textAsset = assets.find(asset => asset.kind === 'text' && asset.content)
  
  const findByKeywords = (keywords: string[]) => {
    const lowerKeywords = keywords.map(k => k.toLowerCase())
    return images.find(asset =>
      lowerKeywords.some(keyword => asset.name.toLowerCase().includes(keyword))
    )
  }
  
  const background = findByKeywords(['background', 'bg']) || images[0]
  const logo = findByKeywords(['logo'])
  const hero = findByKeywords(['hero', 'keyart', 'main']) || images[1] || images[0]
  
  const copyLines = textAsset?.content
    ?.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean) || []
  
  const headline = copyLines[0] || 'Experience Big Wins Instantly'
  const body = copyLines.slice(1, copyLines.length - 1).join(' ') || 'Bring your marketing kit to life automatically.'
  const cta = copyLines.at(-1) || 'Play Now'
  
  return {
    background: background?.dataUrl,
    hero: hero?.dataUrl,
    logo: logo?.dataUrl,
    headline,
    body,
    cta
  }
}

export default function MarketingKitImporter({ open, onOpenChange }: MarketingKitImporterProps) {
  const [assets, setAssets] = useState<KitAsset[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(predefinedTemplates[0]?.id ?? '')
  const summary = useMemo(() => summarizeAssets(assets), [assets])
  
  const extractZip = async (file: File) => {
    const zip = await JSZip.loadAsync(file)
    const entries = Object.keys(zip.files)
    const results: KitAsset[] = []
    
    for (const path of entries) {
      const entry = zip.files[path]
      if (entry.dir) continue
      const ext = path.split('.').pop()?.toLowerCase() || ''
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        const base64 = await entry.async('base64')
        const mime = getMimeFromExtension(ext)
        results.push({
          id: generateId(),
          name: path.split('/').pop() || path,
          kind: 'image',
          dataUrl: `data:${mime};base64,${base64}`
        })
      } else if (['txt'].includes(ext)) {
        const content = await entry.async('text')
        results.push({
          id: generateId(),
          name: path.split('/').pop() || path,
          kind: 'text',
          content
        })
      }
    }
    
    return results
  }
  
  const processFile = async (file: File): Promise<KitAsset[]> => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      return extractZip(file)
    }
    
    if (file.type.startsWith('text') || file.name.toLowerCase().endsWith('.txt')) {
      return [{
        id: generateId(),
        name: file.name,
        kind: 'text',
        content: await file.text()
      }]
    }
    
    if (file.type.startsWith('image/')) {
      return [{
        id: generateId(),
        name: file.name,
        kind: 'image',
        dataUrl: await readFileAsDataUrl(file)
      }]
    }
    
    return []
  }
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processed: KitAsset[] = []
    for (const file of acceptedFiles) {
      const result = await processFile(file)
      processed.push(...result)
    }
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
      await applyMarketingKitSummary(summary, selectedTemplate)
      setAssets([])
      onOpenChange(false)
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
            <Button variant="outline" onClick={() => { setAssets([]); onOpenChange(false) }}>
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
