'use client'

import { useEffect, useRef, useState } from 'react'
import { SlotRenderer } from '@/lib/slot-renderer'
import type { SlotProject, SpinResult } from '@/types'

interface SlotCanvasProps {
  project: SlotProject
  isSpinning: boolean
  onSpin: () => void
}

export default function SlotCanvas({ project, isSpinning, onSpin }: SlotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SlotRenderer | null>(null)
  const [lastResult, setLastResult] = useState<SpinResult | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Create renderer
    const renderer = new SlotRenderer(canvasRef.current, project.config.reels)
    rendererRef.current = renderer
    
    // Load symbols
    if (project.config.symbols.length > 0) {
      renderer.loadSymbols(project.config.symbols)
      setIsReady(true)
    }
    
    return () => {
      renderer.destroy()
      rendererRef.current = null
      setIsReady(false)
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
      
      {!isReady && (
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