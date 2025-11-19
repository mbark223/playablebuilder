'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { generateId, formatFileSize } from '@/lib/utils'
import type { Symbol, SymbolType } from '@/types'

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
  const { addSymbol } = useProjectStore()
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name.split('.')[0],
      type: 'regular' as SymbolType
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
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
    
    for (const uploadedFile of uploadedFiles) {
      // In a real app, you'd upload to a server/CDN here
      // For now, we'll use data URLs
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(uploadedFile.file)
      })
      
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
    }
    
    // Cleanup
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview))
    setUploadedFiles([])
    setIsUploading(false)
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
                Large number of symbols may impact performance. Consider optimizing your images.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploadedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} Symbol${uploadedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}