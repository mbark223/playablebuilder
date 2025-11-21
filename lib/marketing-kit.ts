'use client'

import { generateId } from '@/lib/utils'
import { getTemplateById, predefinedTemplates } from '@/lib/templates/predefined-templates'
import { useProjectStore } from '@/store/project-store'
import type { CanvasElement } from '@/types'

export interface MarketingKitSummary {
  background?: string
  hero?: string
  logo?: string
  headline?: string
  body?: string
  cta?: string
}

const pushElementToBack = (elementId: string) => {
  const store = useProjectStore.getState()
  const project = store.currentProject
  if (!project?.canvas) return
  const element = project.canvas.elements.find(el => el.id === elementId)
  if (!element) return
  
  const total = project.canvas.elements.filter(el => el.artboardId === element.artboardId).length
  for (let i = 0; i < total; i++) {
    store.sendElementBackward(elementId)
  }
}

export const applyMarketingKitSummary = (summary: MarketingKitSummary, templateId?: string) => {
  const store = useProjectStore.getState()
  const template = templateId ? getTemplateById(templateId) : predefinedTemplates[0]
  if (template) {
    store.applyTemplate(template)
  }
  
  const refreshed = useProjectStore.getState()
  const project = refreshed.currentProject
  const canvas = project?.canvas
  const artboard = canvas?.artboards[0]
  if (!canvas || !artboard) return
  
  const templateElements = canvas.elements.reduce<Record<string, CanvasElement>>((acc, element) => {
    if (element.templateRole) {
      acc[element.templateRole] = element
    }
    return acc
  }, {})
  
  if (summary.headline && templateElements.headline?.type === 'text') {
    store.updateCanvasElement(templateElements.headline.id, { text: summary.headline })
  }
  
  if (summary.body && templateElements.body?.type === 'text') {
    store.updateCanvasElement(templateElements.body.id, { text: summary.body })
  }
  
  if (summary.cta && templateElements.cta?.type === 'text') {
    store.updateCanvasElement(templateElements.cta.id, { text: summary.cta })
  }
  
  if (summary.background) {
    const backgroundId = generateId()
    store.addCanvasElement(artboard.id, {
      id: backgroundId,
      name: 'Background',
      type: 'image',
      position: { x: 0, y: 0 },
      size: { width: artboard.width, height: artboard.height },
      rotation: 0,
      opacity: 1,
      src: summary.background,
      fit: 'cover',
      maintainAspect: true,
      locked: true,
      visible: true,
      templateRole: 'background'
    })
    pushElementToBack(backgroundId)
  }
  
  if (summary.hero) {
    store.addCanvasElement(artboard.id, {
      name: 'Hero Image',
      type: 'image',
      position: {
        x: Math.round(artboard.width * 0.15),
        y: Math.round(artboard.height * 0.2)
      },
      size: {
        width: Math.round(artboard.width * 0.7),
        height: Math.round(artboard.height * 0.6)
      },
      rotation: 0,
      opacity: 1,
      src: summary.hero,
      fit: 'contain',
      maintainAspect: true,
      locked: false,
      visible: true,
      templateRole: 'hero'
    })
  }
  
  if (summary.logo) {
    store.addCanvasElement(artboard.id, {
      name: 'Logo',
      type: 'image',
      position: {
        x: 24,
        y: 24
      },
      size: {
        width: Math.round(artboard.width * 0.2),
        height: Math.round(artboard.height * 0.1)
      },
      rotation: 0,
      opacity: 1,
      src: summary.logo,
      fit: 'contain',
      maintainAspect: true,
      locked: false,
      visible: true,
      templateRole: 'logo'
    })
  }
}
