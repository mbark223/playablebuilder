import type { ReelConfiguration, PaylineConfig, MathModel, FeatureTrigger } from './index'

export interface PlayableTemplate {
  id: string
  name: string
  description: string
  category: 'engagement' | 'conversion' | 'retention' | 'bonus' | 'seasonal'
  thumbnail: string
  scenario: ScenarioConfig
  defaultConfig: {
    reels: ReelConfiguration
    paylines: PaylineConfig
    math: MathModel
    features: FeatureTrigger[]
  }
  tags: string[]
  popularity: number
}

export interface ScenarioConfig {
  type: 'spin-count' | 'time-based' | 'win-triggered' | 'loss-streak' | 'progressive' | 'collection'
  steps: ScenarioStep[]
  offer: OfferConfig
}

export interface ScenarioStep {
  id: string
  type: 'spin' | 'wait' | 'show-message' | 'animate' | 'check-condition'
  action: string
  duration?: number
  condition?: {
    type: 'spin-count' | 'win-amount' | 'time-elapsed' | 'symbol-collected'
    value: number | string
    operator: '=' | '>' | '<' | '>=' | '<='
  }
  nextStep?: string
}

export interface OfferConfig {
  type: 'modal' | 'fullscreen' | 'banner' | 'integrated'
  content: {
    headline: string
    subheadline?: string
    image?: string
    cta: {
      text: string
      style: 'primary' | 'secondary' | 'pulse' | 'gradient'
    }
    bonus?: {
      amount: string
      currency: 'coins' | 'spins' | 'cash'
    }
  }
  timing: {
    delay?: number
    autoShow: boolean
    dismissible: boolean
  }
  animation: 'slide-up' | 'fade-in' | 'bounce' | 'zoom' | 'rotate'
}