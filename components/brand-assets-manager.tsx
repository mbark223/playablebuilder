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
        <div className="text-center py-6 text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            {category === 'logo' && <ImageIcon className="h-6 w-6 text-muted-foreground" />}
            {category === 'banner' && <ImageIcon className="h-6 w-6 text-muted-foreground" />}
            {category === 'screenshot' && <ImageIcon className="h-6 w-6 text-muted-foreground" />}
            {category === 'guideline' && <FileText className="h-6 w-6 text-muted-foreground" />}
            {category === 'video' && <Video className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="text-sm mb-2">No {category}s uploaded yet</p>
          <Button size="sm" variant="outline" onClick={onUploadClick} className="h-7 text-xs">
            Upload {category}s
          </Button>
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {assets.map(asset => (
          <div key={asset.id} className="group relative bg-background rounded-lg border overflow-hidden hover:shadow-sm transition-shadow">
            <div className="aspect-video relative bg-muted/50">
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
                <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 shadow-sm">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {asset.type === 'document' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:bg-muted"
                      onClick={() => window.open(asset.url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeBrandAsset(category, asset.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <p className="text-xs font-medium truncate" title={asset.name}>{asset.name}</p>
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
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>{formatFileSize(asset.size)}</span>
                {asset.dimensions && (
                  <>
                    <span>•</span>
                    <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                  </>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Brand Assets</h2>
          <Button size="sm" variant="outline" onClick={onUploadClick} className="h-7 text-xs">
            <ImageIcon className="h-3 w-3 mr-1" />
            Upload
          </Button>
        </div>
        
        <Tabs defaultValue="logos" className="w-full">
          <TabsList className="w-full h-auto p-1 flex flex-wrap">
            <TabsTrigger value="logos" className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Logos</span>
              <span className="sm:hidden">Logo</span>
              <span className="ml-1 font-normal">({brandAssets.logos.length})</span>
            </TabsTrigger>
            <TabsTrigger value="banners" className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Banners</span>
              <span className="sm:hidden">Banner</span>
              <span className="ml-1 font-normal">({brandAssets.banners.length})</span>
            </TabsTrigger>
            <TabsTrigger value="screenshots" className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Screenshots</span>
              <span className="sm:hidden">Screen</span>
              <span className="ml-1 font-normal">({brandAssets.screenshots.length})</span>
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Guidelines</span>
              <span className="sm:hidden">Guide</span>
              <span className="ml-1 font-normal">({brandAssets.guidelines.length})</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <span className="hidden sm:inline">Videos</span>
              <span className="sm:hidden">Video</span>
              <span className="ml-1 font-normal">({brandAssets.videos.length})</span>
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