'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Layers, PlusCircle, Sparkles, Upload } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { generatePlayableVariations } from '@/lib/playable-generator'
import {
  parseMarketingKitFiles,
  summarizeMarketingKitAssets,
  persistMarketingKitImages,
  type MarketingKitAsset,
  type MarketingKitSummary
} from '@/lib/marketing-kit'
import type { Artboard, CanvasElement } from '@/types'
import { LazyImage } from '@/lib/lazy-load-image'

interface SizeChoice {
  id: string
  label: string
  width: number
  height: number
  selected: boolean
}

const DEFAULT_SIZE_CHOICES: SizeChoice[] = [
  { id: 'portrait', label: 'Portrait • 1080×1920', width: 1080, height: 1920, selected: true },
  { id: 'square', label: 'Square • 1080×1080', width: 1080, height: 1080, selected: true },
  { id: 'landscape', label: 'Landscape • 1920×1080', width: 1920, height: 1080, selected: false },
  { id: 'story', label: 'Story • 1080×1920', width: 1080, height: 1920, selected: false },
  { id: 'banner', label: 'Banner • 320×50', width: 320, height: 50, selected: false },
  { id: 'leaderboard', label: 'Leaderboard • 728×90', width: 728, height: 90, selected: false }
]

interface GeneratedPlayableOption {
  id: string
  artboard: Artboard
  elements: CanvasElement[]
  layout: string
  sizeLabel: string
}

type StorageStatus = 'checking' | 'persistent' | 'temporary'

const bytesToMB = (value: number) => value / (1024 * 1024)

export function MarketingKitStudio() {
  const [assets, setAssets] = useState<MarketingKitAsset[]>([])
  const [kitSummary, setKitSummary] = useState<MarketingKitSummary | null>(null)
  const [sizeChoices, setSizeChoices] = useState<SizeChoice[]>(DEFAULT_SIZE_CHOICES)
  const [isImporting, setIsImporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('Preparing variations…')
  const [playableOptions, setPlayableOptions] = useState<GeneratedPlayableOption[]>([])
  const [variations, setVariations] = useState<{ artboards: Artboard[]; elements: CanvasElement[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('checking')
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [lastAppliedInfo, setLastAppliedInfo] = useState<{ projectName: string; variationLabel: string } | null>(null)
  const { currentProject, updateProject, createProject } = useProjectStore()

  const detectedCopy = useMemo(() => summarizeMarketingKitAssets(assets), [assets])
  const activeCopy = kitSummary ?? detectedCopy
  const selectedSizes = sizeChoices.filter(choice => choice.selected)

  const handleStorageCheck = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage) return
    try {
      const persisted = await navigator.storage.persisted?.()
      setStorageStatus(persisted ? 'persistent' : 'temporary')
      const estimate = await navigator.storage.estimate?.()
      if (estimate?.usage && estimate?.quota) {
        setStorageEstimate({ usage: estimate.usage, quota: estimate.quota })
      }
      if (!persisted && navigator.storage.persist) {
        const granted = await navigator.storage.persist()
        if (granted) {
          setStorageStatus('persistent')
          const refreshed = await navigator.storage.estimate?.()
          if (refreshed?.usage && refreshed?.quota) {
            setStorageEstimate({ usage: refreshed.usage, quota: refreshed.quota })
          }
        }
      }
    } catch (err) {
      console.error('Failed to check storage', err)
      setStorageStatus('temporary')
    }
  }, [])

  useEffect(() => {
    handleStorageCheck()
    const interval = setInterval(handleStorageCheck, 60000)
    return () => clearInterval(interval)
  }, [handleStorageCheck])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsImporting(true)
    setError(null)
    try {
      const parsed = await parseMarketingKitFiles(acceptedFiles)
      const updatedAssets = [...assets, ...parsed]
      setAssets(updatedAssets)

      if (updatedAssets.length > 0) {
        const summary = summarizeMarketingKitAssets(updatedAssets)
        const persisted = await persistMarketingKitImages(summary, {
          projectId: currentProject?.id
        })
        setKitSummary(persisted)
        setPlayableOptions([])
        setVariations(null)
        setGenerationProgress(0)
      }
    } catch (err) {
      console.error('Failed to import marketing kit', err)
      setError('Could not process some files. Please try a different kit.')
    } finally {
      setIsImporting(false)
    }
  }, [assets, currentProject?.id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
      'text/plain': ['.txt']
    },
    multiple: true
  })

  const toggleSize = (id: string) => {
    setSizeChoices(prev =>
      prev.map(choice =>
        choice.id === id ? { ...choice, selected: !choice.selected } : choice
      )
    )
  }

  const ensureProject = useCallback(() => {
    let project = useProjectStore.getState().currentProject
    if (!project) {
      const fallbackName = kitSummary?.headline?.slice(0, 28) || 'Marketing Kit Playable'
      createProject(fallbackName, 'Marketing Kit')
      project = useProjectStore.getState().currentProject
    }
    return project
  }, [createProject, kitSummary?.headline])

  const handleGenerate = async () => {
    if (!kitSummary || selectedSizes.length === 0) {
      setError('Add your marketing kit and select at least one size.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage('Preparing variations…')
    setError(null)

    try {
      const result = await generatePlayableVariations(
        kitSummary,
        selectedSizes.map(size => ({ id: size.id, width: size.width, height: size.height })),
        (progress, message) => {
          setGenerationProgress(progress)
          setGenerationMessage(message)
        }
      )
      setVariations(result)
      const options: GeneratedPlayableOption[] = result.artboards.map(artboard => ({
        id: artboard.id,
        artboard,
        elements: result.elements.filter(el => el.artboardId === artboard.id),
        layout: artboard.name.includes('-') ? artboard.name.split('-').pop()?.trim() || 'Variation' : 'Variation',
        sizeLabel: `${artboard.width}×${artboard.height}`
      }))
      setPlayableOptions(options)
    } catch (err) {
      console.error('Failed to generate playables', err)
      setError('Generation failed. Please try again or simplify the kit.')
    } finally {
      setIsGenerating(false)
    }
  }

  const applyOption = (option: GeneratedPlayableOption, mode: 'replace' | 'append') => {
    const project = ensureProject()
    if (!project) return
    const baseCanvas = project.canvas
    const nextCanvas = {
      ...baseCanvas,
      artboards: mode === 'replace'
        ? [option.artboard]
        : [...(baseCanvas.artboards || []), option.artboard],
      elements: mode === 'replace'
        ? option.elements
        : [...(baseCanvas.elements || []), ...option.elements],
      selectedArtboardId: option.artboard.id,
      synchronizedEditing: true
    }
    updateProject(project.id, { canvas: nextCanvas })
    setLastAppliedInfo({
      projectName: project.name,
      variationLabel: `${option.sizeLabel} · ${option.layout}`
    })
  }

  const applyAllVariations = () => {
    if (!variations) return
    const project = ensureProject()
    if (!project) return
    const baseCanvas = project.canvas
    const nextCanvas = {
      ...baseCanvas,
      artboards: [...variations.artboards],
      elements: [...variations.elements],
      selectedArtboardId: variations.artboards[0]?.id || null,
      synchronizedEditing: true
    }
    updateProject(project.id, { canvas: nextCanvas })
    setLastAppliedInfo({
      projectName: project.name,
      variationLabel: 'All generated variations'
    })
  }

  const resetKit = () => {
    setAssets([])
    setKitSummary(null)
    setPlayableOptions([])
    setVariations(null)
    setGenerationProgress(0)
    setError(null)
  }

  const storageLabel = storageEstimate
    ? `${bytesToMB(storageEstimate.usage).toFixed(1)}MB of ${bytesToMB(storageEstimate.quota).toFixed(1)}MB`
    : 'Calculating…'

  return (
    <section id="marketing-kit-studio" className="bg-card border rounded-lg p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Marketing Kit Studio</h2>
          <p className="text-sm text-muted-foreground">
            Drop a marketing kit and instantly get multiple playable layouts wired with your assets.
          </p>
        </div>
        <Badge variant={storageStatus === 'persistent' ? 'default' : 'secondary'}>
          Storage {storageStatus === 'checking' ? '...' : storageStatus === 'persistent' ? 'locked in' : 'temporary'} • {storageLabel}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {lastAppliedInfo && (
            <Alert>
              <AlertDescription>
                Added “{lastAppliedInfo.variationLabel}” to <span className="font-semibold">{lastAppliedInfo.projectName}</span>. Open the Playable Layout Designer to iterate.
              </AlertDescription>
            </Alert>
          )}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/40'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{isDragActive ? 'Drop your kit to start' : 'Drop files or click to upload'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .zip bundles plus .png/.jpg/.svg images and .txt copy docs.
            </p>
          </div>

          <div className="rounded-lg border">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <p className="text-sm font-medium">Asset overview</p>
              <Button variant="ghost" size="sm" onClick={resetKit} disabled={assets.length === 0}>
                Reset
              </Button>
            </div>
            {assets.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                Drop your marketing kit to see detected assets and copy.
              </p>
            ) : (
              <ScrollArea className="h-36">
                <div className="p-3 space-y-2 text-sm">
                  {assets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between rounded border px-2 py-1">
                      <span className="truncate max-w-[180px]">
                        {asset.kind === 'image' ? '🖼 ' : '📄 '}
                        {asset.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{asset.kind}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Detected copy</p>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-1">
              <p><strong>Headline:</strong> {activeCopy.headline}</p>
              <p><strong>Body:</strong> {activeCopy.body}</p>
              <p><strong>CTA:</strong> {activeCopy.cta}</p>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Playable sizes</p>
              <span className="text-xs text-muted-foreground">{selectedSizes.length} selected</span>
            </div>
            <div className="space-y-2">
              {sizeChoices.map(choice => (
                <label key={choice.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={choice.selected} onCheckedChange={() => toggleSize(choice.id)} />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!kitSummary || selectedSizes.length === 0 || isGenerating || isImporting}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate playable options'}
            </Button>
            {variations && (
              <Button variant="secondary" className="w-full" onClick={applyAllVariations}>
                <Layers className="h-4 w-4 mr-2" />
                Push all variations to editor
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isGenerating && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">{generationMessage}</p>
              <Progress value={generationProgress} />
            </div>
          )}

          {playableOptions.length === 0 && !isGenerating && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Drop a marketing kit and generate variations to see ready-to-use playable layouts.
            </div>
          )}

          {playableOptions.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {playableOptions.map(option => (
                <div key={option.id} className="rounded-lg border p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{option.sizeLabel}</p>
                      <p className="text-xs text-muted-foreground">{option.layout}</p>
                    </div>
                    <Badge variant="outline">{kitSummary?.cta || 'CTA ready'}</Badge>
                  </div>
                  <VariationPreview artboard={option.artboard} elements={option.elements} />
                  <p className="text-xs text-muted-foreground">
                    Wired with your hero, background, logo, and copy from the marketing kit.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{option.elements.length} layers</span>
                    <span>Synchronized editing enabled</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" onClick={() => applyOption(option, 'replace')}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Use variation
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => applyOption(option, 'append')}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add as artboard
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface VariationPreviewProps {
  artboard: Artboard
  elements: CanvasElement[]
}

const VariationPreview = ({ artboard, elements }: VariationPreviewProps) => {
  const sorted = useMemo(
    () => [...elements].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0)),
    [elements]
  )

  const toPercent = (value: number, total: number) =>
    total === 0 ? 0 : (value / total) * 100

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border bg-slate-900/60"
      style={{ aspectRatio: `${artboard.width}/${artboard.height}` }}
    >
      {sorted.map(element => {
        const position = element.position ?? { x: 0, y: 0 }
        const size = element.size ?? { width: artboard.width, height: artboard.height }
        const style: CSSProperties = {
          left: `${toPercent(position.x, artboard.width)}%`,
          top: `${toPercent(position.y, artboard.height)}%`,
          width: `${toPercent(size.width, artboard.width)}%`,
          height: `${toPercent(size.height, artboard.height)}%`,
          zIndex: element.layer ?? 0
        }

        return (
          <div key={element.id} className="absolute" style={style}>
            {renderPreviewElement(element)}
          </div>
        )
      })}
    </div>
  )
}

const renderPreviewElement = (element: CanvasElement) => {
  switch (element.type) {
    case 'image':
      return (
        <LazyImage
          src={element.src || ''}
          alt={element.name}
          className="h-full w-full"
          imageClassName={`h-full w-full ${element.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
          draggable={false}
        />
      )
    case 'text':
      return (
        <div
          className="h-full w-full px-1 text-[8px] sm:text-[10px] flex items-center justify-center text-center"
          style={{
            color: element.color || '#fff',
            fontWeight: element.fontWeight || 600,
            fontSize: Math.min(Math.max(element.fontSize ?? 14, 10), 28),
            textTransform: element.templateRole === 'cta' ? 'uppercase' : 'none'
          }}
        >
          {element.text}
        </div>
      )
    case 'shape':
      return (
        <div
          className="h-full w-full"
          style={{
            background: element.fill || '#0ea5e9',
            borderRadius: element.radius || 0,
            border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || 'transparent'}` : undefined
          }}
        />
      )
    case 'slot':
      return (
        <div className="h-full w-full rounded bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 flex items-center justify-center text-[8px] text-slate-200">
          Gameplay
        </div>
      )
    default:
      return null
  }
}
