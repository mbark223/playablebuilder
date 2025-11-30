// Core Types for Playable Ad Builder

export type Platform = 'snapchat' | 'facebook' | 'google' | 'unity' | 'ironsource' | 'applovin'
export type Orientation = 'portrait' | 'landscape' | 'square' | 'responsive' | 'universal'
export type SymbolType = 'regular' | 'wild' | 'scatter' | 'bonus' | 'multiplier'
export type ReelLayout = '3x3' | '5x3' | '5x4' | '5x5' | '6x4' | '7x7'
export type PaylineType = 'fixed' | 'ways' | 'cluster' | 'megaways'
export type FeatureType = 'freeSpins' | 'bonusGame' | 'picker' | 'wheel'
export type Volatility = 'low' | 'medium' | 'high' | 'very-high'
export type CanvasElementType = 'image' | 'text' | 'shape' | 'slot'
export type TextAlign = 'left' | 'center' | 'right'

export interface Symbol {
  id: string
  name: string
  type: SymbolType
  image: string
  payouts: { count: number; multiplier: number }[]
  animations?: {
    idle?: string
    win?: string
    mega?: string
  }
  stackable?: boolean
  expandable?: boolean
}

export interface ReelConfiguration {
  layout: ReelLayout
  reelSets: {
    normal: string[][]
    freeSpins?: string[][]
    bonus?: string[][]
  }
  spinSpeed: number
  stopDelay: number[]
  bounceAnimation: boolean
  blurEffect: boolean
  anticipationStop: boolean
}

export interface PaylineConfig {
  type: PaylineType
  fixedLines?: number[][][]
  waysCount?: 243 | 1024 | 3125 | 117649
  clusterSize?: number
  displayStyle: 'always' | 'onWin' | 'never'
  animation: 'glow' | 'trace' | 'pulse'
}

export interface FeatureTrigger {
  type: 'scatter' | 'bonus' | 'random' | 'collection'
  requirement: {
    scatterCount?: number
    bonusPositions?: number[][]
    collectionTarget?: number
    randomChance?: number
  }
  feature: FeatureType
  guarantee: boolean
}

export interface MathModel {
  rtp: number
  volatility: Volatility
  hitFrequency: number
  maxWin: number
  baseGameWeight: number
  featureWeight: number
  demonstrationMode: {
    guaranteedBigWin: boolean
    triggerTiming: number
    winAmount: 'big' | 'mega' | 'epic'
  }
}

export interface SlotProject {
  id: string
  name: string
  brand: string
  created: Date
  modified: Date
  templateId?: string
  config: {
    reels: ReelConfiguration
    symbols: Symbol[]
    paylines: PaylineConfig
    features: FeatureTrigger[]
    math: MathModel
  }
  assets: {
    backgrounds: Asset[]
    symbols: Asset[]
    frames: Asset[]
    animations: Asset[]
    audio: Asset[]
  }
  brandAssets: {
    logos: BrandAsset[]
    banners: BrandAsset[]
    screenshots: BrandAsset[]
    guidelines: BrandAsset[]
    videos: BrandAsset[]
  }
  interface: {
    layout: string
    theme: string
    buttons: any[]
    displays: any[]
  }
  canvas: CanvasState
  exports: {
    history: Export[]
    presets: ExportPreset[]
  }
}

export interface Asset {
  id: string
  name: string
  type: 'image' | 'audio' | 'animation' | 'video' | 'document'
  url: string
  size: number
  metadata?: any
}

export interface BrandAsset extends Asset {
  category: 'logo' | 'banner' | 'screenshot' | 'guideline' | 'video'
  tags?: string[]
  description?: string
  dimensions?: {
    width: number
    height: number
  }
  duration?: number // for videos in seconds
}

export interface Export {
  id: string
  projectId: string
  timestamp: Date
  platform: Platform
  variant: string
  version: string
  file: {
    name: string
    size: number
    format: string
    url: string
  }
  metrics: {
    loadTime: number
    fps: number
    fileSize: number
  }
  validation: {
    passed: boolean
    warnings: string[]
    errors: string[]
  }
}

export interface ExportPreset {
  id: string
  name: string
  platforms: Platform[]
  settings: any
}

export interface ExportConfig {
  platform: Platform
  orientation: Orientation
  optimization: {
    minification: boolean
    compression: 'gzip' | 'brotli' | 'none'
    imageOptimization: 'webp' | 'jpeg' | 'png'
    audioCompression: boolean
    treeShaking: boolean
  }
  assets: {
    inline: boolean
    external: boolean
    cdn: boolean
    base64: boolean
  }
  code: {
    obfuscation: boolean
    sourceMaps: boolean
    comments: boolean
  }
}

export interface WinLine {
  positions: [number, number][]
  symbol: string
  multiplier: number
  amount: number
}

export interface SpinResult {
  symbols: string[][]
  wins: WinLine[]
  totalWin: number
  feature?: FeatureTrigger
}

export interface CanvasFont {
  id: string
  name: string
  dataUrl: string
  format: 'ttf' | 'otf' | 'woff' | 'woff2'
}

export interface CanvasElementBase {
  id: string
  name: string
  type: CanvasElementType
  artboardId: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  opacity: number
  layer: number
  locked?: boolean
  visible?: boolean
  templateRole?: string
  syncGroup?: string
}

export interface ImageCanvasElement extends CanvasElementBase {
  type: 'image'
  assetId?: string
  src: string
  fit: 'contain' | 'cover'
  maintainAspect: boolean
}

export interface TextCanvasElement extends CanvasElementBase {
  type: 'text'
  text: string
  fontId?: string
  fontSize: number
  fontWeight: number
  color: string
  textAlign: TextAlign
  lineHeight: number
  letterSpacing: number
  autoWidth: boolean
}

export interface ShapeCanvasElement extends CanvasElementBase {
  type: 'shape'
  fill: string
  borderColor: string
  borderWidth: number
  radius: number
}

export interface SlotCanvasElement extends CanvasElementBase {
  type: 'slot'
}

export type CanvasElement =
  | ImageCanvasElement
  | TextCanvasElement
  | ShapeCanvasElement
  | SlotCanvasElement

export type CanvasElementInput =
  | Omit<ImageCanvasElement, 'id' | 'artboardId' | 'layer'>
  | Omit<TextCanvasElement, 'id' | 'artboardId' | 'layer'>
  | Omit<ShapeCanvasElement, 'id' | 'artboardId' | 'layer'>
  | Omit<SlotCanvasElement, 'id' | 'artboardId' | 'layer'>

export interface Artboard {
  id: string
  name: string
  width: number
  height: number
  background: string
}

export interface CanvasState {
  artboards: Artboard[]
  fonts: CanvasFont[]
  elements: CanvasElement[]
  selectedArtboardId: string | null
  selectedElementId: string | null
  selectedElementIds: string[]
  settings: CanvasSettings
  history: CanvasHistory
  synchronizedEditing?: boolean
}

export interface CanvasSettings {
  snapToGrid: boolean
  gridSize: number
  showGuides: boolean
  zoom: number
}

export interface CanvasSnapshot {
  artboards: Artboard[]
  elements: CanvasElement[]
  selectedArtboardId: string | null
  selectedElementIds: string[]
}

export interface CanvasHistory {
  past: CanvasSnapshot[]
  future: CanvasSnapshot[]
}
