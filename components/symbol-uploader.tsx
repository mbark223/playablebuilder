'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { generateId } from '@/lib/utils'
import { compressImage, formatFileSize } from '@/lib/image-utils'
import type { Symbol, SymbolType } from '@/types'
import { Progress } from '@/components/ui/progress'

interface SymbolUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UploadedFile {
  id: string
  file: File
  preview: string
  name: string
  type: SymbolType
}

export default function SymbolUploader({ open, onOpenChange }: SymbolUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const { addSymbol } = useProjectStore()
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsCompressing(true)
    setCompressionProgress(0)
    
    const newFiles: UploadedFile[] = []
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      try {
        // Compress large images
        if (file.size > 500 * 1024) { // If larger than 500KB
          const compressed = await compressImage(file, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.85,
            format: 'webp'
          })
          
          newFiles.push({
            id: generateId(),
            file: compressed.file,
            preview: compressed.dataUrl,
            name: file.name.split('.')[0],
            type: 'regular' as SymbolType
          })
        } else {
          // Use original if small enough
          newFiles.push({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            name: file.name.split('.')[0],
            type: 'regular' as SymbolType
          })
        }
      } catch (error) {
        console.error('Failed to process file:', error)
        // Use original on error
        newFiles.push({
          id: generateId(),
          file,
          preview: URL.createObjectURL(file),
          name: file.name.split('.')[0],
          type: 'regular' as SymbolType
        })
      }
      
      setCompressionProgress(((i + 1) / acceptedFiles.length) * 100)
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsCompressing(false)
    setCompressionProgress(0)
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true
  })
  
  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }
  
  const updateFileType = (id: string, type: SymbolType) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, type } : f)
    )
  }
  
  const updateFileName = (id: string, name: string) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, name } : f)
    )
  }
  
  const handleUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)
    
    const total = uploadedFiles.length
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploadedFile = uploadedFiles[i]
      
      // Use the preview if it's already a data URL (compressed), otherwise read the file
      let dataUrl: string
      if (uploadedFile.preview.startsWith('data:')) {
        dataUrl = uploadedFile.preview
      } else {
        const reader = new FileReader()
        dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(uploadedFile.file)
        })
      }
      
      const symbol: Symbol = {
        id: uploadedFile.id,
        name: uploadedFile.name,
        type: uploadedFile.type,
        image: dataUrl,
        payouts: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 10 },
          { count: 5, multiplier: 20 }
        ],
        stackable: true,
        expandable: false
      }
      
      addSymbol(symbol)
      setUploadProgress(((i + 1) / total) * 100)
    }
    
    // Cleanup
    uploadedFiles.forEach(file => {
      if (!file.preview.startsWith('data:')) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setUploadedFiles([])
    setIsUploading(false)
    setUploadProgress(0)
    onOpenChange(false)
  }
  
  const handleClose = () => {
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview))
    setUploadedFiles([])
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Symbols</DialogTitle>
          <DialogDescription>
            Upload symbol images for your slot game. Supported formats: PNG, JPG, GIF, WebP
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto py-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag & drop symbol images here, or click to select'}
            </p>
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium mb-2">Uploaded Symbols ({uploadedFiles.length})</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-16 w-16 object-contain rounded"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={file.name}
                        onChange={(e) => updateFileName(file.id, e.target.value)}
                        className="text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={file.type}
                          onChange={(e) => updateFileType(file.id, e.target.value as SymbolType)}
                          className="text-xs bg-secondary px-2 py-1 rounded"
                        >
                          <option value="regular">Regular</option>
                          <option value="wild">Wild</option>
                          <option value="scatter">Scatter</option>
                          <option value="bonus">Bonus</option>
                          <option value="multiplier">Multiplier</option>
                        </select>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uploadedFiles.length > 10 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-yellow-500">
                Large number of symbols may impact performance. Images are automatically optimized.
              </p>
            </div>
          )}
          
          {isCompressing && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-2">Optimizing images...</p>
              <Progress value={compressionProgress} className="h-2" />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            {isUploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{Math.round(uploadProgress)}% complete</span>
              </div>
            )}
            {uploadedFiles.length > 0 && !isUploading && (
              <div className="text-sm text-muted-foreground">
                Total size: {formatFileSize(uploadedFiles.reduce((acc, f) => acc + f.file.size, 0))}
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadedFiles.length === 0 || isUploading || isCompressing}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${uploadedFiles.length} Symbol${uploadedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}