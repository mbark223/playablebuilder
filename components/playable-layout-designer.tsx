'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Grid,
  Ruler,
  Layers,
  ZoomIn,
  ZoomOut,
  Lock,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Type,
  Unlock,
  Upload,
  Undo2,
  Redo2,
  Download
} from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { cn, generateId } from '@/lib/utils'
import type {
  Artboard,
  BrandAsset,
  CanvasElement,
  CanvasFont,
  CanvasSettings,
  CanvasState as DesignerCanvasState,
  SlotProject,
  TextAlign
} from '@/types'

const SlotCanvas = dynamic(() => import('@/components/slot-canvas'), { ssr: false })

const DRAG_MIME = 'application/x-playable-layer'

interface DragPayload {
  type: 'text' | 'image' | 'shape'
  name: string
  src?: string
  assetId?: string
  color?: string
}

interface PlayableLayoutDesignerProps {
  project: SlotProject
  isSpinning: boolean
  onRequestSpin: () => void
}

const clamp = (value: number, min: number, max: number) => {
  if (max <= min) return min
  return Math.min(Math.max(value, min), max)
}

const brandImageCategories: Array<keyof SlotProject['brandAssets']> = [
  'logos',
  'banners',
  'screenshots'
]

export default function PlayableLayoutDesigner({ project, isSpinning, onRequestSpin }: PlayableLayoutDesignerProps) {
  const {
    currentProject,
    addCanvasElement,
    updateCanvasElement,
    removeCanvasElement,
    selectCanvasElement,
    bringElementForward,
    sendElementBackward,
  duplicateElementToArtboard,
  addArtboard,
  setActiveArtboard,
  addCanvasFont,
  removeCanvasFont,
  updateCanvasSettings,
  toggleElementLock,
  toggleElementVisibility,
  updateArtboardBackground,
  removeCanvasElements,
  nudgeSelectedElements,
  undoCanvas,
  redoCanvas
} = useProjectStore()
  
  const canvasState = useMemo<DesignerCanvasState>(() => {
    if (project.canvas && Array.isArray(project.canvas.artboards) && Array.isArray(project.canvas.elements)) {
      return project.canvas
    }
    return {
      artboards: [],
      fonts: [],
      elements: [],
      selectedArtboardId: null,
      selectedElementId: null,
      selectedElementIds: [],
      settings: {
        snapToGrid: true,
        gridSize: 10,
        showGuides: true,
        zoom: 0.9
      },
      history: {
        past: [],
        future: []
      }
    } as DesignerCanvasState
  }, [project.canvas])
  const fonts = canvasState.fonts
  const loadedFonts = useRef<Set<string>>(new Set())
  const selectedElementIds = useMemo(
    () => canvasState.selectedElementIds && canvasState.selectedElementIds.length > 0
      ? canvasState.selectedElementIds
      : canvasState.selectedElementId
        ? [canvasState.selectedElementId]
        : [],
    [canvasState.selectedElementIds, canvasState.selectedElementId]
  )
  
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    canvasState.fonts.forEach(font => {
      if (loadedFonts.current.has(font.id)) return
      const fontFace = new FontFace(font.name, `url(${font.dataUrl})`)
      fontFace.load().then((face) => {
        document.fonts.add(face)
        loadedFonts.current.add(font.id)
      }).catch(() => {
        // ignore
      })
    })
  }, [canvasState.fonts])
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.tagName === 'SELECT')) {
        return
      }
      
      const isMeta = event.metaKey || event.ctrlKey
      if (isMeta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redoCanvas()
        } else {
          undoCanvas()
        }
        return
      }
      
      if (isMeta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redoCanvas()
        return
      }
      
      if (event.key === 'Escape') {
        selectCanvasElement(null)
        return
      }
      
      if (selectedElementIds.length === 0) return
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        removeCanvasElements(selectedElementIds)
        return
      }
      
      const big = event.shiftKey
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        nudgeSelectedElements(-1, 0, { big })
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nudgeSelectedElements(1, 0, { big })
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        nudgeSelectedElements(0, -1, { big })
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        nudgeSelectedElements(0, 1, { big })
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementIds, removeCanvasElements, nudgeSelectedElements, undoCanvas, redoCanvas, selectCanvasElement])
  
  const imageAssets = useMemo<BrandAsset[]>(() => {
    if (!currentProject) return []
    return brandImageCategories.flatMap(category => currentProject.brandAssets[category])
      .filter(asset => asset.type === 'image')
  }, [currentProject])
  const [exportingArtboardId, setExportingArtboardId] = useState<string | null>(null)
  
  const handleDropElement = useCallback((
    payload: DragPayload,
    artboard: Artboard,
    dropPosition: { x: number; y: number }
  ) => {
    const baseWidth = payload.type === 'text' ? Math.min(artboard.width * 0.8, 640) : 320
    const baseHeight =
      payload.type === 'text'
        ? 180
        : payload.type === 'shape'
          ? 120
          : 320
    
    const position = {
      x: clamp(dropPosition.x - baseWidth / 2, 0, artboard.width - baseWidth),
      y: clamp(dropPosition.y - baseHeight / 2, 0, artboard.height - baseHeight)
    }
    
    if (payload.type === 'text') {
      addCanvasElement(artboard.id, {
        name: payload.name,
        type: 'text',
        text: 'Double click to edit headline',
        fontSize: 64,
        fontWeight: 700,
        color: payload.color || '#ffffff',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.2,
        autoWidth: false,
        position,
        size: {
          width: baseWidth,
          height: baseHeight
        },
        opacity: 1,
        rotation: 0,
        locked: false,
        visible: true
      })
      return
    }
    
    if (payload.type === 'shape') {
      addCanvasElement(artboard.id, {
        name: payload.name,
        type: 'shape',
        fill: payload.color || '#ff4d17',
        borderColor: '#ffb347',
        borderWidth: 0,
        radius: 32,
        position,
        size: {
          width: baseWidth,
          height: baseHeight
        },
        opacity: 0.9,
        rotation: 0,
        locked: false,
        visible: true
      })
      return
    }
    
    addCanvasElement(artboard.id, {
      name: payload.name,
      type: 'image',
      assetId: payload.assetId,
      src: payload.src || '',
      fit: 'contain',
      maintainAspect: true,
      position,
      size: {
        width: baseWidth,
        height: baseHeight
      },
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true
    })
  }, [addCanvasElement])
  
  const handleArtboardAdd = () => {
    addArtboard({
      name: 'Custom Size',
      width: 1080,
      height: 1920,
      background: '#050505'
    })
  }
  
  if (!currentProject) {
    return null
  }
  
  const settings = canvasState.settings ?? {
    snapToGrid: true,
    gridSize: 10,
    showGuides: true,
    zoom: 1
  }
  
  if (canvasState.artboards.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        <p>No artboards yet. Add your first size to start designing.</p>
        <Button className="mt-4" onClick={handleArtboardAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Artboard
        </Button>
      </div>
    )
  }
  
  const selectedArtboardId = canvasState.selectedArtboardId ?? canvasState.artboards[0].id
  const selectedArtboard = canvasState.artboards.find(board => board.id === selectedArtboardId) ?? canvasState.artboards[0]
  const primarySelectedId = selectedElementIds[0] ?? null
  const selectedElement = canvasState.elements.find(el => el.id === primarySelectedId)
  const selectedElementCount = selectedElementIds.length
  const canUndo = (canvasState.history?.past?.length ?? 0) > 0
  const canRedo = (canvasState.history?.future?.length ?? 0) > 0
  
  const quickDrop = (payload: DragPayload, anchor?: { x: number; y: number }) => {
    const artboard = selectedArtboard
    if (!artboard) return
    const dropPoint = anchor || { x: artboard.width / 2, y: artboard.height / 2 }
    handleDropElement(payload, artboard, dropPoint)
  }
  
  const handleAddHeadline = () => {
    const artboard = selectedArtboard
    if (!artboard) return
    quickDrop(
      {
        type: 'text',
        name: 'Headline',
        color: '#ffffff'
      },
      { x: artboard.width / 2, y: artboard.height * 0.2 }
    )
  }
  
  const handleAddCTA = () => {
    const artboard = selectedArtboard
    if (!artboard) return
    quickDrop(
      {
        type: 'shape',
        name: 'CTA Button',
        color: '#ff4d17'
      },
      { x: artboard.width / 2, y: artboard.height * 0.75 }
    )
  }
  
  const handleAddBodyText = () => {
    const artboard = selectedArtboard
    if (!artboard) return
    quickDrop(
      {
        type: 'text',
        name: 'Body Copy',
        color: '#f8fafc'
      },
      { x: artboard.width / 2, y: artboard.height * 0.4 }
    )
  }
  
  const handleZoomChange = (value: number) => {
    const clamped = clamp(value, 0.6, 1.4)
    updateCanvasSettings({ zoom: clamped })
  }
  
  const handleToggleSnap = () => {
    updateCanvasSettings({ snapToGrid: !settings.snapToGrid })
  }
  
  const handleToggleGuides = () => {
    updateCanvasSettings({ showGuides: !settings.showGuides })
  }
  
  const handleGridSizeChange = (value: number) => {
    updateCanvasSettings({ gridSize: clamp(Math.round(value), 4, 40) })
  }
  
  const handleBackgroundChange = (artboardId: string, color: string) => {
    updateArtboardBackground(artboardId, color)
  }
  
  const handleExportArtboard = useCallback(async (artboardId: string) => {
    const artboard = canvasState.artboards.find(board => board.id === artboardId)
    if (!artboard) return
    const elements = canvasState.elements.filter(el => el.artboardId === artboardId)
    setExportingArtboardId(artboardId)
    try {
      await document.fonts.ready
      const dataUrl = await renderArtboardToImage(artboard, elements, fonts)
      const safeName = artboard.name.replace(/\s+/g, '-').toLowerCase()
      downloadDataUrl(dataUrl, `${safeName || 'artboard'}.png`)
    } catch (error) {
      console.error('Failed to export artboard', error)
    } finally {
      setExportingArtboardId((current) => (current === artboardId ? null : current))
    }
  }, [canvasState.artboards, canvasState.elements, fonts])
  
  const handleExportAll = useCallback(async () => {
    for (const board of canvasState.artboards) {
      await handleExportArtboard(board.id)
    }
  }, [canvasState.artboards, handleExportArtboard])
  
  return (
    <div className="space-y-4">
      <DesignerToolbar
        hasArtboard={Boolean(selectedArtboard)}
        onAddHeadline={handleAddHeadline}
        onAddBody={handleAddBodyText}
        onAddCTA={handleAddCTA}
        onAddArtboard={handleArtboardAdd}
        onToggleSnap={handleToggleSnap}
        onToggleGuides={handleToggleGuides}
        settings={settings}
        onZoomChange={handleZoomChange}
        onGridSizeChange={handleGridSizeChange}
        onExportAll={handleExportAll}
        isExporting={Boolean(exportingArtboardId)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoCanvas}
        onRedo={redoCanvas}
      />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <ElementLibrary imageAssets={imageAssets} />
          <FontManager
            fonts={fonts}
            addFont={addCanvasFont}
            removeFont={removeCanvasFont}
          />
        </div>
        
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Artboards</p>
              <p className="font-semibold text-base">Design multiple sizes in parallel</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleArtboardAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Size
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {canvasState.artboards.map((artboard) => (
              <ArtboardSurface
                key={artboard.id}
                artboard={artboard}
                elements={canvasState.elements.filter(el => el.artboardId === artboard.id)}
                isSelected={artboard.id === selectedArtboardId}
                isSpinning={isSpinning}
            fonts={fonts}
            selectedElementIds={selectedElementIds}
            project={project}
            onDropElement={handleDropElement}
            onSelectElement={selectCanvasElement}
            onArtboardSelect={() => setActiveArtboard(artboard.id)}
            onElementChange={updateCanvasElement}
            onRequestSpin={onRequestSpin}
            settings={settings}
            onBackgroundChange={handleBackgroundChange}
            onExportArtboard={handleExportArtboard}
            isExporting={exportingArtboardId === artboard.id}
          />
        ))}
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-3 space-y-4">
        <LayersPanel
          artboard={selectedArtboard}
          elements={canvasState.elements.filter(el => el.artboardId === selectedArtboard.id).sort((a, b) => b.layer - a.layer)}
          selectedElementIds={selectedElementIds}
          onSelect={selectCanvasElement}
          onBringForward={bringElementForward}
          onSendBackward={sendElementBackward}
          onDuplicate={duplicateElementToArtboard}
          onDelete={removeCanvasElement}
          onToggleLock={toggleElementLock}
          onToggleVisibility={toggleElementVisibility}
        />
        
        <ElementInspector
          element={selectedElement}
          fonts={fonts}
          onChange={updateCanvasElement}
          artboard={selectedArtboard}
          onToggleLock={toggleElementLock}
          onToggleVisibility={toggleElementVisibility}
          selectedCount={selectedElementCount}
        />
        </div>
      </div>
    </div>
  )
}

interface ArtboardSurfaceProps {
  artboard: Artboard
  elements: CanvasElement[]
  selectedElementIds: string[]
  isSelected: boolean
  isSpinning: boolean
  fonts: CanvasFont[]
  project: SlotProject
  settings: CanvasSettings
  onDropElement: (payload: DragPayload, artboard: Artboard, point: { x: number; y: number }) => void
  onSelectElement: (id: string | null, options?: { append?: boolean; toggle?: boolean }) => void
  onArtboardSelect: () => void
  onElementChange: (id: string, updates: Partial<CanvasElement>) => void
  onRequestSpin: () => void
  onBackgroundChange: (id: string, color: string) => void
  onExportArtboard: (id: string) => void
  isExporting: boolean
}

function ArtboardSurface({
  artboard,
  elements,
  selectedElementIds,
  isSelected,
  isSpinning,
  fonts,
  project,
  settings,
  onDropElement,
  onSelectElement,
  onArtboardSelect,
  onElementChange,
  onRequestSpin,
  onBackgroundChange,
  onExportArtboard,
  isExporting
}: ArtboardSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseScale = useMemo(() => {
    const maxWidth = 320
    const maxHeight = 520
    return Math.min(maxWidth / artboard.width, maxHeight / artboard.height)
  }, [artboard.height, artboard.width])
  const zoomScale = baseScale * (settings.zoom || 1)
  const orderedElements = useMemo(
    () => [...elements].sort((a, b) => a.layer - b.layer),
    [elements]
  )
  const [guides, setGuides] = useState<{ vertical: number | null; horizontal: number | null }>({
    vertical: null,
    horizontal: null
  })
  const gridSize = settings.gridSize || 10
  const applySnap = useCallback(
    (value: number) => {
      if (!settings.snapToGrid) return value
      return Math.round(value / gridSize) * gridSize
    },
    [gridSize, settings.snapToGrid]
  )
  const gridStyles = settings.snapToGrid
    ? {
        backgroundImage: `
          linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize * zoomScale}px ${gridSize * zoomScale}px`
      }
    : {}
  const handleArtboardClick = () => {
    onArtboardSelect()
    onSelectElement(null)
  }
  
  const updateGuides = useCallback((position: { x: number; y: number }, size: { width: number; height: number }) => {
    if (!settings.showGuides) {
      setGuides({ vertical: null, horizontal: null })
      return
    }
    const centerX = position.x + size.width / 2
    const centerY = position.y + size.height / 2
    setGuides({
      vertical: Math.abs(centerX - artboard.width / 2) <= 8 ? artboard.width / 2 : null,
      horizontal: Math.abs(centerY - artboard.height / 2) <= 8 ? artboard.height / 2 : null
    })
  }, [artboard.height, artboard.width, settings.showGuides])
  
  const clearGuides = useCallback(() => {
    setGuides({ vertical: null, horizontal: null })
  }, [])

  const handleElementSelection = (event: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean }, elementId: string) => {
    const isToggle = event.metaKey || event.ctrlKey
    const append = isToggle || event.shiftKey
    onSelectElement(elementId, { append, toggle: isToggle })
  }
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const rawData = event.dataTransfer.getData(DRAG_MIME)
    if (!rawData) return
    event.preventDefault()
    const payload = JSON.parse(rawData) as DragPayload
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const point = {
      x: (event.clientX - rect.left) / zoomScale,
      y: (event.clientY - rect.top) / zoomScale
    }
    onDropElement(payload, artboard, point)
  }
  
  const startResize = (event: React.PointerEvent<HTMLDivElement>, element: CanvasElement, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    if (element.locked) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    event.preventDefault()
    event.stopPropagation()
    const startSize = { ...element.size }
    const startPosition = { ...element.position }
    const startX = event.clientX
    const startY = event.clientY
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoomScale
      const deltaY = (moveEvent.clientY - startY) / zoomScale
      
      let nextWidth = startSize.width
      let nextHeight = startSize.height
      let nextX = startPosition.x
      let nextY = startPosition.y
      
      if (handle.includes('e')) {
        nextWidth = startSize.width + deltaX
      }
      if (handle.includes('s')) {
        nextHeight = startSize.height + deltaY
      }
      if (handle.includes('w')) {
        nextWidth = startSize.width - deltaX
        nextX = startPosition.x + deltaX
      }
      if (handle.includes('n')) {
        nextHeight = startSize.height - deltaY
        nextY = startPosition.y + deltaY
      }
      
      const clampedWidth = clamp(nextWidth, 32, artboard.width - nextX)
      const clampedHeight = clamp(nextHeight, 32, artboard.height - nextY)
      const snappedSize = {
        width: applySnap(clampedWidth),
        height: applySnap(clampedHeight)
      }
      
      const snappedPosition = {
        x: applySnap(clamp(nextX, 0, artboard.width - snappedSize.width)),
        y: applySnap(clamp(nextY, 0, artboard.height - snappedSize.height))
      }
      
      updateGuides(snappedPosition, snappedSize)
      onElementChange(element.id, {
        position: snappedPosition,
        size: snappedSize
      })
    }
    
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      clearGuides()
    }
    
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }
  
  const startDrag = (event: React.PointerEvent<HTMLDivElement>, element: CanvasElement) => {
    if (element.locked) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    event.preventDefault()
    event.stopPropagation()
    const origin = { ...element.position }
    const startX = event.clientX
    const startY = event.clientY
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoomScale
      const deltaY = (moveEvent.clientY - startY) / zoomScale
      const tentative = {
        x: clamp(origin.x + deltaX, 0, artboard.width - element.size.width),
        y: clamp(origin.y + deltaY, 0, artboard.height - element.size.height)
      }
      const snapped = {
        x: applySnap(tentative.x),
        y: applySnap(tentative.y)
      }
      updateGuides(snapped, element.size)
      onElementChange(element.id, { position: snapped })
    }
    
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      clearGuides()
    }
    
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }
  
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        isSelected ? 'border-primary shadow-lg' : 'border-border'
      )}
      onClick={handleArtboardClick}
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <p className="text-sm font-medium">{artboard.name}</p>
          <p className="text-xs text-muted-foreground">{artboard.width}×{artboard.height}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <Palette className="h-3 w-3" />
            <input
              type="color"
              value={artboard.background}
              className="h-6 w-6 cursor-pointer rounded border bg-background"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                onBackgroundChange(artboard.id, e.target.value)
              }}
            />
          </label>
          <Button
            size="sm"
            variant="ghost"
            disabled={isExporting}
            onClick={(e) => {
              e.stopPropagation()
              onExportArtboard(artboard.id)
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            {isExporting ? 'Exporting...' : 'Export PNG'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isSpinning || project.config.symbols.length === 0}
            onClick={(e) => {
              e.stopPropagation()
              onRequestSpin()
            }}
          >
            Spin
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={cn(
          'relative border overflow-hidden',
          'rounded-md',
          isSelected ? 'ring-2 ring-primary/40' : ''
        )}
        style={{
          width: artboard.width * zoomScale,
          height: artboard.height * zoomScale,
          backgroundColor: artboard.background,
          ...gridStyles
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {orderedElements.map((element) => {
          const style = {
            width: element.size.width * zoomScale,
            height: element.size.height * zoomScale,
            transform: `translate(${element.position.x * zoomScale}px, ${element.position.y * zoomScale}px) rotate(${element.rotation}deg)`,
            opacity: element.visible === false ? 0.25 : element.opacity
          }
          const isSelectedElement = selectedElementIds.includes(element.id)
          const showHandles = isSelectedElement && element.visible !== false && !element.locked
          
          return (
            <div
              key={element.id}
              className={cn(
                'absolute select-none',
                isSelectedElement ? 'ring-2 ring-primary' : 'ring-0',
                element.locked ? 'cursor-default' : 'cursor-move',
                element.visible === false ? 'opacity-50' : ''
              )}
              style={style}
              onPointerDown={(e) => {
                handleElementSelection(e, element.id)
                startDrag(e, element)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onSelectElement(element.id)
              }}
            >
              <ElementRenderer
                element={element}
                fonts={fonts}
                project={project}
                isSpinning={isSpinning}
                isActiveArtboard={isSelected}
              />
              {showHandles && (
                <>
                  {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                    <div
                      key={handle}
                      className="absolute h-3 w-3 rounded-full border border-white bg-primary shadow cursor-pointer"
                      style={getHandleStyle(handle)}
                      onPointerDown={(e) => {
                        handleElementSelection(e, element.id)
                        startResize(e, element, handle)
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          )
        })}
        
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Drag brand assets or text into this artboard
          </div>
        )}
        {settings.showGuides && guides.vertical !== null && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/50"
            style={{ left: (guides.vertical ?? 0) * zoomScale }}
          />
        )}
        {settings.showGuides && guides.horizontal !== null && (
          <div
            className="pointer-events-none absolute left-0 right-0 h-px bg-primary/50"
            style={{ top: (guides.horizontal ?? 0) * zoomScale }}
          />
        )}
      </div>
    </div>
  )
}

const getHandleStyle = (handle: 'nw' | 'ne' | 'sw' | 'se') => {
  const base = { marginTop: -6, marginLeft: -6 }
  switch (handle) {
    case 'nw':
      return { ...base, top: 0, left: 0, cursor: 'nwse-resize' }
    case 'ne':
      return { ...base, top: 0, right: 0, cursor: 'nesw-resize' }
    case 'sw':
      return { ...base, bottom: 0, left: 0, cursor: 'nesw-resize' }
    case 'se':
    default:
      return { ...base, bottom: 0, right: 0, cursor: 'nwse-resize' }
  }
}

interface ElementRendererProps {
  element: CanvasElement
  fonts: CanvasFont[]
  project: SlotProject
  isSpinning: boolean
  isActiveArtboard: boolean
}

function ElementRenderer({ element, fonts, project, isSpinning, isActiveArtboard }: ElementRendererProps) {
  if (element.type === 'image') {
    return (
      <img
        src={element.src}
        alt={element.name}
        className="h-full w-full object-contain rounded"
        draggable={false}
      />
    )
  }
  
  if (element.type === 'shape') {
    return (
      <div
        className="h-full w-full"
        style={{
          background: element.fill,
          borderRadius: element.radius,
          border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor}` : undefined
        }}
      />
    )
  }
  
  if (element.type === 'slot') {
    if (!isActiveArtboard) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 text-xs text-white/70">
          Gameplay preview
        </div>
      )
    }
    
    return (
      <div className="h-full w-full rounded overflow-hidden pointer-events-none">
        <SlotCanvas project={project} isSpinning={isSpinning} onSpin={() => {}} />
      </div>
    )
  }
  
  const fontFamily = element.fontId
    ? fonts.find(font => font.id === element.fontId)?.name
    : 'inherit'
  
  return (
    <div
      className="h-full w-full px-2 py-1"
      style={{
        fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
        lineHeight: element.lineHeight,
        letterSpacing: `${element.letterSpacing}px`,
        whiteSpace: 'pre-line'
      }}
    >
      {element.text}
    </div>
  )
}

interface DesignerToolbarProps {
  hasArtboard: boolean
  onAddHeadline: () => void
  onAddBody: () => void
  onAddCTA: () => void
  onAddArtboard: () => void
  settings: CanvasSettings
  onToggleSnap: () => void
  onToggleGuides: () => void
  onZoomChange: (value: number) => void
  onGridSizeChange: (value: number) => void
  onExportAll: () => void
  isExporting: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

function DesignerToolbar({
  hasArtboard,
  onAddHeadline,
  onAddBody,
  onAddCTA,
  onAddArtboard,
  settings,
  onToggleSnap,
  onToggleGuides,
  onZoomChange,
  onGridSizeChange,
  onExportAll,
  isExporting,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: DesignerToolbarProps) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAddHeadline} disabled={!hasArtboard}>
          <Sparkles className="h-4 w-4 mr-1" />
          Headline
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddBody} disabled={!hasArtboard}>
          <Type className="h-4 w-4 mr-1" />
          Body
        </Button>
        <Button size="sm" variant="ghost" onClick={onAddCTA} disabled={!hasArtboard}>
          <Layers className="h-4 w-4 mr-1" />
          CTA Card
        </Button>
        <Button size="sm" variant="outline" onClick={onAddArtboard}>
          <Plus className="h-4 w-4 mr-1" />
          Artboard
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportAll} disabled={isExporting || !hasArtboard}>
          <Download className="h-4 w-4 mr-1" />
          {isExporting ? 'Exporting…' : 'Export All'}
        </Button>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-3 py-1',
            settings.snapToGrid ? 'border-primary/60 text-primary' : ''
          )}
          onClick={onToggleSnap}
        >
          <Grid className="h-3 w-3" />
          Snap
        </button>
        <button
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-3 py-1',
            settings.showGuides ? 'border-primary/60 text-primary' : ''
          )}
          onClick={onToggleGuides}
        >
          <Ruler className="h-3 w-3" />
          Guides
        </button>
        <label className="flex items-center gap-2">
          <span>Grid</span>
          <input
            type="number"
            min={4}
            max={40}
            value={settings.gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="w-16 rounded border bg-background px-2 py-1"
          />
        </label>
        <div className="flex items-center gap-1">
          <ZoomOut className="h-4 w-4" />
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.05}
            value={settings.zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-24"
          />
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

const imageCache = new Map<string, HTMLImageElement>()

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!
  }
  const image = new Image()
  image.crossOrigin = 'anonymous'
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = reject
  })
  image.src = src
  const loaded = await promise
  imageCache.set(src, loaded)
  return loaded
}

async function renderArtboardToImage(artboard: Artboard, elements: CanvasElement[], fonts: CanvasFont[]): Promise<string> {
  const scale = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = artboard.width * scale
  canvas.height = artboard.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to render artboard')
  ctx.scale(scale, scale)
  ctx.fillStyle = artboard.background || '#000000'
  ctx.fillRect(0, 0, artboard.width, artboard.height)
  
  const ordered = elements
    .filter(el => el.visible !== false)
    .sort((a, b) => a.layer - b.layer)
  
  for (const element of ordered) {
    if (element.type === 'shape') {
      drawShapeElement(ctx, element)
    } else if (element.type === 'text') {
      await drawTextElement(ctx, element, fonts)
    } else if (element.type === 'image') {
      await drawImageElement(ctx, element)
    } else if (element.type === 'slot') {
      drawSlotPlaceholder(ctx, element)
    }
  }
  
  return canvas.toDataURL('image/png')
}

function drawShapeElement(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (element.type !== 'shape') return
  const { position, size, radius, fill, borderColor, borderWidth } = element
  ctx.save()
  const r = Math.min(radius, size.width / 2, size.height / 2)
  drawRoundedRect(ctx, position.x, position.y, size.width, size.height, r)
  ctx.fillStyle = fill
  ctx.fill()
  if (borderWidth && borderWidth > 0) {
    ctx.lineWidth = borderWidth
    ctx.strokeStyle = borderColor
    ctx.stroke()
  }
  ctx.restore()
}

async function drawTextElement(ctx: CanvasRenderingContext2D, element: CanvasElement, fonts: CanvasFont[]) {
  if (element.type !== 'text') return
  const { position, size, fontId, fontSize, fontWeight, color, textAlign, lineHeight, text } = element
  const fontName = fontId ? fonts.find(font => font.id === fontId)?.name : undefined
  const fontFamily = fontName ? `"${fontName}"` : 'system-ui'
  ctx.save()
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.textAlign = textAlign as CanvasTextAlign
  const maxWidth = size.width - 8
  const originX = textAlign === 'center' ? position.x + size.width / 2
    : textAlign === 'right'
      ? position.x + size.width
      : position.x
  const lines: string[] = []
  text.split('\n').forEach(line => {
    lines.push(...wrapText(ctx, line, maxWidth))
  })
  const actualLineHeight = fontSize * lineHeight
  lines.forEach((line, index) => {
    ctx.fillText(line, originX, position.y + index * actualLineHeight, maxWidth)
  })
  ctx.restore()
}

async function drawImageElement(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  if (element.type !== 'image' || !element.src) return
  const { position, size, src, fit } = element
  const image = await loadImage(src)
  const scaleX = size.width / image.width
  const scaleY = size.height / image.height
  const scale = fit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const dx = position.x + (size.width - drawWidth) / 2
  const dy = position.y + (size.height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
}

function drawSlotPlaceholder(ctx: CanvasRenderingContext2D, element: CanvasElement) {
  const { position, size } = element
  ctx.save()
  const gradient = ctx.createLinearGradient(position.x, position.y, position.x + size.width, position.y + size.height)
  gradient.addColorStop(0, '#14141F')
  gradient.addColorStop(1, '#111827')
  drawRoundedRect(ctx, position.x, position.y, size.width, size.height, 24)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 18px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Gameplay Preview', position.x + size.width / 2, position.y + size.height / 2)
  ctx.restore()
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  words.forEach(word => {
    const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

interface ElementLibraryProps {
  imageAssets: BrandAsset[]
}

function ElementLibrary({ imageAssets }: ElementLibraryProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, payload: DragPayload) => {
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = 'copy'
  }
  
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold mb-3">Element Library</p>
      <div
        className="rounded-md border border-dashed border-muted-foreground/40 p-3 mb-3 cursor-grab"
        draggable
        onDragStart={(e) => handleDragStart(e, { type: 'text', name: 'Text Block', color: '#ffffff' })}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Type className="h-4 w-4" />
          Headline / Body Text
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Drag to create a text block. Upload custom fonts below.
        </p>
      </div>
      
      <div
        className="rounded-md border border-dashed border-muted-foreground/40 p-3 mb-3 cursor-grab"
        draggable
        onDragStart={(e) => handleDragStart(e, { type: 'shape', name: 'CTA Button', color: '#ff4d17' })}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4" />
          CTA Card
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Drop to add a rounded rectangle for buttons or framing.
        </p>
      </div>
      
      <ScrollArea className="h-64 rounded border p-2">
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Brand Assets</p>
        {imageAssets.length === 0 && (
          <p className="text-xs text-muted-foreground">Upload logos, banners, or screenshots to drag onto an artboard.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {imageAssets.map(asset => (
            <div
              key={asset.id}
              className="rounded border bg-background p-2 cursor-grab"
              draggable
              onDragStart={(e) => handleDragStart(e, {
                type: 'image',
                name: asset.name,
                src: asset.url,
                assetId: asset.id
              })}
              title={asset.name}
            >
              <img src={asset.url} alt={asset.name} className="h-16 w-full object-contain" />
              <p className="mt-1 text-xs truncate">{asset.name}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface LayersPanelProps {
  artboard: Artboard
  elements: CanvasElement[]
  selectedElementIds: string[]
  onSelect: (id: string | null, options?: { append?: boolean; toggle?: boolean }) => void
  onBringForward: (id: string) => void
  onSendBackward: (id: string) => void
  onDuplicate: (id: string, targetArtboard: string) => void
  onDelete: (id: string) => void
  onToggleLock: (id: string) => void
  onToggleVisibility: (id: string) => void
}

function LayersPanel({
  artboard,
  elements,
  selectedElementIds,
  onSelect,
  onBringForward,
  onSendBackward,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleVisibility
}: LayersPanelProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Layers</p>
        <span className="text-xs text-muted-foreground">{elements.length}</span>
      </div>
      <ScrollArea className="max-h-64">
        {elements.length === 0 && (
          <p className="px-4 pb-4 text-xs text-muted-foreground">Drop elements onto {artboard.name} to populate layers.</p>
        )}
        <div className="flex flex-col">
          {elements.map(element => (
            <div
              key={element.id}
              className={cn(
                'flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 cursor-pointer',
                selectedElementIds.includes(element.id) ? 'bg-muted' : ''
              )}
              onClick={(e) => onSelect(element.id, {
                append: e.metaKey || e.ctrlKey || e.shiftKey,
                toggle: e.metaKey || e.ctrlKey
              })}
            >
              <div>
                <p className="font-medium">{element.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{element.type}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(element.id)
                }}>
                  {element.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock(element.id)
                }}>
                  {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onSendBackward(element.id)
                }}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onBringForward(element.id)
                }}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(element.id, artboard.id)
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation()
                  onDelete(element.id)
                }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ElementInspectorProps {
  element?: CanvasElement
  fonts: CanvasFont[]
  onChange: (id: string, updates: Partial<CanvasElement>) => void
  artboard: Artboard
  onToggleLock: (id: string) => void
  onToggleVisibility: (id: string) => void
  selectedCount: number
}

function ElementInspector({ element, fonts, onChange, artboard, onToggleLock, onToggleVisibility, selectedCount }: ElementInspectorProps) {
  const handleInput = (key: keyof CanvasElement['position'] | keyof CanvasElement['size'], value: number) => {
    if (!element) return
    if (key === 'x' || key === 'y') {
      const dimension = key === 'x' ? artboard.width - element.size.width : artboard.height - element.size.height
      const clamped = clamp(value, 0, Math.max(dimension, 0))
      onChange(element.id, {
        position: {
          ...element.position,
          [key]: clamped
        }
      })
    } else {
      const maxSize = key === 'width' ? artboard.width : artboard.height
      const clamped = clamp(value, 32, maxSize)
      onChange(element.id, {
        size: {
          ...element.size,
          [key]: clamped
        }
      })
    }
  }
  
  if (!element) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Select a layer to edit its properties.
      </div>
    )
  }
  
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 text-sm">
      {selectedCount > 1 && element && (
        <p className="text-xs text-muted-foreground">
          Editing first of {selectedCount} selected layers.
        </p>
      )}
      <div>
        <p className="text-xs uppercase text-muted-foreground">Name</p>
        <input
          className="mt-1 w-full rounded border bg-background px-2 py-1"
          value={element.name}
          onChange={(e) => onChange(element.id, { name: e.target.value })}
        />
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onToggleVisibility(element.id)}
        >
          {element.visible === false ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onToggleLock(element.id)}
        >
          {element.locked ? (
            <>
              <Unlock className="h-3 w-3 mr-1" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Lock
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={Math.round(element.position.x)}
          min={0}
          max={artboard.width}
          onChange={(v) => handleInput('x', v)}
        />
        <NumberField
          label="Y"
          value={Math.round(element.position.y)}
          min={0}
          max={artboard.height}
          onChange={(v) => handleInput('y', v)}
        />
        <NumberField
          label="Width"
          value={Math.round(element.size.width)}
          min={32}
          max={artboard.width}
          onChange={(v) => handleInput('width', v)}
        />
        <NumberField
          label="Height"
          value={Math.round(element.size.height)}
          min={32}
          max={artboard.height}
          onChange={(v) => handleInput('height', v)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Opacity"
          min={0}
          max={1}
          step={0.05}
          value={Number(element.opacity.toFixed(2))}
          onChange={(v) => onChange(element.id, { opacity: clamp(v, 0, 1) })}
        />
        <NumberField
          label="Rotation"
          min={-180}
          max={180}
          value={Math.round(element.rotation)}
          onChange={(v) => onChange(element.id, { rotation: v })}
        />
      </div>
      
      {element.type === 'text' && (
        <div className="space-y-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Content</p>
            <textarea
              className="mt-1 h-24 w-full rounded border bg-background px-2 py-1"
              value={element.text}
              onChange={(e) => onChange(element.id, { text: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Font Size"
              min={10}
              max={200}
              value={element.fontSize}
              onChange={(v) => onChange(element.id, { fontSize: v })}
            />
            <NumberField
              label="Line Height"
              min={0.8}
              max={2}
              step={0.05}
              value={Number(element.lineHeight)}
              onChange={(v) => onChange(element.id, { lineHeight: v })}
            />
            <NumberField
              label="Letter Spacing"
              min={-5}
              max={20}
              value={element.letterSpacing}
              onChange={(v) => onChange(element.id, { letterSpacing: v })}
            />
            <NumberField
              label="Weight"
              min={100}
              max={900}
              step={100}
              value={element.fontWeight}
              onChange={(v) => onChange(element.id, { fontWeight: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Font</p>
              <select
                className="mt-1 w-full rounded border bg-background px-2 py-1"
                value={element.fontId || ''}
                onChange={(e) => onChange(element.id, { fontId: e.target.value || undefined })}
              >
                <option value="">Default</option>
                {fonts.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Align</p>
              <select
                className="mt-1 w-full rounded border bg-background px-2 py-1"
                value={element.textAlign}
                onChange={(e) => onChange(element.id, { textAlign: e.target.value as TextAlign })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Color</p>
            <input
              type="color"
              className="mt-1 h-8 w-full cursor-pointer rounded border bg-background"
              value={element.color}
              onChange={(e) => onChange(element.id, { color: e.target.value })}
            />
          </div>
        </div>
      )}
      
      {element.type === 'shape' && (
        <div className="space-y-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Fill</p>
            <input
              type="color"
              className="mt-1 h-8 w-full cursor-pointer rounded border bg-background"
              value={element.fill}
              onChange={(e) => onChange(element.id, { fill: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Border"
              min={0}
              max={40}
              value={element.borderWidth}
              onChange={(v) => onChange(element.id, { borderWidth: v })}
            />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Border Color</p>
              <input
                type="color"
                className="mt-1 h-8 w-full cursor-pointer rounded border bg-background"
                value={element.borderColor}
                onChange={(e) => onChange(element.id, { borderColor: e.target.value })}
              />
            </div>
          </div>
          <NumberField
            label="Radius"
            min={0}
            max={200}
            value={element.radius}
            onChange={(v) => onChange(element.id, { radius: v })}
          />
        </div>
      )}
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  step?: number
}

function NumberField({ label, value, min, max, onChange, step = 1 }: NumberFieldProps) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <input
        type="number"
        className="mt-1 w-full rounded border bg-background px-2 py-1"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const nextValue = Number(e.target.value)
          if (Number.isNaN(nextValue)) return
          onChange(nextValue)
        }}
      />
    </div>
  )
}

interface FontManagerProps {
  fonts: CanvasFont[]
  addFont: (font: CanvasFont) => void
  removeFont: (id: string) => void
}

function FontManager({ fonts, addFont, removeFont }: FontManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const dataUrl = await readFileAsDataUrl(file)
    const name = file.name.replace(/\.[^/.]+$/, '')
    addFont({
      id: generateId(),
      name,
      dataUrl,
      format: determineFontFormat(file.name)
    })
    
    event.target.value = ''
  }
  
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Fonts</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      <div className="space-y-2">
        {fonts.length === 0 && (
          <p className="text-xs text-muted-foreground">Add brand fonts to keep text on-brand.</p>
        )}
        {fonts.map(font => (
          <div
            key={font.id}
            className="flex items-center justify-between rounded border bg-background px-2 py-1 text-sm"
          >
            <span>{font.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeFont(font.id)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function determineFontFormat(name: string): CanvasFont['format'] {
  if (name.endsWith('.otf')) return 'otf'
  if (name.endsWith('.woff')) return 'woff'
  if (name.endsWith('.woff2')) return 'woff2'
  return 'ttf'
}
