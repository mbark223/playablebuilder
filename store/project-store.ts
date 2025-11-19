import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SlotProject, Symbol, ReelConfiguration, PaylineConfig, FeatureTrigger, MathModel, BrandAsset } from '@/types'

interface ProjectStore {
  currentProject: SlotProject | null
  projects: SlotProject[]
  
  // Project actions
  createProject: (name: string, brand: string) => void
  updateProject: (id: string, updates: Partial<SlotProject>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (id: string) => void
  
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
        if (project) {
          set({ currentProject: project })
        }
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
      }
    }),
    {
      name: 'playable-ad-projects'
    }
  )
)