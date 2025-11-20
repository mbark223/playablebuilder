export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ file: File; dataUrl: string }> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = maxWidth
            height = Math.round(width / aspectRatio)
          } else {
            height = maxHeight
            width = Math.round(height * aspectRatio)
          }
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Create new file with compressed data
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              { type: `image/${format}` }
            )
            
            // Also get data URL for preview
            const dataUrl = canvas.toDataURL(`image/${format}`, quality)
            
            resolve({
              file: compressedFile,
              dataUrl
            })
          },
          `image/${format}`,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function processImageBatch(
  files: File[],
  options: CompressOptions = {},
  onProgress?: (progress: number) => void
): Promise<Array<{ file: File; dataUrl: string }>> {
  const results: Array<{ file: File; dataUrl: string }> = []
  const total = files.length
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await compressImage(files[i], options)
      results.push(result)
      
      if (onProgress) {
        onProgress(((i + 1) / total) * 100)
      }
    } catch (error) {
      console.error(`Failed to process ${files[i].name}:`, error)
      // Include original file if compression fails
      results.push({
        file: files[i],
        dataUrl: URL.createObjectURL(files[i])
      })
    }
  }
  
  return results
}

export function estimateUploadTime(fileSize: number, speedMbps: number = 10): number {
  // Convert file size to megabits
  const fileSizeMb = (fileSize * 8) / (1024 * 1024)
  // Calculate time in seconds
  return fileSizeMb / speedMbps
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}