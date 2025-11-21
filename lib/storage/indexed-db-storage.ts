import type { StateStorage } from 'zustand/middleware'

export interface StorageMetadata {
  version: number
  timestamp: number
  size: number
}

export interface StorageEntry {
  key: string
  value: any
  metadata: StorageMetadata
}

class IndexedDBStorage {
  private dbName: string
  private storeName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName = 'playable-ad-storage', storeName = 'projects', version = 1) {
    this.dbName = dbName
    this.storeName = storeName
    this.version = version
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('projectId', 'projectId', { unique: false })
          fileStore.createIndex('type', 'type', { unique: false })
        }
      }
    })
  }

  private ensureDB(): void {
    if (!this.db) {
      throw new Error('IndexedDB not initialized. Call init() first.')
    }
  }

  async getItem(key: string): Promise<string | null> {
    this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? JSON.stringify(result.value) : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async setItem(key: string, value: string): Promise<void> {
    this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const parsedValue = JSON.parse(value)
      const size = new Blob([value]).size
      
      const entry: StorageEntry = {
        key,
        value: parsedValue,
        metadata: {
          version: 1,
          timestamp: Date.now(),
          size
        }
      }

      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeItem(key: string): Promise<void> {
    this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getStorageInfo(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      }
    }
    
    return { usage: 0, quota: 0 }
  }

  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return navigator.storage.persist()
    }
    return false
  }
}

export class FileStorage {
  private db: IDBDatabase | null = null
  private dbName: string
  
  constructor(dbName = 'playable-ad-storage') {
    this.dbName = dbName
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('projectId', 'projectId', { unique: false })
          fileStore.createIndex('type', 'type', { unique: false })
          fileStore.createIndex('category', 'category', { unique: false })
        }
      }
    })
  }

  async storeFile(file: {
    id: string
    projectId: string
    type: 'brandAsset' | 'symbol' | 'asset'
    category?: string
    name: string
    data: string
    contentType?: string
    size?: number
  }): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      
      const fileEntry = {
        ...file,
        size: file.size || new Blob([file.data]).size,
        timestamp: Date.now()
      }
      
      const request = store.put(fileEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFile(id: string): Promise<any | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjectFiles(projectId: string): Promise<any[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const index = store.index('projectId')
      const request = index.getAll(projectId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProjectFiles(projectId: string): Promise<void> {
    if (!this.db) await this.init()
    
    const files = await this.getProjectFiles(projectId)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      
      let deleted = 0
      files.forEach(file => {
        const request = store.delete(file.id)
        request.onsuccess = () => {
          deleted++
          if (deleted === files.length) resolve()
        }
        request.onerror = () => reject(request.error)
      })
      
      if (files.length === 0) resolve()
    })
  }

  async getStorageStats(projectId?: string): Promise<{
    totalFiles: number
    totalSize: number
    byCategory: Record<string, { count: number; size: number }>
  }> {
    if (!this.db) await this.init()
    
    const files = projectId 
      ? await this.getProjectFiles(projectId)
      : await this.getAllFiles()
    
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byCategory: {} as Record<string, { count: number; size: number }>
    }
    
    files.forEach(file => {
      const category = file.category || file.type
      stats.totalSize += file.size || 0
      
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { count: 0, size: 0 }
      }
      stats.byCategory[category].count++
      stats.byCategory[category].size += file.size || 0
    })
    
    return stats
  }

  private async getAllFiles(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }
}

export const createIndexedDBStorage = async (): Promise<StateStorage> => {
  const storage = new IndexedDBStorage()
  await storage.init()

  return {
    getItem: (name: string) => storage.getItem(name),
    setItem: (name: string, value: string) => storage.setItem(name, value),
    removeItem: (name: string) => storage.removeItem(name)
  }
}

let fileStorageInstance: FileStorage | null = null

export const getFileStorage = async (): Promise<FileStorage> => {
  if (!fileStorageInstance) {
    fileStorageInstance = new FileStorage()
    await fileStorageInstance.init()
  }
  return fileStorageInstance
}