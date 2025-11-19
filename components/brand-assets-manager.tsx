'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/project-store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, Image as ImageIcon, Video, Download, Trash2, Edit2, Eye, X } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { BrandAsset } from '@/types'

interface BrandAssetsManagerProps {
  onUploadClick: () => void
}

export default function BrandAssetsManager({ onUploadClick }: BrandAssetsManagerProps) {
  const { currentProject, removeBrandAsset, updateBrandAsset } = useProjectStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null)
  
  if (!currentProject) return null
  
  const brandAssets = currentProject?.brandAssets || {
    logos: [],
    banners: [],
    screenshots: [],
    guidelines: [],
    videos: []
  }
  
  
  const startEdit = (asset: BrandAsset) => {
    setEditingId(asset.id)
    setEditDescription(asset.description || '')
  }
  
  const saveEdit = (category: BrandAsset['category']) => {
    if (editingId) {
      updateBrandAsset(category, editingId, { description: editDescription })
      setEditingId(null)
      setEditDescription('')
    }
  }
  
  const cancelEdit = () => {
    setEditingId(null)
    setEditDescription('')
  }
  
  const renderAssetGrid = (assets: BrandAsset[], category: BrandAsset['category']) => {
    if (assets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No {category}s uploaded yet</p>
          <Button size="sm" onClick={onUploadClick}>
            Upload {category}s
          </Button>
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map(asset => (
          <div key={asset.id} className="group relative bg-card rounded-lg border overflow-hidden">
            <div className="aspect-video relative bg-muted">
              {asset.type === 'image' && (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setPreviewAsset(asset)}
                />
              )}
              {asset.type === 'video' && (
                <div 
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <Video className="h-12 w-12 text-muted-foreground" />
                  {asset.duration && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/80 text-white px-1 py-0.5 rounded">
                      {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              )}
              {asset.type === 'document' && (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {asset.type === 'document' && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => window.open(asset.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => removeBrandAsset(category, asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-sm font-medium truncate">{asset.name}</p>
              {editingId === asset.id ? (
                <div className="mt-1 flex gap-1">
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(category)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 text-xs bg-background border rounded px-1 py-0.5"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => saveEdit(category)}
                  >
                    ✓
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {asset.description || 'No description'}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => startEdit(asset)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(asset.size)}</span>
                {asset.dimensions && (
                  <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <>
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Brand Assets</h2>
          <Button size="sm" onClick={onUploadClick}>
            Upload Assets
          </Button>
        </div>
        
        <Tabs defaultValue="logos">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="logos" className="text-xs">
              Logos ({brandAssets.logos.length})
            </TabsTrigger>
            <TabsTrigger value="banners" className="text-xs">
              Banners ({brandAssets.banners.length})
            </TabsTrigger>
            <TabsTrigger value="screenshots" className="text-xs">
              Screenshots ({brandAssets.screenshots.length})
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="text-xs">
              Guidelines ({brandAssets.guidelines.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs">
              Videos ({brandAssets.videos.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="logos" className="mt-4">
            {renderAssetGrid(brandAssets.logos, 'logo')}
          </TabsContent>
          
          <TabsContent value="banners" className="mt-4">
            {renderAssetGrid(brandAssets.banners, 'banner')}
          </TabsContent>
          
          <TabsContent value="screenshots" className="mt-4">
            {renderAssetGrid(brandAssets.screenshots, 'screenshot')}
          </TabsContent>
          
          <TabsContent value="guidelines" className="mt-4">
            {renderAssetGrid(brandAssets.guidelines, 'guideline')}
          </TabsContent>
          
          <TabsContent value="videos" className="mt-4">
            {renderAssetGrid(brandAssets.videos, 'video')}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 z-10">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setPreviewAsset(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {previewAsset.type === 'image' && (
              <img
                src={previewAsset.url}
                alt={previewAsset.name}
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
            
            {previewAsset.type === 'video' && (
              <video
                src={previewAsset.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh]"
              />
            )}
            
            <div className="p-4 border-t">
              <h3 className="font-medium">{previewAsset.name}</h3>
              {previewAsset.description && (
                <p className="text-sm text-muted-foreground mt-1">{previewAsset.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{formatFileSize(previewAsset.size)}</span>
                {previewAsset.dimensions && (
                  <span>{previewAsset.dimensions.width}×{previewAsset.dimensions.height}</span>
                )}
                {previewAsset.duration && (
                  <span>Duration: {Math.floor(previewAsset.duration / 60)}:{(previewAsset.duration % 60).toString().padStart(2, '0')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}