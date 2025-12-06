import { StateStorage } from 'zustand/middleware'
import { createIndexedDBStorage, getFileStorage } from './indexed-db-storage'
import type { SlotProject, BrandAsset, Symbol } from '@/types'

const globalScope = typeof globalThis !== 'undefined'
  ? (globalThis as any)
  : (typeof window !== 'undefined' ? (window as any) : {})

const HYBRID_STORAGE_KEY = '__PLAYABLE_AD_HYBRID_STORAGE__'
const HYBRID_STORAGE_PROMISE_KEY = '__PLAYABLE_AD_HYBRID_STORAGE_PROMISE__'
const HYBRID_STATE_STORAGE_KEY = '__PLAYABLE_AD_STATE_STORAGE__'

interface FileReference {
  id: string
  projectId: string
  type: 'brandAsset' | 'symbol' | 'asset'
  category?: string
}

export class HybridStorage {
  private primaryStorage: StateStorage | null = null
  private fileStorage: Awaited<ReturnType<typeof getFileStorage>> | null = null
  private useIndexedDB = false
  
  async init(): Promise<void> {
    try {
      const testKey = '__storage_test__'
      const testValue = JSON.stringify({ test: true, data: 'x'.repeat(1024 * 1024) })
      
      localStorage.setItem(testKey, testValue)
      localStorage.removeItem(testKey)
      
      const usage = await this.getLocalStorageUsage()
      if (usage.percentage > 50) {
        console.log('LocalStorage usage high, switching to IndexedDB')
        this.useIndexedDB = true
      }
      
      this.primaryStorage = this.useIndexedDB
        ? await createIndexedDBStorage()
        : localStorage
      
      this.fileStorage = await getFileStorage()
    } catch (error) {
      console.log('LocalStorage quota exceeded or unavailable, using IndexedDB')
      this.useIndexedDB = true
      this.primaryStorage = await createIndexedDBStorage()
      this.fileStorage = await getFileStorage()
    }
  }

  private async getLocalStorageUsage(): Promise<{ used: number; percentage: number }> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      const estimatedQuota = 5 * 1024 * 1024
      return {
        used: totalSize,
        percentage: (totalSize / estimatedQuota) * 100
      }
    }
    
    const estimate = await navigator.storage.estimate()
    const quota = estimate.quota || 5 * 1024 * 1024
    const usage = estimate.usage || 0
    
    return {
      used: usage,
      percentage: (usage / quota) * 100
    }
  }

  private extractFiles(project: SlotProject): FileReference[] {
    const files: FileReference[] = []
    
    if (project.brandAssets) {
      Object.entries(project.brandAssets).forEach(([category, assets]) => {
        if (Array.isArray(assets)) {
          assets.forEach(asset => {
            if (asset.url && asset.url.startsWith('data:')) {
              files.push({
                id: asset.id,
                projectId: project.id,
                type: 'brandAsset',
                category
              })
            }
          })
        }
      })
    }
    
    if (project.config?.symbols) {
      project.config.symbols.forEach(symbol => {
        if (symbol.image && symbol.image.startsWith('data:')) {
          files.push({
            id: symbol.id,
            projectId: project.id,
            type: 'symbol'
          })
        }
      })
    }
    
    return files
  }

  private async storeProjectFiles(project: SlotProject): Promise<SlotProject> {
    if (!this.fileStorage) return project
    
    const projectCopy = JSON.parse(JSON.stringify(project))
    
    if (projectCopy.brandAssets) {
      for (const [category, assets] of Object.entries(projectCopy.brandAssets)) {
        if (Array.isArray(assets)) {
          for (let i = 0; i < assets.length; i++) {
            const asset = assets[i] as BrandAsset
            if (asset.url && asset.url.startsWith('data:')) {
              await this.fileStorage.storeFile({
                id: asset.id,
                projectId: project.id,
                type: 'brandAsset',
                category,
                name: asset.name,
                data: asset.url,
                contentType: asset.url.split(';')[0].split(':')[1],
                size: asset.size
              })
              
              ;(assets[i] as any).url = `file://${asset.id}`
            }
          }
        }
      }
    }
    
    if (projectCopy.config?.symbols) {
      for (let i = 0; i < projectCopy.config.symbols.length; i++) {
        const symbol = projectCopy.config.symbols[i]
        if (symbol.image && symbol.image.startsWith('data:')) {
          await this.fileStorage.storeFile({
            id: symbol.id,
            projectId: project.id,
            type: 'symbol',
            name: symbol.name,
            data: symbol.image,
            contentType: symbol.image.split(';')[0].split(':')[1]
          })
          
          projectCopy.config.symbols[i].image = `file://${symbol.id}`
        }
      }
    }
    
    return projectCopy
  }

  private async loadProjectFiles(project: SlotProject): Promise<SlotProject> {
    if (!this.fileStorage) return project
    
    const projectCopy = JSON.parse(JSON.stringify(project))
    
    if (projectCopy.brandAssets) {
      for (const [category, assets] of Object.entries(projectCopy.brandAssets)) {
        if (Array.isArray(assets)) {
          for (let i = 0; i < assets.length; i++) {
            const asset = assets[i] as BrandAsset
            if (asset.url && asset.url.startsWith('file://')) {
              const fileId = asset.url.replace('file://', '')
              const file = await this.fileStorage.getFile(fileId)
              if (file) {
                ;(assets[i] as any).url = file.data
              }
            }
          }
        }
      }
    }
    
    if (projectCopy.config?.symbols) {
      for (let i = 0; i < projectCopy.config.symbols.length; i++) {
        const symbol = projectCopy.config.symbols[i]
        if (symbol.image && symbol.image.startsWith('file://')) {
          const fileId = symbol.image.replace('file://', '')
          const file = await this.fileStorage.getFile(fileId)
          if (file) {
            projectCopy.config.symbols[i].image = file.data
          }
        }
      }
    }
    
    return projectCopy
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.primaryStorage) await this.init()
    
    const stored = await this.primaryStorage!.getItem(key)
    if (!stored) return null
    
    try {
      const data = JSON.parse(stored)
      
      if (data.state?.projects && Array.isArray(data.state.projects)) {
        for (let i = 0; i < data.state.projects.length; i++) {
          data.state.projects[i] = await this.loadProjectFiles(data.state.projects[i])
        }
      }
      
      if (data.state?.currentProject) {
        data.state.currentProject = await this.loadProjectFiles(data.state.currentProject)
      }
      
      return JSON.stringify(data)
    } catch (error) {
      console.error('Error parsing stored data:', error)
      return stored
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.primaryStorage) await this.init()
    
    try {
      const data = JSON.parse(value)
      
      if (data.state?.projects && Array.isArray(data.state.projects)) {
        for (let i = 0; i < data.state.projects.length; i++) {
          data.state.projects[i] = await this.storeProjectFiles(data.state.projects[i])
        }
      }
      
      if (data.state?.currentProject) {
        data.state.currentProject = await this.storeProjectFiles(data.state.currentProject)
      }
      
      const optimizedValue = JSON.stringify(data)
      const sizeInMB = new Blob([optimizedValue]).size / (1024 * 1024)
      
      if (!this.useIndexedDB && sizeInMB > 2) {
        console.log(`Storage size (${sizeInMB.toFixed(2)}MB) exceeds safe threshold, switching to IndexedDB`)
        this.useIndexedDB = true
        this.primaryStorage = await createIndexedDBStorage()
      }
      
      await this.primaryStorage!.setItem(key, optimizedValue)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded, switching to IndexedDB')
        this.useIndexedDB = true
        this.primaryStorage = await createIndexedDBStorage()
        await this.primaryStorage!.setItem(key, value)
      } else {
        throw error
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.primaryStorage) await this.init()
    await this.primaryStorage!.removeItem(key)
  }

  async getStorageInfo(): Promise<{
    primaryStorage: 'localStorage' | 'IndexedDB'
    usage: { used: number; quota: number; percentage: number }
    fileStats: {
      totalFiles: number
      totalSize: number
      byCategory: Record<string, { count: number; size: number }>
    }
  }> {
    if (!this.primaryStorage || !this.fileStorage) await this.init()
    
    let usage: { used: number; quota: number; percentage: number }
    
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      usage = {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
      }
    } else {
      usage = { used: 0, quota: 0, percentage: 0 }
    }
    
    const fileStats = await this.fileStorage!.getStorageStats()
    
    return {
      primaryStorage: this.useIndexedDB ? 'IndexedDB' : 'localStorage',
      usage,
      fileStats
    }
  }

  async cleanupOrphanedFiles(activeProjectIds: string[]): Promise<number> {
    if (!this.fileStorage) await this.init()
    
    const allFiles = await (this.fileStorage as any).getAllFiles()
    const activeSet = new Set(activeProjectIds)
    let deletedCount = 0
    
    for (const file of allFiles) {
      if (!activeSet.has(file.projectId)) {
        await this.fileStorage!.deleteFile(file.id)
        deletedCount++
      }
    }
    
    return deletedCount
  }
}

let hybridStorageInstance: HybridStorage | null = globalScope[HYBRID_STORAGE_KEY] ?? null
let hybridStoragePromise: Promise<HybridStorage> | null = globalScope[HYBRID_STORAGE_PROMISE_KEY] ?? null
let hybridStateStorage: StateStorage | null = globalScope[HYBRID_STATE_STORAGE_KEY] ?? null

async function getHybridStorageInstance(): Promise<HybridStorage> {
  if (hybridStorageInstance) return hybridStorageInstance
  if (!hybridStoragePromise) {
    const instance = new HybridStorage()
    hybridStoragePromise = instance.init().then(() => {
      hybridStorageInstance = instance
      globalScope[HYBRID_STORAGE_KEY] = hybridStorageInstance
      hybridStoragePromise = null
      globalScope[HYBRID_STORAGE_PROMISE_KEY] = null
      return instance
    }).catch((error) => {
      hybridStoragePromise = null
      globalScope[HYBRID_STORAGE_PROMISE_KEY] = null
      throw error
    })
    globalScope[HYBRID_STORAGE_PROMISE_KEY] = hybridStoragePromise
  }
  return hybridStoragePromise!
}

export const getHybridStorage = getHybridStorageInstance

export const createHybridStorage = async (): Promise<StateStorage> => {
  if (!hybridStateStorage) {
    const storage = await getHybridStorageInstance()
    hybridStateStorage = {
      getItem: (name) => storage.getItem(name),
      setItem: (name, value) => storage.setItem(name, value),
      removeItem: (name) => storage.removeItem(name)
    }
  }
  
  globalScope[HYBRID_STATE_STORAGE_KEY] = hybridStateStorage
  return hybridStateStorage
}
