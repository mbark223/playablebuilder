'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import type { CanvasElement } from '@/types'

export function TemplateEditor() {
  const {
    currentProject,
    updateCanvasElement,
    selectCanvasElement,
    addCanvasElement,
    addArtboard,
    canvasState
  } = useProjectStore((state) => ({
    currentProject: state.currentProject,
    updateCanvasElement: state.updateCanvasElement,
    selectCanvasElement: state.selectCanvasElement,
    addCanvasElement: state.addCanvasElement,
    addArtboard: state.addArtboard,
    canvasState: state.currentProject?.canvas
  }))
  const [newTextValue, setNewTextValue] = useState('New Text Block')
  
  const canvas = canvasState ?? currentProject?.canvas
  
  const artboardId = useMemo(() => {
    return canvas?.selectedArtboardId ?? canvas?.artboards[0]?.id
  }, [canvas])
  
  const templateElements = useMemo(() => {
    const byRole: Record<string, CanvasElement | undefined> = {}
    if (!canvas) return byRole
    canvas.elements.forEach((element) => {
      if (element.templateRole) {
        byRole[element.templateRole] = element
      }
    })
    return byRole
  }, [canvas])
  
  if (!currentProject?.templateId || !canvas) {
    return null
  }
  
  if (!artboardId) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Add an artboard to start editing template text.
      </div>
    )
  }
  
  const handleUpdateText = (role: string, value: string) => {
    const element = templateElements[role]
    if (!element || element.type !== 'text') return
    updateCanvasElement(element.id, { text: value })
  }
  
  const handleAlignElement = (role: string, align: 'left' | 'center' | 'right') => {
    const element = templateElements[role]
    if (!element) return
    const artboard = canvas.artboards.find(board => board.id === element.artboardId)
    if (!artboard) return
    let x = element.position.x
    if (align === 'left') x = Math.round(artboard.width * 0.05)
    if (align === 'center') x = Math.round((artboard.width - element.size.width) / 2)
    if (align === 'right') x = Math.round(artboard.width - element.size.width - artboard.width * 0.05)
    updateCanvasElement(element.id, {
      position: { ...element.position, x },
      textAlign: align
    })
    selectCanvasElement(element.id)
  }
  
  const handleAddQuickText = () => {
    addCanvasElement(artboardId, {
      name: 'Text Block',
      type: 'text',
      text: newTextValue || 'New Text',
      fontSize: 36,
      fontWeight: 600,
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      position: { x: 120, y: 200 },
      size: { width: 840, height: 200 },
      rotation: 0,
      opacity: 1,
      autoWidth: false,
      locked: false,
      visible: true
    })
    setNewTextValue('New Text Block')
  }
  
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Template Editor</p>
        <p className="text-xs text-muted-foreground">
          Modify template messaging, CTA, and add supporting elements.
        </p>
      </div>
      
      <div className="space-y-4 p-4 text-sm">
        {(['headline', 'body', 'cta'] as const).map((role) => {
          const element = templateElements[role]
          if (!element) return null
          const textValue = element.type === 'text' ? element.text : ''
          return (
            <div key={role} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">{role}</span>
                <div className="flex items-center gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <Button
                      key={align}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => handleAlignElement(role, align)}
                    >
                      {align[0].toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              {element.type === 'text' ? (
                <input
                  value={textValue}
                  onChange={(e) => handleUpdateText(role, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Select this element on the canvas to edit.</p>
              )}
            </div>
          )
        })}
        
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Add Elements</p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={newTextValue}
                onChange={(e) => setNewTextValue(e.target.value)}
                placeholder="New text content"
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
              />
              <Button variant="secondary" size="sm" onClick={handleAddQuickText}>
                Add Text
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const artboard = canvas.artboards.find(board => board.id === artboardId)
                if (!artboard) return
                const width = Math.min(420, artboard.width * 0.7)
                const height = 72
                const x = Math.round((artboard.width - width) / 2)
                const y = Math.round(Math.min(artboard.height - height - 32, artboard.height * 0.6))
                addCanvasElement(artboardId, {
                  name: 'CTA Button',
                  type: 'shape',
                  position: { x, y },
                  size: { width, height },
                  rotation: 0,
                  opacity: 1,
                  fill: '#fbbf24',
                  borderColor: '#f87171',
                  borderWidth: 0,
                  radius: height / 2,
                  locked: false,
                  visible: true,
                  templateRole: 'cta-button'
                })
                addCanvasElement(artboardId, {
                  name: 'CTA Label',
                  type: 'text',
                  position: { x, y: y + 20 },
                  size: { width, height: 32 },
                  rotation: 0,
                  opacity: 1,
                  text: 'Call To Action',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#111827',
                  textAlign: 'center',
                  lineHeight: 1,
                  letterSpacing: 0.5,
                  autoWidth: false,
                  locked: false,
                  visible: true,
                  templateRole: 'cta'
                })
              }}
            >
              Add CTA Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
