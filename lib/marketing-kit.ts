'use client'

import JSZip from 'jszip'
import { generateId } from '@/lib/utils'
import { getTemplateById, predefinedTemplates } from '@/lib/templates/predefined-templates'
import { useProjectStore } from '@/store/project-store'
import type { CanvasElement } from '@/types'
import { getFileStorage } from '@/lib/storage/indexed-db-storage'

export interface MarketingKitSummary {
  background?: string
  hero?: string
  logo?: string
  headline?: string
  body?: string
  cta?: string
}

export interface MarketingKitAsset {
  id: string
  name: string
  kind: 'image' | 'text'
  dataUrl?: string
  content?: string
  size?: number
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

const optimizeImageDataUrl = async (
  dataUrl?: string,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string | undefined> => {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl
  const maxWidth = options.maxWidth ?? 1440
  const maxHeight = options.maxHeight ?? 2560
  const quality = options.quality ?? 0.85
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
      if (scale >= 1 && dataUrl.length <= 1_000_000) {
        resolve(dataUrl)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/webp', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export const applyMarketingKitSummary = async (summary: MarketingKitSummary, templateId?: string) => {
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
  
  const optimizedBackground = await optimizeImageDataUrl(summary.background)
  const optimizedHero = await optimizeImageDataUrl(summary.hero, { maxWidth: 2048, maxHeight: 2048, quality: 0.8 })
  const optimizedLogo = await optimizeImageDataUrl(summary.logo, { maxWidth: 800, maxHeight: 800, quality: 0.9 })
  
  if (optimizedBackground) {
    const backgroundId = generateId()
    store.addCanvasElement(artboard.id, {
      id: backgroundId,
      name: 'Background',
      type: 'image',
      position: { x: 0, y: 0 },
      size: { width: artboard.width, height: artboard.height },
      rotation: 0,
      opacity: 1,
      src: optimizedBackground,
      fit: 'cover',
      maintainAspect: true,
      locked: true,
      visible: true,
      templateRole: 'background'
    })
    pushElementToBack(backgroundId)
  }
  
  if (optimizedHero) {
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
      src: optimizedHero,
      fit: 'contain',
      maintainAspect: true,
      locked: false,
      visible: true,
      templateRole: 'hero'
    })
  }
  
  if (optimizedLogo) {
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
      src: optimizedLogo,
      fit: 'contain',
      maintainAspect: true,
      locked: false,
      visible: true,
      templateRole: 'logo'
    })
  }
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const ACCEPTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg']
const ACCEPTED_TEXT_EXTENSIONS = ['txt']

const getMimeFromExtension = (ext: string) => {
  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg'
  if (['png', 'webp', 'svg'].includes(ext)) return `image/${ext}`
  if (ext === 'txt') return 'text/plain'
  return 'application/octet-stream'
}

export const parseMarketingKitFiles = async (files: File[]): Promise<MarketingKitAsset[]> => {
  const parsedAssets: MarketingKitAsset[] = []

  const extractZip = async (file: File) => {
    const zip = await JSZip.loadAsync(file)
    const entries = Object.keys(zip.files)

    for (const path of entries) {
      const entry = zip.files[path]
      if (entry.dir) continue

      const ext = path.split('.').pop()?.toLowerCase() || ''
      const name = path.split('/').pop() || path

      if (ACCEPTED_IMAGE_EXTENSIONS.includes(ext)) {
        const base64 = await entry.async('base64')
        const mime = getMimeFromExtension(ext)
        parsedAssets.push({
          id: generateId(),
          name,
          kind: 'image',
          dataUrl: `data:${mime};base64,${base64}`
        })
      } else if (ACCEPTED_TEXT_EXTENSIONS.includes(ext)) {
        const content = await entry.async('text')
        parsedAssets.push({
          id: generateId(),
          name,
          kind: 'text',
          content
        })
      }
    }
  }

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    if (file.name.toLowerCase().endsWith('.zip')) {
      await extractZip(file)
      continue
    }

    if (file.type.startsWith('text') || ACCEPTED_TEXT_EXTENSIONS.includes(ext)) {
      parsedAssets.push({
        id: generateId(),
        name: file.name,
        kind: 'text',
        content: await file.text()
      })
      continue
    }

    if (file.type.startsWith('image/') || ACCEPTED_IMAGE_EXTENSIONS.includes(ext)) {
      parsedAssets.push({
        id: generateId(),
        name: file.name,
        kind: 'image',
        dataUrl: await readFileAsDataUrl(file),
        size: file.size
      })
    }
  }

  return parsedAssets
}

export const summarizeMarketingKitAssets = (assets: MarketingKitAsset[]): MarketingKitSummary => {
  const images = assets.filter(asset => asset.kind === 'image')
  const textAsset = assets.find(asset => asset.kind === 'text' && asset.content)

  const findByKeywords = (keywords: string[]) => {
    const lowerKeywords = keywords.map(k => k.toLowerCase())
    return images.find(asset =>
      lowerKeywords.some(keyword => asset.name.toLowerCase().includes(keyword))
    )
  }

  const background = findByKeywords(['background', 'bg']) || images[0]
  const logo = findByKeywords(['logo'])
  const hero = findByKeywords(['hero', 'keyart', 'main']) || images[1] || images[0]

  const copyLines = textAsset?.content
    ?.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean) || []

  const headline = copyLines[0] || 'Experience Big Wins Instantly'
  const body = copyLines.slice(1, copyLines.length - 1).join(' ') || 'Bring your marketing kit to life automatically.'
  const cta = copyLines.at(-1) || 'Play Now'

  return {
    background: background?.dataUrl,
    hero: hero?.dataUrl,
    logo: logo?.dataUrl,
    headline,
    body,
    cta
  }
}

const dataUrlToMimeType = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.*?);/)
  return matches?.[1] || 'image/png'
}

export const persistMarketingKitImages = async (
  summary: MarketingKitSummary,
  options: { projectId?: string; category?: string } = {}
): Promise<MarketingKitSummary> => {
  const projectId = options.projectId || 'marketing-kit'
  const category = options.category || 'marketing-kit'
  const fileStorage = typeof window !== 'undefined' ? await getFileStorage() : null

  const storeDataUrl = async (value?: string, label?: string) => {
    if (!value || !value.startsWith('data:')) return value
    if (!fileStorage) return value

    const id = generateId()
    await fileStorage.storeFile({
      id,
      projectId,
      type: 'asset',
      category,
      name: label ? `${label}-${id}` : id,
      data: value,
      contentType: dataUrlToMimeType(value)
    })
    return `file://${id}`
  }

  return {
    ...summary,
    background: await storeDataUrl(summary.background, 'background'),
    hero: await storeDataUrl(summary.hero, 'hero'),
    logo: await storeDataUrl(summary.logo, 'logo')
  }
}
