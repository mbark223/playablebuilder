import type { ScenarioStep, ScenarioConfig, OfferConfig } from '@/types/templates'
import type { SpinResult } from '@/types'

export interface TemplateExecutorCallbacks {
  onSpin: (type: 'normal' | 'small-win' | 'medium-win' | 'mega-win' | 'loss' | 'scatter-tease' | 'trigger-bonus' | 'collect' | 'jackpot-tease' | 'recovery-win') => Promise<SpinResult>
  onShowMessage: (message: string, duration: number) => Promise<void>
  onAnimate: (animation: string, duration: number) => Promise<void>
  onShowOffer: (offer: OfferConfig) => void
  onWait: (duration: number) => Promise<void>
}

export class TemplateExecutor {
  private currentStepIndex = 0
  private steps: ScenarioStep[]
  private offer: OfferConfig
  private callbacks: TemplateExecutorCallbacks
  private isRunning = false
  private isPaused = false

  constructor(scenario: ScenarioConfig, callbacks: TemplateExecutorCallbacks) {
    this.steps = scenario.steps
    this.offer = scenario.offer
    this.callbacks = callbacks
  }

  async start() {
    if (this.isRunning) return
    this.isRunning = true
    this.currentStepIndex = 0
    await this.executeNextStep()
  }

  async pause() {
    this.isPaused = true
  }

  async resume() {
    if (!this.isPaused) return
    this.isPaused = false
    await this.executeNextStep()
  }

  async stop() {
    this.isRunning = false
    this.isPaused = false
    this.currentStepIndex = 0
  }

  private async executeNextStep() {
    if (!this.isRunning || this.isPaused) return
    
    if (this.currentStepIndex >= this.steps.length) {
      this.isRunning = false
      return
    }

    const step = this.steps[this.currentStepIndex]
    await this.executeStep(step)

    if (step.nextStep) {
      const nextIndex = this.steps.findIndex(s => s.id === step.nextStep)
      if (nextIndex !== -1) {
        this.currentStepIndex = nextIndex
      } else {
        this.currentStepIndex++
      }
    } else {
      this.currentStepIndex++
    }

    if (this.isRunning && !this.isPaused) {
      await this.executeNextStep()
    }
  }

  private async executeStep(step: ScenarioStep) {
    switch (step.type) {
      case 'spin':
        await this.handleSpin(step)
        break
      case 'wait':
        await this.callbacks.onWait(step.duration || 1000)
        break
      case 'show-message':
        if (step.action === 'display-endcard' || step.action === 'display-offer') {
          this.callbacks.onShowOffer(this.offer)
        } else {
          await this.callbacks.onShowMessage(step.action, step.duration || 2000)
        }
        break
      case 'animate':
        await this.callbacks.onAnimate(step.action, step.duration || 1000)
        break
      case 'check-condition':
        // Conditions would be evaluated here based on game state
        break
    }
  }

  private async handleSpin(step: ScenarioStep) {
    let spinType: Parameters<TemplateExecutorCallbacks['onSpin']>[0] = 'normal'
    
    switch (step.action) {
      case 'auto-spin':
        spinType = 'normal'
        break
      case 'auto-spin-small-win':
        spinType = 'small-win'
        break
      case 'auto-spin-medium-win':
        spinType = 'medium-win'
        break
      case 'auto-spin-mega-win':
        spinType = 'mega-win'
        break
      case 'auto-spin-loss':
        spinType = 'loss'
        break
      case 'auto-spin-scatter-tease':
        spinType = 'scatter-tease'
        break
      case 'auto-spin-trigger-bonus':
        spinType = 'trigger-bonus'
        break
      case 'auto-spin-collect':
        spinType = 'collect'
        break
      case 'auto-spin-jackpot-tease':
        spinType = 'jackpot-tease'
        break
      case 'auto-spin-recovery-win':
        spinType = 'recovery-win'
        break
      case 'turbo-spin':
        spinType = 'normal'
        break
      case 'turbo-spin-big-win':
        spinType = 'medium-win'
        break
    }

    await this.callbacks.onSpin(spinType)
    
    if (step.duration) {
      await this.callbacks.onWait(step.duration)
    }
  }

  getCurrentStep(): ScenarioStep | null {
    return this.steps[this.currentStepIndex] || null
  }

  getProgress(): number {
    return (this.currentStepIndex / this.steps.length) * 100
  }

  isComplete(): boolean {
    return this.currentStepIndex >= this.steps.length
  }
}