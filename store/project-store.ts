import { create, type StoreApi } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  SlotProject,
  Symbol,
  ReelConfiguration,
  PaylineConfig,
  FeatureTrigger,
  MathModel,
  BrandAsset,
  CanvasElement,
  CanvasElementInput,
  CanvasFont,
  CanvasState,
  Artboard,
  CanvasSettings,
  CanvasSnapshot
} from '@/types'
import type { PlayableTemplate, TemplateVisuals } from '@/types/templates'
import { generateId } from '@/lib/utils'

interface ProjectStore {
  currentProject: SlotProject | null
  projects: SlotProject[]
  
  // Project actions
  createProject: (name: string, brand: string) => void
  createProjectFromTemplate: (name: string, brand: string, template: PlayableTemplate) => void
  updateProject: (id: string, updates: Partial<SlotProject>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (id: string) => void
  applyTemplate: (template: PlayableTemplate) => void
  
  // Symbol actions  
  addSymbol: (symbol: Symbol) => void
  updateSymbol: (id: string, updates: Partial<Symbol>) => void
  removeSymbol: (id: string) => void
  
  // Reel actions
  updateReelConfig: (config: Partial<ReelConfiguration>) => void
  
  // Payline actions
  updatePaylineConfig: (config: Partial<PaylineConfig>) => void
  
  // Feature actions
  addFeature: (feature: FeatureTrigger) => void
  updateFeature: (index: number, feature: FeatureTrigger) => void
  removeFeature: (index: number) => void
  
  // Math model actions
  updateMathModel: (math: Partial<MathModel>) => void
  
  // Brand asset actions
  addBrandAsset: (category: BrandAsset['category'], asset: BrandAsset) => void
  updateBrandAsset: (category: BrandAsset['category'], id: string, updates: Partial<BrandAsset>) => void
  removeBrandAsset: (category: BrandAsset['category'], id: string) => void
  
  // Canvas designer actions
  addArtboard: (artboard: Omit<Artboard, 'id'> & { id?: string }) => void
  updateArtboard: (id: string, updates: Partial<Artboard>) => void
  removeArtboard: (id: string) => void
  setActiveArtboard: (id: string) => void
  addCanvasElement: (artboardId: string, element: CanvasElementInput & { id?: string }) => void
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void
  removeCanvasElement: (id: string) => void
  removeCanvasElements: (ids: string[]) => void
  bringElementForward: (id: string) => void
  sendElementBackward: (id: string) => void
  selectCanvasElement: (id: string | null, options?: { append?: boolean; toggle?: boolean }) => void
  duplicateElementToArtboard: (elementId: string, targetArtboardId: string) => void
  addCanvasFont: (font: CanvasFont) => void
  removeCanvasFont: (id: string) => void
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void
  toggleElementLock: (id: string) => void
  toggleElementVisibility: (id: string) => void
  updateArtboardBackground: (id: string, color: string) => void
  nudgeSelectedElements: (dx: number, dy: number, options?: { big?: boolean }) => void
  undoCanvas: () => void
  redoCanvas: () => void
}

const defaultReelConfig: ReelConfiguration = {
  layout: '5x3',
  reelSets: {
    normal: [
      ['symbol1', 'symbol2', 'symbol3'],
      ['symbol1', 'symbol2', 'symbol3'],
      ['symbol1', 'symbol2', 'symbol3'],
      ['symbol1', 'symbol2', 'symbol3'],
      ['symbol1', 'symbol2', 'symbol3'],
    ]
  },
  spinSpeed: 1000,
  stopDelay: [0, 100, 200, 300, 400],
  bounceAnimation: true,
  blurEffect: true,
  anticipationStop: true
}

const defaultPaylineConfig: PaylineConfig = {
  type: 'fixed',
  fixedLines: [],
  displayStyle: 'onWin',
  animation: 'glow'
}

const defaultMathModel: MathModel = {
  rtp: 96.5,
  volatility: 'medium',
  hitFrequency: 25,
  maxWin: 5000,
  baseGameWeight: 70,
  featureWeight: 30,
  demonstrationMode: {
    guaranteedBigWin: true,
    triggerTiming: 10,
    winAmount: 'mega'
  }
}

const createSlotElement = (artboardId: string, artboardWidth: number, artboardHeight: number): CanvasElement => {
  const maxWidth = Math.min(artboardWidth * 0.75, 900)
  const maxHeight = Math.min(artboardHeight * 0.75, 1400)
  const aspect = 1280 / 720
  let width = maxWidth
  let height = width * aspect
  
  if (height > maxHeight) {
    height = maxHeight
    width = height / aspect
  }
  
  return {
    id: generateId(),
    name: 'Gameplay',
    type: 'slot',
    artboardId,
    position: {
      x: Math.round((artboardWidth - width) / 2),
      y: Math.round((artboardHeight - height) / 2)
    },
    size: {
      width: Math.round(width),
      height: Math.round(height)
    },
    rotation: 0,
    opacity: 1,
    layer: 0,
    locked: false,
    visible: true
  }
}

const createDefaultCanvasState = (): CanvasState => {
  const portraitId = generateId()
  const squareId = generateId()
  
  return {
    artboards: [
      {
        id: portraitId,
        name: 'Portrait 1080×1920',
        width: 1080,
        height: 1920,
        background: '#050505'
      },
      {
        id: squareId,
        name: 'Square 1080×1080',
        width: 1080,
        height: 1080,
        background: '#050505'
      }
    ],
    fonts: [],
    elements: [
      createSlotElement(portraitId, 1080, 1920),
      createSlotElement(squareId, 1080, 1080)
    ],
    selectedArtboardId: portraitId,
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
  }
}

const hydrateCanvasState = (canvas?: CanvasState): CanvasState => {
  if (!canvas || !Array.isArray(canvas.artboards) || !Array.isArray(canvas.elements)) {
    return createDefaultCanvasState()
  }
  
  const defaults = createDefaultCanvasState()
  return {
    ...canvas,
    artboards: canvas.artboards.length > 0 ? canvas.artboards : defaults.artboards,
    elements: canvas.elements.length > 0 ? canvas.elements : defaults.elements,
    fonts: canvas.fonts ?? [],
    selectedArtboardId: canvas.selectedArtboardId ?? canvas.artboards[0]?.id ?? defaults.selectedArtboardId,
    selectedElementIds: canvas.selectedElementIds ?? (canvas.selectedElementId ? [canvas.selectedElementId] : []),
    selectedElementId: (canvas.selectedElementIds && canvas.selectedElementIds.length > 0)
      ? canvas.selectedElementIds[0]
      : canvas.selectedElementId ?? null,
    settings: {
      ...defaults.settings,
      ...(canvas.settings || {})
    },
    history: canvas.history ?? defaults.history
  }
}

const createTemplateHeadline = (
  artboard: Artboard,
  visuals: TemplateVisuals,
  layer: number,
  variant: 'headline' | 'body',
  positionY: number
): CanvasElement => ({
  id: generateId(),
  name: variant === 'headline' ? 'Headline' : 'Body Copy',
  type: 'text',
  artboardId: artboard.id,
  position: {
    x: Math.round(artboard.width * 0.08),
    y: Math.round(positionY)
  },
  size: {
    width: Math.round(artboard.width * 0.84),
    height: variant === 'headline' ? 200 : 160
  },
  rotation: 0,
  opacity: 1,
  layer,
  text: variant === 'headline' ? visuals.headline : visuals.body,
  fontSize: variant === 'headline' ? Math.max(42, Math.round(artboard.width * 0.05)) : 28,
  fontWeight: variant === 'headline' ? 700 : 500,
  color: variant === 'headline' ? '#ffffff' : '#e2e8f0',
  textAlign: 'center',
  lineHeight: variant === 'headline' ? 1.1 : 1.3,
  letterSpacing: variant === 'headline' ? 0 : 0.5,
  autoWidth: false,
  locked: false,
  visible: true
})

const createTemplateCTA = (
  artboard: Artboard,
  visuals: TemplateVisuals,
  startingLayer: number,
  offsetY: number
): CanvasElement[] => {
  const width = Math.min(420, artboard.width * 0.7)
  const height = 72
  const x = (artboard.width - width) / 2
  const y = Math.min(artboard.height - height - 48, offsetY)
  const button: CanvasElement = {
    id: generateId(),
    name: 'CTA Button',
    type: 'shape',
    artboardId: artboard.id,
    position: { x: Math.round(x), y: Math.round(y) },
    size: { width: Math.round(width), height },
    rotation: 0,
    opacity: 1,
    layer: startingLayer,
    fill: visuals.accent,
    borderColor: visuals.secondary,
    borderWidth: 0,
    radius: height / 2,
    locked: false,
    visible: true,
    templateRole: 'cta-button'
  }
  
  const label: CanvasElement = {
    id: generateId(),
    name: 'CTA Label',
    type: 'text',
    artboardId: artboard.id,
    position: { x: Math.round(x), y: Math.round(y + 20) },
    size: { width: Math.round(width), height: 32 },
    rotation: 0,
    opacity: 1,
    layer: startingLayer + 1,
    text: visuals.cta,
    fontSize: 20,
    fontWeight: 700,
    color: visuals.ctaColor || '#ffffff',
    textAlign: 'center',
    lineHeight: 1,
    letterSpacing: 0.5,
    autoWidth: false,
    locked: false,
    visible: true,
    templateRole: 'cta'
  }
  
  return [button, label]
}

const applyTemplateVisualsToCanvas = (canvas: CanvasState, visuals: TemplateVisuals): CanvasState => {
  const baseCanvas = pushCanvasHistory(canvas)
  let updatedElements = [...baseCanvas.elements]
  const updatedArtboards = baseCanvas.artboards.map(board => ({
    ...board,
    background: visuals.background || board.background
  }))
  
  updatedArtboards.forEach(board => {
    const boardElements = updatedElements.filter(el => el.artboardId === board.id)
    const nonSlot = boardElements.filter(el => el.type !== 'slot')
    const startingLayer = boardElements.reduce((max, el) => Math.max(max, el.layer), 0) + 1
    
    if (nonSlot.length === 0) {
      const headline = {
        ...createTemplateHeadline(board, visuals, startingLayer, 'headline', board.height * 0.08),
        templateRole: 'headline'
      }
      const body = {
        ...createTemplateHeadline(board, visuals, startingLayer + 1, 'body', board.height * 0.08 + 110),
        templateRole: 'body'
      }
      const cta = createTemplateCTA(board, visuals, startingLayer + 2, board.height * 0.45)
      updatedElements = [...updatedElements, headline, body, ...cta]
    }
  })
  
  return {
    ...baseCanvas,
    artboards: updatedArtboards,
    elements: updatedElements,
    selectedElementIds: [],
    selectedElementId: null
  }
}

const ensureCanvasOnProject = (project: SlotProject): SlotProject => {
  const hydrated = hydrateCanvasState(project.canvas)
  return {
    ...project,
    canvas: hydrated
  }
}

const getCanvasState = (project: SlotProject): CanvasState => {
  return hydrateCanvasState(project.canvas)
}

const normalizeLayers = (elements: CanvasElement[], artboardId: string): CanvasElement[] => {
  const reordered = elements
    .filter(el => el.artboardId === artboardId)
    .sort((a, b) => a.layer - b.layer)
    .map((el, idx) => ({ ...el, layer: idx }))
  
  const map = new Map(reordered.map(el => [el.id, el]))
  return elements.map(el => map.get(el.id) ?? el)
}

const shiftElementLayer = (
  elements: CanvasElement[],
  elementId: string,
  direction: 'up' | 'down'
): CanvasElement[] => {
  const element = elements.find(el => el.id === elementId)
  if (!element) return elements
  
  const artboardElements = elements
    .filter(el => el.artboardId === element.artboardId)
    .sort((a, b) => a.layer - b.layer)
  const index = artboardElements.findIndex(el => el.id === elementId)
  if (index === -1) return elements
  
  const targetIndex = direction === 'up' ? index + 1 : index - 1
  if (targetIndex < 0 || targetIndex >= artboardElements.length) {
    return elements
  }
  
  const reordered = [...artboardElements]
  const [item] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, item)
  
  const map = new Map(reordered.map((el, idx) => [el.id, { ...el, layer: idx }]))
  return elements.map(el => map.get(el.id) ?? el)
}

const clampValue = (value: number, min: number, max: number) => {
  if (max <= min) return min
  return Math.min(Math.max(value, min), max)
}

const cloneCanvasElement = (element: CanvasElement): CanvasElement => ({
  ...element,
  position: { ...element.position },
  size: { ...element.size }
})

const cloneArtboard = (artboard: Artboard): Artboard => ({ ...artboard })

const createCanvasSnapshot = (canvas: CanvasState): CanvasSnapshot => ({
  artboards: canvas.artboards.map(cloneArtboard),
  elements: canvas.elements.map(cloneCanvasElement),
  selectedArtboardId: canvas.selectedArtboardId,
  selectedElementIds: canvas.selectedElementIds?.slice() ??
    (canvas.selectedElementId ? [canvas.selectedElementId] : [])
})

const applySnapshotToCanvas = (canvas: CanvasState, snapshot: CanvasSnapshot): CanvasState => ({
  ...canvas,
  artboards: snapshot.artboards.map(cloneArtboard),
  elements: snapshot.elements.map(cloneCanvasElement),
  selectedArtboardId: snapshot.selectedArtboardId,
  selectedElementIds: snapshot.selectedElementIds.slice(),
  selectedElementId: snapshot.selectedElementIds[0] ?? null
})

const pushCanvasHistory = (canvas: CanvasState): CanvasState => ({
  ...canvas,
  history: {
    past: [...canvas.history.past, createCanvasSnapshot(canvas)],
    future: []
  }
})

const getSelectedIds = (canvas: CanvasState): string[] => {
  if (canvas.selectedElementIds && canvas.selectedElementIds.length > 0) {
    return [...canvas.selectedElementIds]
  }
  return canvas.selectedElementId ? [canvas.selectedElementId] : []
}

const setSelectionOnCanvas = (canvas: CanvasState, ids: string[]) => ({
  ...canvas,
  selectedElementIds: ids,
  selectedElementId: ids[0] ?? null
})

const syncProjectState = (set: StoreApi<ProjectStore>['setState'], updatedProject: SlotProject) => {
  set((state) => ({
    currentProject: updatedProject,
    projects: state.projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    )
  }))
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      
      createProject: (name, brand) => {
        const newProject: SlotProject = {
          id: Math.random().toString(36).substring(2),
          name,
          brand,
          created: new Date(),
          modified: new Date(),
          templateId: undefined,
          config: {
            reels: defaultReelConfig,
            symbols: [],
            paylines: defaultPaylineConfig,
            features: [],
            math: defaultMathModel
          },
          assets: {
            backgrounds: [],
            symbols: [],
            frames: [],
            animations: [],
            audio: []
          },
          brandAssets: {
            logos: [],
            banners: [],
            screenshots: [],
            guidelines: [],
            videos: []
          },
          interface: {
            layout: 'classic',
            theme: 'vegas',
            buttons: [],
            displays: []
          },
          canvas: createDefaultCanvasState(),
          exports: {
            history: [],
            presets: []
          }
        }
        
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject
        }))
      },
      
      createProjectFromTemplate: (name, brand, template) => {
        const newProject: SlotProject = {
          id: Math.random().toString(36).substring(2),
          name,
          brand,
          created: new Date(),
          modified: new Date(),
          templateId: template.id,
          config: {
            reels: template.defaultConfig.reels,
            symbols: [],
            paylines: template.defaultConfig.paylines,
            features: template.defaultConfig.features,
            math: template.defaultConfig.math
          },
          assets: {
            backgrounds: [],
            symbols: [],
            frames: [],
            animations: [],
            audio: []
          },
          brandAssets: {
            logos: [],
            banners: [],
            screenshots: [],
            guidelines: [],
            videos: []
          },
          interface: {
            layout: 'classic',
            theme: 'vegas',
            buttons: [],
            displays: []
          },
          canvas: createDefaultCanvasState(),
          exports: {
            history: [],
            presets: []
          }
        }
        
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject
        }))
      },
      
      applyTemplate: (template) => {
        const { currentProject } = get()
        if (!currentProject) {
          console.error('No current project to apply template to')
          return
        }
        const hydratedProject = ensureCanvasOnProject(currentProject)
        let canvas = hydratedProject.canvas
        if (template.visuals) {
          canvas = applyTemplateVisualsToCanvas(canvas, template.visuals)
        }
        
        const updatedProject = {
          ...hydratedProject,
          templateId: template.id,
          config: {
            ...hydratedProject.config,
            reels: template.defaultConfig.reels,
            paylines: template.defaultConfig.paylines,
            features: template.defaultConfig.features,
            math: template.defaultConfig.math,
            // Keep existing symbols
            symbols: hydratedProject.config.symbols
          },
          canvas,
          modified: new Date()
        }
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === hydratedProject.id ? updatedProject : p
          )
        }))
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updates, modified: new Date() } : p
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, modified: new Date() }
            : state.currentProject
        }))
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        }))
      },
      
      setCurrentProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return
        
        if (project.canvas && Array.isArray(project.canvas.artboards)) {
          set({ currentProject: project })
          return
        }
        
        const hydrated = ensureCanvasOnProject(project)
        syncProjectState(set, hydrated)
      },
      
      addSymbol: (symbol) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            symbols: [...currentProject.config.symbols, symbol]
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updateSymbol: (id, updates) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            symbols: currentProject.config.symbols.map(s =>
              s.id === id ? { ...s, ...updates } : s
            )
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      removeSymbol: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            symbols: currentProject.config.symbols.filter(s => s.id !== id)
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updateReelConfig: (config) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            reels: { ...currentProject.config.reels, ...config }
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updatePaylineConfig: (config) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            paylines: { ...currentProject.config.paylines, ...config }
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      addFeature: (feature) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            features: [...currentProject.config.features, feature]
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updateFeature: (index, feature) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            features: currentProject.config.features.map((f, i) =>
              i === index ? feature : f
            )
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      removeFeature: (index) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            features: currentProject.config.features.filter((_, i) => i !== index)
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updateMathModel: (math) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const updatedProject = {
          ...currentProject,
          config: {
            ...currentProject.config,
            math: { ...currentProject.config.math, ...math }
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      addBrandAsset: (category, asset) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const categoryMap = {
          logo: 'logos',
          banner: 'banners',
          screenshot: 'screenshots',
          guideline: 'guidelines',
          video: 'videos'
        } as const
        
        const categoryKey = categoryMap[category] || 'logos'
        
        const updatedProject = {
          ...currentProject,
          brandAssets: {
            ...currentProject.brandAssets,
            [categoryKey]: [...(currentProject.brandAssets?.[categoryKey] || []), asset]
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      updateBrandAsset: (category, id, updates) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const categoryMap = {
          logo: 'logos',
          banner: 'banners',
          screenshot: 'screenshots',
          guideline: 'guidelines',
          video: 'videos'
        } as const
        
        const categoryKey = categoryMap[category] || 'logos'
        
        const updatedProject = {
          ...currentProject,
          brandAssets: {
            ...currentProject.brandAssets,
            [categoryKey]: (currentProject.brandAssets?.[categoryKey] || []).map(asset =>
              asset.id === id ? { ...asset, ...updates } : asset
            )
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      removeBrandAsset: (category, id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const categoryMap = {
          logo: 'logos',
          banner: 'banners',
          screenshot: 'screenshots',
          guideline: 'guidelines',
          video: 'videos'
        } as const
        
        const categoryKey = categoryMap[category] || 'logos'
        
        const updatedProject = {
          ...currentProject,
          brandAssets: {
            ...currentProject.brandAssets,
            [categoryKey]: (currentProject.brandAssets?.[categoryKey] || []).filter(asset => asset.id !== id)
          },
          modified: new Date()
        }
        
        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map(p => 
            p.id === currentProject.id ? updatedProject : p
          )
        }))
      },
      
      addArtboard: (artboard) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        const baseCanvas = pushCanvasHistory(canvas)
        const artboardId = artboard.id ?? generateId()
        const newArtboard: Artboard = {
          id: artboardId,
          name: artboard.name,
          width: artboard.width,
          height: artboard.height,
          background: artboard.background ?? '#050505'
        }
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            artboards: [...baseCanvas.artboards, newArtboard],
            selectedArtboardId: artboardId,
            selectedElementIds: [],
            selectedElementId: null
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      updateArtboard: (id, updates) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.artboards.some(board => board.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            artboards: baseCanvas.artboards.map(board =>
              board.id === id ? { ...board, ...updates } : board
            )
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      removeArtboard: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (canvas.artboards.length <= 1) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const remainingArtboards = baseCanvas.artboards.filter(board => board.id !== id)
        if (remainingArtboards.length === baseCanvas.artboards.length) return
        
        const remainingElements = baseCanvas.elements.filter(el => el.artboardId !== id)
        const selectedArtboardId = baseCanvas.selectedArtboardId === id
          ? remainingArtboards[0]?.id ?? null
          : baseCanvas.selectedArtboardId
        const selectedIds = getSelectedIds(baseCanvas).filter(selectionId =>
          remainingElements.some(el => el.id === selectionId)
        )
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            artboards: remainingArtboards,
            elements: remainingElements,
            selectedArtboardId,
            selectedElementIds: selectedIds,
            selectedElementId: selectedIds[0] ?? null
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      setActiveArtboard: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.artboards.some(board => board.id === id)) return
        
        const validIds = getSelectedIds(canvas).filter(selectionId =>
          canvas.elements.some(el => el.id === selectionId && el.artboardId === id)
        )
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...canvas,
            selectedArtboardId: id,
            selectedElementIds: validIds,
            selectedElementId: validIds[0] ?? null
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      addCanvasElement: (artboardId, element) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.artboards.some(board => board.id === artboardId)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const artboardElements = baseCanvas.elements.filter(el => el.artboardId === artboardId)
        const nextLayer = artboardElements.length > 0
          ? Math.max(...artboardElements.map(el => el.layer)) + 1
          : 0
        const newElement: CanvasElement = {
          ...element,
          id: element.id ?? generateId(),
          artboardId,
          layer: nextLayer
        }
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: [...baseCanvas.elements, newElement],
            selectedArtboardId: artboardId,
            selectedElementIds: [newElement.id],
            selectedElementId: newElement.id
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      updateCanvasElement: (id, updates) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.elements.some(el => el.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = baseCanvas.elements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ) as CanvasElement[]
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      removeCanvasElement: (id) => {
        const { removeCanvasElements } = get()
        removeCanvasElements([id])
      },
      
      removeCanvasElements: (ids) => {
        const { currentProject } = get()
        if (!currentProject || ids.length === 0) return
        
        const canvas = getCanvasState(currentProject)
        const baseCanvas = pushCanvasHistory(canvas)
        const targets = new Set(ids)
        if ([...targets].every(id => !baseCanvas.elements.some(el => el.id === id))) {
          return
        }
        
        const filteredElements = baseCanvas.elements.filter(el => !targets.has(el.id))
        const affectedArtboards = new Set(
          baseCanvas.elements
            .filter(el => targets.has(el.id))
            .map(el => el.artboardId)
        )
        let normalizedElements = filteredElements
        affectedArtboards.forEach(artboardId => {
          normalizedElements = normalizeLayers(normalizedElements, artboardId)
        })
        
        const remainingIds = getSelectedIds(baseCanvas).filter(id => !targets.has(id))
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: normalizedElements,
            selectedElementIds: remainingIds,
            selectedElementId: remainingIds[0] ?? null
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      bringElementForward: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.elements.some(el => el.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = shiftElementLayer(baseCanvas.elements, id, 'up')
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      sendElementBackward: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.elements.some(el => el.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = shiftElementLayer(baseCanvas.elements, id, 'down')
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      selectCanvasElement: (id, options) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (id && !canvas.elements.some(el => el.id === id)) return
        
        let selectedIds = getSelectedIds(canvas)
        
        if (!id) {
          selectedIds = []
        } else if (options?.append) {
          const alreadySelected = selectedIds.includes(id)
          if (alreadySelected && options?.toggle) {
            selectedIds = selectedIds.filter(selectedId => selectedId !== id)
          } else if (!alreadySelected) {
            selectedIds = [...selectedIds, id]
          }
        } else {
          selectedIds = [id]
        }
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...canvas,
            selectedElementIds: selectedIds,
            selectedElementId: selectedIds[0] ?? null
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      duplicateElementToArtboard: (elementId, targetArtboardId) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        const element = canvas.elements.find(el => el.id === elementId)
        if (!element) return
        if (!canvas.artboards.some(board => board.id === targetArtboardId)) return
        
        const targetArtboard = canvas.artboards.find(board => board.id === targetArtboardId)
        if (!targetArtboard) return
        
        const baseCanvas = pushCanvasHistory(canvas)
        const baseElements = baseCanvas.elements
        
        const artboardElements = baseElements.filter(el => el.artboardId === targetArtboardId)
        const nextLayer = artboardElements.length > 0
          ? Math.max(...artboardElements.map(el => el.layer)) + 1
          : 0
        const offset = element.artboardId === targetArtboardId ? 24 : 0
        
        const duplicate: CanvasElement = {
          ...element,
          id: generateId(),
          artboardId: targetArtboardId,
          position: {
            x: Math.max(0, Math.min(element.position.x + offset, targetArtboard.width - element.size.width)),
            y: Math.max(0, Math.min(element.position.y + offset, targetArtboard.height - element.size.height))
          },
          layer: nextLayer
        }
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: [...baseElements, duplicate],
            selectedArtboardId: targetArtboardId,
            selectedElementIds: [duplicate.id],
            selectedElementId: duplicate.id
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      addCanvasFont: (font) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        const baseCanvas = pushCanvasHistory(canvas)
        const existingIndex = baseCanvas.fonts.findIndex(f => f.id === font.id)
        const fonts =
          existingIndex >= 0
            ? baseCanvas.fonts.map((f, idx) => (idx === existingIndex ? font : f))
            : [...baseCanvas.fonts, font]
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            fonts
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      removeCanvasFont: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        if (!canvas.fonts.some(font => font.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = baseCanvas.elements.map(el => {
          if (el.type === 'text' && el.fontId === id) {
            return { ...el, fontId: undefined }
          }
          return el
        })
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            fonts: baseCanvas.fonts.filter(font => font.id !== id),
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      updateCanvasSettings: (settings) => {
        const { currentProject } = get()
        if (!currentProject) return
        
        const canvas = getCanvasState(currentProject)
        const baseCanvas = pushCanvasHistory(canvas)
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            settings: {
              ...baseCanvas.settings,
              ...settings
            }
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      nudgeSelectedElements: (dx, dy, options) => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        const selectedIds = getSelectedIds(canvas)
        if (selectedIds.length === 0) return
        const baseCanvas = pushCanvasHistory(canvas)
        const multiplier = options?.big ? 10 : 1
        const deltaX = dx * multiplier
        const deltaY = dy * multiplier
        
        const updatedElements = baseCanvas.elements.map(el => {
          if (!selectedIds.includes(el.id)) return el
          const artboard = baseCanvas.artboards.find(board => board.id === el.artboardId)
          if (!artboard) return el
          const newX = clampValue(el.position.x + deltaX, 0, artboard.width - el.size.width)
          const newY = clampValue(el.position.y + deltaY, 0, artboard.height - el.size.height)
          return {
            ...el,
            position: { x: newX, y: newY }
          }
        }) as CanvasElement[]
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      toggleElementLock: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        if (!canvas.elements.some(el => el.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = baseCanvas.elements.map(el =>
          el.id === id ? { ...el, locked: !el.locked } : el
        ) as CanvasElement[]
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      toggleElementVisibility: (id) => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        if (!canvas.elements.some(el => el.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedElements = baseCanvas.elements.map(el =>
          el.id === id ? { ...el, visible: el.visible === false ? true : false } : el
        ) as CanvasElement[]
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            elements: updatedElements
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      updateArtboardBackground: (id, color) => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        if (!canvas.artboards.some(board => board.id === id)) return
        const baseCanvas = pushCanvasHistory(canvas)
        
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...baseCanvas,
            artboards: baseCanvas.artboards.map(board =>
              board.id === id ? { ...board, background: color } : board
            )
          },
          modified: new Date()
        }
        
        syncProjectState(set, updatedProject)
      },
      
      undoCanvas: () => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        const past = canvas.history?.past ?? []
        if (past.length === 0) return
        const snapshot = past[past.length - 1]
        const remainingPast = past.slice(0, -1)
        const newFuture = [
          createCanvasSnapshot(canvas),
          ...(canvas.history?.future ?? [])
        ]
        const appliedCanvas = applySnapshotToCanvas(canvas, snapshot)
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...appliedCanvas,
            history: {
              past: remainingPast,
              future: newFuture
            }
          },
          modified: new Date()
        }
        syncProjectState(set, updatedProject)
      },
      
      redoCanvas: () => {
        const { currentProject } = get()
        if (!currentProject) return
        const canvas = getCanvasState(currentProject)
        const future = canvas.history?.future ?? []
        if (future.length === 0) return
        const snapshot = future[0]
        const remainingFuture = future.slice(1)
        const newPast = [
          ...canvas.history.past,
          createCanvasSnapshot(canvas)
        ]
        const appliedCanvas = applySnapshotToCanvas(canvas, snapshot)
        const updatedProject = {
          ...currentProject,
          canvas: {
            ...appliedCanvas,
            history: {
              past: newPast,
              future: remainingFuture
            }
          },
          modified: new Date()
        }
        syncProjectState(set, updatedProject)
      }
    }),
    {
      name: 'playable-ad-projects',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }),
      skipHydration: true
    }
  )
)
