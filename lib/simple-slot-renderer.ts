import type { ReelConfiguration, Symbol, SpinResult, WinLine } from '@/types'
import { delay } from '@/lib/utils'

export class SimpleSlotRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: ReelConfiguration
  private symbols: Map<string, HTMLImageElement> = new Map()
  private symbolData: Map<string, Symbol> = new Map()
  private currentSymbols: string[][] = []
  private isSpinning = false
  private animationId: number | null = null
  
  constructor(canvas: HTMLCanvasElement, config: ReelConfiguration) {
    this.canvas = canvas
    this.config = config
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context')
    }
    this.ctx = ctx
    
    // Set canvas size
    this.canvas.width = 1280
    this.canvas.height = 720
    
    // Initialize symbols grid
    const [cols, rows] = this.config.layout.split('x').map(Number)
    this.currentSymbols = Array(cols).fill(null).map(() => 
      Array(rows).fill('placeholder')
    )
    
    this.draw()
  }
  
  async loadSymbols(symbols: Symbol[]): Promise<void> {
    // Clear existing symbols
    this.symbols.clear()
    this.symbolData.clear()
    
    const loadPromises = symbols.map(async (symbol) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          this.symbols.set(symbol.id, img)
          this.symbolData.set(symbol.id, symbol)
          resolve()
        }
        img.onerror = (e) => {
          console.warn(`Failed to load symbol ${symbol.name}:`, e)
          resolve() // Continue loading other symbols
        }
        img.src = symbol.image
      })
    })
    
    await Promise.all(loadPromises)
    console.log(`Loaded ${this.symbols.size} symbols for simple renderer`)
    this.draw()
  }
  
  private draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    const [cols, rows] = this.config.layout.split('x').map(Number)
    const symbolSize = 150
    const gap = 10
    
    const totalWidth = cols * symbolSize + (cols - 1) * gap
    const totalHeight = rows * symbolSize
    
    const startX = (this.canvas.width - totalWidth) / 2
    const startY = (this.canvas.height - totalHeight) / 2
    
    // Draw slot background
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(
      startX - 20, 
      startY - 20, 
      totalWidth + 40, 
      totalHeight + 40
    )
    
    // Draw reels
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = startX + col * (symbolSize + gap)
        const y = startY + row * symbolSize
        
        // Draw reel background
        this.ctx.fillStyle = '#2a2a2a'
        this.ctx.fillRect(x, y, symbolSize, symbolSize)
        
        // Draw symbol if available
        const symbolId = this.currentSymbols[col]?.[row]
        if (symbolId && this.symbols.has(symbolId)) {
          const img = this.symbols.get(symbolId)!
          this.ctx.drawImage(img, x, y, symbolSize, symbolSize)
        } else {
          // Draw placeholder
          this.ctx.fillStyle = '#444444'
          this.ctx.fillRect(x + 10, y + 10, symbolSize - 20, symbolSize - 20)
          this.ctx.fillStyle = '#666666'
          this.ctx.font = '20px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText('?', x + symbolSize / 2, y + symbolSize / 2)
        }
      }
    }
  }
  
  async spin(): Promise<SpinResult> {
    if (this.isSpinning || this.symbols.size === 0) {
      return { symbols: [], wins: [], totalWin: 0 }
    }
    
    this.isSpinning = true
    const symbolIds = Array.from(this.symbols.keys())
    const [cols, rows] = this.config.layout.split('x').map(Number)
    
    // Animate spinning
    let spinTime = 0
    const spinDuration = 2000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      
      // Randomize symbols during spin
      if (elapsed < spinDuration) {
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < rows; row++) {
            if (Math.random() > 0.7) {
              this.currentSymbols[col][row] = symbolIds[Math.floor(Math.random() * symbolIds.length)]
            }
          }
        }
        this.draw()
        this.animationId = requestAnimationFrame(animate)
      } else {
        // Final symbols
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < rows; row++) {
            this.currentSymbols[col][row] = symbolIds[Math.floor(Math.random() * symbolIds.length)]
          }
        }
        this.draw()
        this.isSpinning = false
      }
    }
    
    animate()
    
    // Wait for animation to complete
    await delay(spinDuration)
    
    // Return mock result
    return {
      symbols: this.currentSymbols,
      wins: [],
      totalWin: 0
    }
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.symbols.clear()
    this.symbolData.clear()
  }
}