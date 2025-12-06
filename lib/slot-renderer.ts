import * as PIXI from 'pixi.js'
import type { ReelConfiguration, Symbol, SpinResult, WinLine } from '@/types'
import { delay } from '@/lib/utils'
import { createPixiApp } from '@/lib/create-pixi-app'

export class SlotRenderer {
  private app: PIXI.Application
  private reels: Reel[] = []
  private symbols: Map<string, PIXI.Texture> = new Map()
  private container: PIXI.Container
  private reelContainer: PIXI.Container
  private winContainer: PIXI.Container
  private config: ReelConfiguration
  private symbolData: Map<string, Symbol> = new Map()
  
  constructor(canvas: HTMLCanvasElement, config: ReelConfiguration) {
    this.config = config
    
    const app = createPixiApp({
      view: canvas,
      width: 1280,
      height: 720,
      backgroundColor: 0x000000
    })
    
    if (!app) {
      throw new Error('Failed to initialize PIXI renderer');
    }
    
    this.app = app
    
    this.container = new PIXI.Container()
    this.reelContainer = new PIXI.Container()
    this.winContainer = new PIXI.Container()
    
    this.app.stage.addChild(this.container)
    this.container.addChild(this.reelContainer)
    this.container.addChild(this.winContainer)
    
    this.setupReels()
  }
  
  private setupReels() {
    const [cols, rows] = this.config.layout.split('x').map(Number)
    const symbolSize = 150
    const reelSpacing = 10
    
    const totalWidth = cols * symbolSize + (cols - 1) * reelSpacing
    const totalHeight = rows * symbolSize
    
    this.reelContainer.x = (this.app.screen.width - totalWidth) / 2
    this.reelContainer.y = (this.app.screen.height - totalHeight) / 2
    
    for (let i = 0; i < cols; i++) {
      const reel = new Reel(i, rows, symbolSize, this.config)
      reel.container.x = i * (symbolSize + reelSpacing)
      this.reelContainer.addChild(reel.container)
      this.reels.push(reel)
    }
  }
  
  public async loadSymbols(symbols: Symbol[], onProgress?: (loaded: number, total: number) => void): Promise<void> {
    // Clear existing symbols
    this.symbols.clear()
    this.symbolData.clear()
    
    const total = symbols.length
    let loaded = 0
    const report = () => {
      loaded = Math.min(total, loaded + 1)
      onProgress?.(loaded, total)
    }
    
    // Load all symbols
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const texture = await PIXI.Assets.load(symbol.image)
          this.symbols.set(symbol.id, texture)
          this.symbolData.set(symbol.id, symbol)
          report()
        } catch (err) {
          console.warn(`Failed to load symbol ${symbol.name}:`, err)
          // Create fallback texture
          const texture = PIXI.Texture.from(symbol.image)
          this.symbols.set(symbol.id, texture)
          this.symbolData.set(symbol.id, symbol)
          report()
        }
      })
    )
    
    const availableSymbolIds = symbols.map((symbol) => symbol.id)
    
    // Update reels with new textures
    this.reels.forEach(reel => {
      reel.setTextures(this.symbols, availableSymbolIds)
    })
  }
  
  public async spin(): Promise<SpinResult> {
    this.clearWinDisplay()
    
    const promises = this.reels.map((reel, i) => 
      reel.spin(this.config.spinSpeed + this.config.stopDelay[i])
    )
    
    await Promise.all(promises)
    
    const result = this.calculateWins()
    if (result.wins.length > 0) {
      await this.displayWins(result.wins)
    }
    
    return result
  }
  
  private calculateWins(): SpinResult {
    const symbolGrid = this.getSymbolGrid()
    const wins: WinLine[] = []
    let totalWin = 0
    
    // Simple left-to-right matching for demo
    const [cols, rows] = this.config.layout.split('x').map(Number)
    
    for (let row = 0; row < rows; row++) {
      let matchCount = 1
      let currentSymbol = symbolGrid[0][row]
      const positions: [number, number][] = [[0, row]]
      
      for (let col = 1; col < cols; col++) {
        if (symbolGrid[col][row] === currentSymbol || symbolGrid[col][row] === 'wild') {
          matchCount++
          positions.push([col, row])
        } else {
          break
        }
      }
      
      if (matchCount >= 3) {
        const symbol = this.symbolData.get(currentSymbol)
        if (symbol) {
          const payout = symbol.payouts.find(p => p.count === matchCount)
          if (payout) {
            wins.push({
              positions,
              symbol: currentSymbol,
              multiplier: payout.multiplier,
              amount: payout.multiplier * 1 // Bet amount would be multiplied here
            })
            totalWin += payout.multiplier
          }
        }
      }
    }
    
    return {
      symbols: symbolGrid,
      wins,
      totalWin,
      feature: undefined // Feature triggers would be calculated here
    }
  }
  
  private getSymbolGrid(): string[][] {
    return this.reels.map(reel => reel.getCurrentSymbols())
  }
  
  private async displayWins(wins: WinLine[]) {
    const graphics = new PIXI.Graphics()
    this.winContainer.addChild(graphics)
    
    wins.forEach(win => {
      graphics.lineStyle(3, 0xFFD700, 1)
      
      const symbolSize = 150
      const reelSpacing = 10
      
      win.positions.forEach((pos, i) => {
        const x = pos[0] * (symbolSize + reelSpacing) + symbolSize / 2
        const y = pos[1] * symbolSize + symbolSize / 2
        
        if (i === 0) {
          graphics.moveTo(x, y)
        } else {
          graphics.lineTo(x, y)
        }
      })
    })
    
    await delay(2000)
  }
  
  private clearWinDisplay() {
    this.winContainer.removeChildren()
  }
  
  public destroy() {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
  }
  
  public resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
  }
  
  public getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement
  }
}

class Reel {
  public container: PIXI.Container
  private symbols: PIXI.Sprite[] = []
  private symbolIds: string[] = []
  private index: number
  private rows: number
  private symbolSize: number
  private isSpinning: boolean = false
  private config: ReelConfiguration
  private textures: Map<string, PIXI.Texture> = new Map()
  
  constructor(index: number, rows: number, symbolSize: number, config: ReelConfiguration) {
    this.index = index
    this.rows = rows
    this.symbolSize = symbolSize
    this.config = config
    this.container = new PIXI.Container()
    
    // Create mask for reel
    const mask = new PIXI.Graphics()
    mask.beginFill(0xFFFFFF)
    mask.drawRect(0, 0, symbolSize, rows * symbolSize)
    mask.endFill()
    this.container.mask = mask
    this.container.addChild(mask)
    
    this.setupSymbols()
  }
  
  private setupSymbols() {
    // Create extra symbols for smooth scrolling
    const totalSymbols = this.rows + 2
    
    for (let i = 0; i < totalSymbols; i++) {
      const symbol = new PIXI.Sprite()
      symbol.width = this.symbolSize
      symbol.height = this.symbolSize
      symbol.y = i * this.symbolSize - this.symbolSize
      this.symbols.push(symbol)
      this.container.addChild(symbol)
    }
  }
  
  public setTextures(textures: Map<string, PIXI.Texture>, availableSymbolIds: string[]) {
    this.textures = textures
    this.updateSymbols(availableSymbolIds)
  }
  
  private updateSymbols(availableSymbolIds: string[]) {
    const reelSet = this.config.reelSets.normal[this.index]
    const fallbackIds = availableSymbolIds.length > 0 ? availableSymbolIds : Array.from(this.textures.keys())
    const hasFallbacks = fallbackIds.length > 0
    if ((!reelSet || reelSet.length === 0) && !hasFallbacks) return
    
    this.symbols.forEach((symbol, i) => {
      const configuredId = reelSet && reelSet.length > 0
        ? reelSet[i % reelSet.length]
        : undefined
      const needsFallback = !configuredId || !this.textures.has(configuredId)
      const fallbackId = hasFallbacks ? fallbackIds[i % fallbackIds.length] : undefined
      const symbolId = needsFallback ? fallbackId : configuredId
      const texture = symbolId ? this.textures.get(symbolId) : undefined
      
      if (texture && symbolId) {
        symbol.texture = texture
        this.symbolIds[i] = symbolId
      } else {
        symbol.texture = PIXI.Texture.WHITE
        this.symbolIds[i] = ''
      }
    })
  }
  
  public async spin(duration: number): Promise<void> {
    if (this.isSpinning) return
    this.isSpinning = true
    
    const startTime = Date.now()
    const startY = this.container.y
    const spinDistance = this.symbolSize * 12 // Shorter travel for snappier spins
    
    // Blur effect during spin
    if (this.config.blurEffect) {
      this.container.filters = [new PIXI.filters.BlurFilter(0, 8)]
    }
    
    return new Promise(resolve => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth stop
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        this.container.y = startY + spinDistance * easeOut
        
        // Wrap symbols
        this.symbols.forEach(symbol => {
          if (symbol.y + this.container.y > this.rows * this.symbolSize) {
            symbol.y -= (this.rows + 2) * this.symbolSize
          }
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // Snap to position
          this.container.y = Math.round(this.container.y / this.symbolSize) * this.symbolSize
          
          // Remove blur
          this.container.filters = []
          
          // Bounce animation
          if (this.config.bounceAnimation) {
            this.bounce()
          }
          
          this.isSpinning = false
          resolve()
        }
      }
      
      animate()
    })
  }
  
  private bounce() {
    const tl = { y: this.container.y }
    const originalY = this.container.y
    
    const animate = () => {
      tl.y += (originalY - 10 - tl.y) * 0.2
      this.container.y = tl.y
      
      if (Math.abs(tl.y - originalY) > 0.1) {
        requestAnimationFrame(animate)
      } else {
        this.container.y = originalY
      }
    }
    
    animate()
  }
  
  public getCurrentSymbols(): string[] {
    const visibleSymbols: string[] = []
    const offset = Math.floor(this.container.y / this.symbolSize)
    
    for (let i = 0; i < this.rows; i++) {
      const index = (i - offset) % this.symbolIds.length
      visibleSymbols.push(this.symbolIds[index])
    }
    
    return visibleSymbols
  }
}
