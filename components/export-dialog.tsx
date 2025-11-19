'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import type { Platform, ExportConfig } from '@/types'
import { formatFileSize } from '@/lib/utils'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PlatformOption {
  id: Platform
  name: string
  maxSize: string
  format: string
  orientation: string
  selected: boolean
}

export default function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { currentProject } = useProjectStore()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [platforms, setPlatforms] = useState<PlatformOption[]>([
    { id: 'snapchat', name: 'Snapchat', maxSize: '5MB', format: 'HTML', orientation: 'Portrait/Landscape', selected: true },
    { id: 'facebook', name: 'Facebook', maxSize: '2MB', format: 'HTML', orientation: 'All', selected: true },
    { id: 'google', name: 'Google', maxSize: '1MB', format: 'ZIP', orientation: 'Responsive', selected: true },
    { id: 'unity', name: 'Unity Ads', maxSize: '5MB', format: 'HTML', orientation: 'Universal', selected: false },
    { id: 'ironsource', name: 'IronSource', maxSize: '5MB', format: 'HTML', orientation: 'Universal', selected: false },
    { id: 'applovin', name: 'AppLovin', maxSize: '3MB', format: 'HTML', orientation: 'Universal', selected: false },
  ])
  
  const togglePlatform = (id: Platform) => {
    setPlatforms(prev =>
      prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
    )
  }
  
  const selectedPlatforms = platforms.filter(p => p.selected)
  
  const handleExport = async () => {
    if (!currentProject || selectedPlatforms.length === 0) return
    
    setIsExporting(true)
    setExportProgress(0)
    
    // Simulate export process
    for (let i = 0; i < selectedPlatforms.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setExportProgress((i + 1) / selectedPlatforms.length * 100)
    }
    
    setIsExporting(false)
    setExportProgress(0)
    onOpenChange(false)
    
    // In a real app, this would trigger actual export logic
    alert(`Exported ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}!`)
  }
  
  const canExport = currentProject && currentProject.config.symbols.length > 0
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Playable Ad</DialogTitle>
          <DialogDescription>
            Select target platforms and export your playable ad
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {!canExport && (
            <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm">
                Please upload symbols before exporting your playable ad.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Target Platforms</h3>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map(platform => (
                  <div
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-colors
                      ${platform.selected ? 'border-primary bg-primary/5' : 'hover:bg-accent'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {platform.name}
                          {platform.selected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max: {platform.maxSize} • {platform.format}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {platform.orientation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Export Options</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Optimize assets (recommended)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Include source maps for debugging</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Generate A/B test variants</span>
                </label>
              </div>
            </div>
            
            {selectedPlatforms.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Export Summary</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
                  {currentProject && ` • ${currentProject.config.symbols.length} symbols`}
                </p>
              </div>
            )}
            
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport || selectedPlatforms.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}