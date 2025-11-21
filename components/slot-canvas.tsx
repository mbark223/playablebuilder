'use client'

import { useEffect, useRef, useState } from 'react'
import { SlotRenderer } from '@/lib/slot-renderer'
import { SimpleSlotRenderer } from '@/lib/simple-slot-renderer'
import type { SlotProject, SpinResult } from '@/types'
import { getTemplateById } from '@/lib/templates/predefined-templates'

interface SlotCanvasProps {
  project: SlotProject
  isSpinning: boolean
  onSpin: () => void
}

export default function SlotCanvas({ project, isSpinning, onSpin }: SlotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SlotRenderer | SimpleSlotRenderer | null>(null)
  const [lastResult, setLastResult] = useState<SpinResult | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rendererType, setRendererType] = useState<'pixi' | 'simple'>('pixi')
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Small delay to ensure canvas is properly mounted
    const initTimer = setTimeout(async () => {
      try {
        // Check WebGL support
        const testCanvas = document.createElement('canvas')
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
        if (!gl) {
          setError('WebGL is not supported in your browser')
          return
        }
        
        // Create renderer with error handling
        try {
          const renderer = new SlotRenderer(canvasRef.current!, project.config.reels)
          rendererRef.current = renderer
          setRendererType('pixi')
          
          // Load symbols
          if (project.config.symbols.length > 0) {
            await renderer.loadSymbols(project.config.symbols)
            setIsReady(true)
          }
          
          setError(null)
        } catch (pixiError: any) {
          console.error('PIXI.js initialization error:', pixiError)
          
          // Try simple canvas fallback
          try {
            console.log('Falling back to simple canvas renderer')
            const simpleRenderer = new SimpleSlotRenderer(canvasRef.current!, project.config.reels)
            rendererRef.current = simpleRenderer
            setRendererType('simple')
            
            // Load symbols
            if (project.config.symbols.length > 0) {
              await simpleRenderer.loadSymbols(project.config.symbols)
              setIsReady(true)
            }
            
            setError('Using simplified renderer (some effects may be limited)')
          } catch (fallbackError) {
            console.error('Simple renderer also failed:', fallbackError)
            setError('Graphics initialization failed. Please refresh the page.')
          }
        }
      } catch (err) {
        console.error('Failed to initialize slot renderer:', err)
        setError('Failed to initialize graphics renderer')
      }
    }, 100)
    
    return () => {
      clearTimeout(initTimer)
      if (rendererRef.current) {
        try {
          rendererRef.current.destroy()
        } catch (e) {
          console.error('Error destroying renderer:', e)
        }
        rendererRef.current = null
        setIsReady(false)
      }
    }
  }, []) // Remove dependency to prevent re-initialization on config changes
  
  useEffect(() => {
    if (!rendererRef.current) return
    
    // Update symbols
    if (project.config.symbols.length > 0) {
      rendererRef.current.loadSymbols(project.config.symbols).then(() => {
        setIsReady(true)
      }).catch((err) => {
        console.error('Failed to load symbols:', err)
        // Still set ready for simple renderer
        if (rendererType === 'simple') {
          setIsReady(true)
        }
      })
    } else {
      setIsReady(false)
    }
  }, [project.config.symbols, rendererType])
  
  useEffect(() => {
    if (!rendererRef.current || !isSpinning || !isReady) return
    
    const performSpin = async () => {
      const result = await rendererRef.current!.spin()
      setLastResult(result)
    }
    
    performSpin()
  }, [isSpinning, isReady])
  
  const template = project.templateId ? getTemplateById(project.templateId) : null
  const visuals = template?.visuals
  const [cols, rows] = project.config.reels.layout.split('x').map(Number)
  const aspectRatio = `${cols}/${rows}`
  const slotBackground = visuals?.slotBackground || '#000000'
  const slotAccent = visuals?.slotAccent || '#eab308'
  
  return (
    <div
      className="relative rounded-lg overflow-hidden border border-border/50"
      style={{
        background: `radial-gradient(circle at top, ${slotBackground}, #020617 70%)`
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ aspectRatio }}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <p className="mb-2">{error}</p>
            {!error.includes('Canvas mode') && (
              <p className="text-sm text-gray-400">Try refreshing the page or using a different browser</p>
            )}
          </div>
        </div>
      )}
      
      {!error && !isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white text-center">
            {project.config.symbols.length === 0
              ? 'Upload symbols to get started'
              : 'Loading symbols...'}
          </p>
        </div>
      )}
      
      {lastResult && lastResult.wins.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
          <p className="text-sm font-medium">Last Win</p>
          <p className="text-2xl font-bold">{lastResult.totalWin}x</p>
          <p className="text-xs text-gray-400">{lastResult.wins.length} lines</p>
        </div>
      )}
      
      {visuals?.slotOverlayText && (
        <div
          className="pointer-events-none absolute top-3 left-3 text-xs font-medium uppercase tracking-wide px-3 py-1 rounded-full text-slate-900"
          style={{ background: slotAccent }}
        >
          {visuals.slotOverlayText}
        </div>
      )}
      
      {visuals?.cta && (
        <button
          className="absolute bottom-4 right-4 text-xs font-semibold px-4 py-2 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ background: visuals.accent || slotAccent, color: visuals.ctaColor || '#0f172a' }}
          onClick={(e) => {
            e.stopPropagation()
            onSpin()
          }}
        >
          {visuals.cta}
        </button>
      )}
      
    </div>
  )
}
