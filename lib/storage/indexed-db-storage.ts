import type { StateStorage } from 'zustand/middleware'

const DB_NAME = 'playable-ad-storage'
const DB_VERSION = 2
const PROJECT_STORE = 'projects'
const FILE_STORE = 'files'
const MAX_DB_UPGRADE_ATTEMPTS = 5

function ensureObjectStores(db: IDBDatabase, transaction: IDBTransaction | null) {
  if (!db.objectStoreNames.contains(PROJECT_STORE)) {
    db.createObjectStore(PROJECT_STORE, { keyPath: 'key' })
  }

  let fileStore: IDBObjectStore | null = null

  if (db.objectStoreNames.contains(FILE_STORE)) {
    fileStore = transaction?.objectStore(FILE_STORE) ?? null
  } else {
    fileStore = db.createObjectStore(FILE_STORE, { keyPath: 'id' })
  }

  if (fileStore) {
    if (!fileStore.indexNames.contains('projectId')) {
      fileStore.createIndex('projectId', 'projectId', { unique: false })
    }
    if (!fileStore.indexNames.contains('type')) {
      fileStore.createIndex('type', 'type', { unique: false })
    }
    if (!fileStore.indexNames.contains('category')) {
      fileStore.createIndex('category', 'category', { unique: false })
    }
  }
}

function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName)
    deleteRequest.onerror = () => reject(deleteRequest.error)
    deleteRequest.onblocked = () => {
      console.warn(`Deletion of IndexedDB "${dbName}" is blocked. Retrying...`)
    }
    deleteRequest.onsuccess = () => resolve()
  })
}

function openDatabase(
  dbName: string,
  version: number,
  requiredStores: string[],
  attempt = 0
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)

    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      ensureObjectStores(db, request.transaction)
    }
    request.onblocked = () => {
      console.warn(`IndexedDB upgrade blocked for ${dbName}.`)
    }
    request.onsuccess = () => {
      const db = request.result
      const missingStore = requiredStores.some(store => !db.objectStoreNames.contains(store))
      
      if (missingStore) {
        if (attempt >= MAX_DB_UPGRADE_ATTEMPTS) {
          db.close()
          deleteDatabase(dbName)
            .then(() => openDatabase(dbName, version + 1, requiredStores, attempt + 1))
            .then(resolve)
            .catch(reject)
          return
        }
        
        const nextVersion = Math.max(db.version + 1, version + 1)
        db.close()
        deleteDatabase(dbName)
          .catch(() => {})
          .finally(() => {
            openDatabase(dbName, nextVersion, requiredStores, attempt + 1)
              .then(resolve)
              .catch(reject)
          })
        return
      }
      
      resolve(db)
    }
  })
}

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
  private initPromise: Promise<void> | null = null

  constructor(dbName = DB_NAME, storeName = PROJECT_STORE, version = DB_VERSION) {
    this.dbName = dbName
    this.storeName = storeName
    this.version = version
  }

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = openDatabase(this.dbName, this.version, [PROJECT_STORE, FILE_STORE])
      .then((db) => {
        this.db = db
        this.version = db.version
        if (this.db) {
          this.db.onversionchange = () => {
            this.db?.close()
            this.db = null
          }
        }
      })
      .finally(() => {
        this.initPromise = null
      })

    return this.initPromise
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('IndexedDB not initialized. Call init() first.')
    }
    return this.db
  }

  private shouldRetryIDBError(error: unknown): error is DOMException {
    return error instanceof DOMException && (
      error.name === 'NotFoundError' ||
      error.name === 'InvalidStateError'
    )
  }

  private async reopenDatabase(forceUpgrade = false) {
    if (this.db) {
      const nextVersion = forceUpgrade ? this.db.version + 1 : this.db.version
      this.db.close()
      this.db = null
      this.version = Math.max(this.version, nextVersion)
    } else if (forceUpgrade) {
      this.version += 1
    }
    await this.init()
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0 && this.shouldRetryIDBError(error)) {
        await this.reopenDatabase(true)
        return this.executeWithRetry(operation, retries - 1)
      }
      throw error
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.executeWithRetry(() => this.readItem(key))
  }

  private async readItem(key: string): Promise<string | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
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
    return this.executeWithRetry(() => this.writeItem(key, value))
  }

  private async writeItem(key: string, value: string): Promise<void> {
    const db = await this.ensureDB()
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

      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeItem(key: string): Promise<void> {
    return this.executeWithRetry(() => this.deleteItem(key))
  }

  private async deleteItem(key: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
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
  private initPromise: Promise<void> | null = null
  private version: number
  
  constructor(dbName = DB_NAME) {
    this.dbName = dbName
    this.version = DB_VERSION
  }

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = openDatabase(this.dbName, this.version, [PROJECT_STORE, FILE_STORE])
      .then((db) => {
        this.db = db
        this.version = db.version
        if (this.db) {
          this.db.onversionchange = () => {
            this.db?.close()
            this.db = null
          }
        }
      })
      .finally(() => {
        this.initPromise = null
      })

    return this.initPromise
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('IndexedDB not initialized.')
    }
    return this.db
  }

  private shouldRetryIDBError(error: unknown): error is DOMException {
    return error instanceof DOMException && (
      error.name === 'NotFoundError' ||
      error.name === 'InvalidStateError'
    )
  }

  private async reopenDatabase(forceUpgrade = false) {
    if (this.db) {
      const nextVersion = forceUpgrade ? this.db.version + 1 : this.db.version
      this.db.close()
      this.db = null
      this.version = Math.max(this.version, nextVersion)
    } else if (forceUpgrade) {
      this.version += 1
    }
    await this.init()
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0 && this.shouldRetryIDBError(error)) {
        await this.reopenDatabase(true)
        return this.executeWithRetry(operation, retries - 1)
      }
      throw error
    }
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
    return this.executeWithRetry(() => this.performStoreFile(file))
  }

  private async performStoreFile(file: {
    id: string
    projectId: string
    type: 'brandAsset' | 'symbol' | 'asset'
    category?: string
    name: string
    data: string
    contentType?: string
    size?: number
  }): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readwrite')
      const store = transaction.objectStore(FILE_STORE)
      
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
    return this.executeWithRetry(() => this.performGetFile(id))
  }

  private async performGetFile(id: string): Promise<any | null> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readonly')
      const store = transaction.objectStore(FILE_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjectFiles(projectId: string): Promise<any[]> {
    return this.executeWithRetry(() => this.performGetProjectFiles(projectId))
  }

  private async performGetProjectFiles(projectId: string): Promise<any[]> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readonly')
      const store = transaction.objectStore(FILE_STORE)
      const index = store.index('projectId')
      const request = index.getAll(projectId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    return this.executeWithRetry(() => this.performDeleteFile(id))
  }

  private async performDeleteFile(id: string): Promise<void> {
    const db = await this.ensureDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readwrite')
      const store = transaction.objectStore(FILE_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProjectFiles(projectId: string): Promise<void> {
    return this.executeWithRetry(() => this.performDeleteProjectFiles(projectId))
  }

  private async performDeleteProjectFiles(projectId: string): Promise<void> {
    const db = await this.ensureDB()
    const files = await this.getProjectFiles(projectId)
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readwrite')
      const store = transaction.objectStore(FILE_STORE)
      
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
    return this.executeWithRetry(() => this.performGetStorageStats(projectId))
  }

  private async performGetStorageStats(projectId?: string) {
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
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE], 'readonly')
      const store = transaction.objectStore(FILE_STORE)
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
