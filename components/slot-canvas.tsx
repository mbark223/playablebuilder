'use client'

import { useEffect, useRef, useState } from 'react'
import { SlotRenderer } from '@/lib/slot-renderer'
import { SimpleSlotRenderer } from '@/lib/simple-slot-renderer'
import type { SlotProject, SpinResult } from '@/types'

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
    const initTimer = setTimeout(() => {
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
            renderer.loadSymbols(project.config.symbols)
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
              simpleRenderer.loadSymbols(project.config.symbols)
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
  }, [project.config.reels])
  
  useEffect(() => {
    if (!rendererRef.current) return
    
    // Update symbols
    if (project.config.symbols.length > 0) {
      rendererRef.current.loadSymbols(project.config.symbols)
      setIsReady(true)
    } else {
      setIsReady(false)
    }
  }, [project.config.symbols])
  
  useEffect(() => {
    if (!rendererRef.current || !isSpinning || !isReady) return
    
    const performSpin = async () => {
      const result = await rendererRef.current!.spin()
      setLastResult(result)
    }
    
    performSpin()
  }, [isSpinning, isReady])
  
  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ aspectRatio: '16/9' }}
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
    </div>
  )
}