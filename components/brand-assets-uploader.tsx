'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Image as ImageIcon, Video, AlertCircle, Loader2 } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { generateId, formatFileSize } from '@/lib/utils'
import type { BrandAsset } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BrandAssetsUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UploadedFile {
  id: string
  file: File
  preview: string
  category: BrandAsset['category']
  description: string
}

export default function BrandAssetsUploader({ open, onOpenChange }: BrandAssetsUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<BrandAsset['category']>('logo')
  const { addBrandAsset } = useProjectStore()
  
  const acceptedFiles = {
    logo: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp']
    },
    banner: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    screenshot: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    guideline: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    video: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    }
  }
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: generateId(),
      file,
      preview: file.type.startsWith('image/') || file.type.startsWith('video/') 
        ? URL.createObjectURL(file) 
        : '',
      category: activeCategory,
      description: ''
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [activeCategory])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles[activeCategory],
    multiple: true
  })
  
  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }
  
  const updateFileCategory = (id: string, category: BrandAsset['category']) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, category } : f)
    )
  }
  
  const updateFileDescription = (id: string, description: string) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, description } : f)
    )
  }
  
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }
  
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration))
      }
      video.src = URL.createObjectURL(file)
    })
  }
  
  const handleUpload = async () => {
    setIsUploading(true)
    
    for (const uploadedFile of uploadedFiles) {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(uploadedFile.file)
      })
      
      let dimensions: { width: number; height: number } | undefined
      let duration: number | undefined
      
      if (uploadedFile.file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(uploadedFile.file)
      } else if (uploadedFile.file.type.startsWith('video/')) {
        duration = await getVideoDuration(uploadedFile.file)
      }
      
      const brandAsset: BrandAsset = {
        id: uploadedFile.id,
        name: uploadedFile.file.name,
        type: uploadedFile.file.type.startsWith('video/') ? 'video' : 
              uploadedFile.file.type.includes('pdf') || uploadedFile.file.type.includes('doc') ? 'document' : 
              'image',
        url: dataUrl,
        size: uploadedFile.file.size,
        category: uploadedFile.category,
        description: uploadedFile.description,
        dimensions,
        duration,
        tags: []
      }
      
      addBrandAsset(uploadedFile.category, brandAsset)
    }
    
    uploadedFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview)
    })
    setUploadedFiles([])
    setIsUploading(false)
    onOpenChange(false)
  }
  
  const handleClose = () => {
    uploadedFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview)
    })
    setUploadedFiles([])
    onOpenChange(false)
  }
  
  const categoryIcons = {
    logo: <ImageIcon className="h-4 w-4" />,
    banner: <ImageIcon className="h-4 w-4" />,
    screenshot: <ImageIcon className="h-4 w-4" />,
    guideline: <FileText className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Brand Assets</DialogTitle>
          <DialogDescription>
            Upload brand guidelines, logos, banners, screenshots, and videos for your playable ad
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as BrandAsset['category'])} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="logo">Logos</TabsTrigger>
            <TabsTrigger value="banner">Banners</TabsTrigger>
            <TabsTrigger value="screenshot">Screenshots</TabsTrigger>
            <TabsTrigger value="guideline">Guidelines</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeCategory} className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  {categoryIcons[activeCategory]}
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? `Drop ${activeCategory}s here...`
                      : `Drag & drop ${activeCategory}s here, or click to select`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeCategory === 'logo' && 'PNG, JPG, SVG, WebP'}
                    {activeCategory === 'banner' && 'PNG, JPG, WebP'}
                    {activeCategory === 'screenshot' && 'PNG, JPG, WebP'}
                    {activeCategory === 'guideline' && 'PDF, DOC, DOCX, PNG, JPG'}
                    {activeCategory === 'video' && 'MP4, WebM, MOV, AVI'}
                  </p>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {uploadedFiles.map(file => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                        {file.preview && file.file.type.startsWith('image/') && (
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="h-16 w-16 object-contain rounded"
                          />
                        )}
                        {file.file.type.startsWith('video/') && (
                          <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {!file.preview && !file.file.type.startsWith('video/') && (
                          <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium truncate">{file.file.name}</p>
                          <input
                            type="text"
                            placeholder="Add description..."
                            value={file.description}
                            onChange={(e) => updateFileDescription(file.id, e.target.value)}
                            className="w-full text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={file.category}
                              onChange={(e) => updateFileCategory(file.id, e.target.value as BrandAsset['category'])}
                              className="text-xs bg-secondary px-2 py-1 rounded"
                            >
                              <option value="logo">Logo</option>
                              <option value="banner">Banner</option>
                              <option value="screenshot">Screenshot</option>
                              <option value="guideline">Guideline</option>
                              <option value="video">Video</option>
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
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm text-yellow-500">
                    Large number of files may impact performance.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploadedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}