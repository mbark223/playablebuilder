'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Database, HardDrive } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getHybridStorage } from '@/lib/storage/hybrid-storage'
import { formatFileSize } from '@/lib/utils'

interface StorageInfo {
  primaryStorage: 'localStorage' | 'IndexedDB'
  usage: {
    used: number
    quota: number
    percentage: number
  }
  fileStats: {
    totalFiles: number
    totalSize: number
    byCategory: Record<string, { count: number; size: number }>
  }
}

export function StorageMonitor() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    checkStorage()
    
    const interval = setInterval(checkStorage, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkStorage = async () => {
    try {
      const storage = await getHybridStorage()
      const info = await storage.getStorageInfo()
      setStorageInfo(info)
    } catch (error) {
      console.error('Failed to check storage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const requestPersistentStorage = async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist()
      if (isPersisted) {
        alert('Storage is now persistent')
      } else {
        alert('Failed to make storage persistent')
      }
    }
  }

  if (isLoading) return null

  const isHighUsage = storageInfo?.usage.percentage && storageInfo.usage.percentage > 75
  const isCriticalUsage = storageInfo?.usage.percentage && storageInfo.usage.percentage > 90

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          {storageInfo?.primaryStorage === 'IndexedDB' ? (
            <Database className="h-4 w-4" />
          ) : (
            <HardDrive className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            Storage: {storageInfo?.primaryStorage}
          </span>
        </div>

        {storageInfo && (
          <>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{formatFileSize(storageInfo.usage.used)}</span>
                <span>{formatFileSize(storageInfo.usage.quota)}</span>
              </div>
              <Progress 
                value={storageInfo.usage.percentage} 
                className={isCriticalUsage ? 'bg-red-500' : isHighUsage ? 'bg-yellow-500' : ''}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              {storageInfo.fileStats.totalFiles} files ({formatFileSize(storageInfo.fileStats.totalSize)})
            </div>

            {(isHighUsage || isCriticalUsage) && (
              <Alert className="mt-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  Storage usage is {isCriticalUsage ? 'critical' : 'high'}. 
                  Consider removing unused projects.
                </AlertDescription>
              </Alert>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>

            {showDetails && (
              <div className="mt-2 space-y-1 text-xs">
                {Object.entries(storageInfo.fileStats.byCategory).map(([category, stats]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-muted-foreground">{category}:</span>
                    <span>{stats.count} files ({formatFileSize(stats.size)})</span>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={requestPersistentStorage}
                >
                  Request Persistent Storage
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
