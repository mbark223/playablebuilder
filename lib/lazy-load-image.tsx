import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  onLoad,
  onError 
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!src) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.01 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [src])

  const loadImage = async () => {
    if (!src || src === imageSrc) return

    try {
      setIsLoading(true)
      setError(null)

      // For file:// URLs, we need to fetch from IndexedDB
      if (src.startsWith('file://')) {
        const { getFileStorage } = await import('@/lib/storage/indexed-db-storage')
        const fileStorage = await getFileStorage()
        const fileId = src.replace('file://', '')
        const file = await fileStorage.getFile(fileId)
        
        if (file && file.data) {
          setImageSrc(file.data)
          setIsLoading(false)
          onLoad?.()
        } else {
          throw new Error('File not found in storage')
        }
      } else {
        // For regular URLs and data URLs
        const img = new Image()
        img.onload = () => {
          setImageSrc(src)
          setIsLoading(false)
          onLoad?.()
        }
        img.onerror = () => {
          const error = new Error('Failed to load image')
          setError(error.message)
          setIsLoading(false)
          onError?.(error)
        }
        img.src = src
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load image')
      setError(error.message)
      setIsLoading(false)
      onError?.(error)
    }
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <p className="text-xs text-muted-foreground">Failed to load</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  )
}

// Hook for preloading images
export function useImagePreloader() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isPreloading, setIsPreloading] = useState(false)

  const preloadImages = async (urls: string[]) => {
    setIsPreloading(true)
    const promises = urls.map(async (url) => {
      if (loadedImages.has(url)) return

      try {
        if (url.startsWith('file://')) {
          const { getFileStorage } = await import('@/lib/storage/indexed-db-storage')
          const fileStorage = await getFileStorage()
          const fileId = url.replace('file://', '')
          const file = await fileStorage.getFile(fileId)
          
          if (file && file.data) {
            setLoadedImages(prev => new Set([...prev, url]))
          }
        } else {
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = url
          })
          setLoadedImages(prev => new Set([...prev, url]))
        }
      } catch (error) {
        console.error(`Failed to preload ${url}:`, error)
      }
    })

    await Promise.allSettled(promises)
    setIsPreloading(false)
  }

  return { preloadImages, loadedImages, isPreloading }
}