'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/project-store'
import { useStoreHydration } from '@/hooks/use-store-hydration'
import { Button } from '@/components/ui/button'
import { Upload, Download, Settings, Play, Plus, FolderOpen, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues with canvas
const SlotCanvas = dynamic(() => import('@/components/slot-canvas'), { ssr: false })
const ProjectDialog = dynamic(() => import('@/components/project-dialog'), { ssr: false })
const SymbolUploader = dynamic(() => import('@/components/symbol-uploader'), { ssr: false })
const ExportDialog = dynamic(() => import('@/components/export-dialog'), { ssr: false })
const BrandAssetsUploader = dynamic(() => import('@/components/brand-assets-uploader'), { ssr: false })
const BrandAssetsManager = dynamic(() => import('@/components/brand-assets-manager'), { ssr: false })
const TemplateSelectionDialog = dynamic(() => import('@/components/template-selection-dialog'), { ssr: false })
import { getTemplateById } from '@/lib/templates/predefined-templates'

export default function Home() {
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showSymbolUploader, setShowSymbolUploader] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBrandAssetsUploader, setShowBrandAssetsUploader] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  
  const { currentProject, projects } = useProjectStore()
  useStoreHydration()
  
  useEffect(() => {
    if (!currentProject && projects.length === 0) {
      setShowProjectDialog(true)
    }
  }, [currentProject, projects])
  
  const handleSpin = async () => {
    setIsSpinning(true)
    // Spin logic will be handled by SlotCanvas
    setTimeout(() => setIsSpinning(false), 3000)
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Playable Ad Builder</h1>
              {currentProject && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium">{currentProject.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectDialog(true)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                disabled={!currentProject}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Elements */}
          <div className="col-span-3 space-y-4">
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="font-semibold mb-4">Slot Elements</h2>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowTemplateDialog(true)}
                  disabled={!currentProject}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Choose Template
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSymbolUploader(true)}
                  disabled={!currentProject}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Symbols
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!currentProject}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reel Configuration
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!currentProject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
              
              {currentProject && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Symbols ({currentProject.config.symbols.length})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {currentProject.config.symbols.map(symbol => (
                      <div
                        key={symbol.id}
                        className="bg-muted rounded p-2 text-center text-xs cursor-pointer hover:bg-accent"
                      >
                        {symbol.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Center - Canvas */}
          <div className="col-span-6">
            <div className="bg-card rounded-lg border overflow-hidden">
              {currentProject ? (
                <SlotCanvas
                  project={currentProject}
                  isSpinning={isSpinning}
                  onSpin={handleSpin}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p>Create a new project to get started</p>
                    <Button
                      className="mt-4"
                      onClick={() => setShowProjectDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controls */}
            {currentProject && (
              <div className="mt-4 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleSpin}
                  disabled={isSpinning || currentProject.config.symbols.length === 0}
                  className="min-w-[200px]"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isSpinning ? 'Spinning...' : 'SPIN'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Properties */}
          <div className="col-span-3 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="font-semibold mb-4">Properties</h2>
              
              {currentProject ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Template</label>
                    <p className="text-sm text-muted-foreground">
                      {currentProject.templateId ? 
                        getTemplateById(currentProject.templateId)?.name || currentProject.templateId 
                        : 'No template selected'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Layout</label>
                    <p className="text-sm text-muted-foreground">{currentProject.config.reels.layout}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">RTP</label>
                    <p className="text-sm text-muted-foreground">{currentProject.config.math.rtp}%</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Volatility</label>
                    <p className="text-sm text-muted-foreground capitalize">{currentProject.config.math.volatility}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Features</label>
                    <p className="text-sm text-muted-foreground">{currentProject.config.features.length} active</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No project selected</p>
              )}
            </div>
            
            {/* Brand Assets Section */}
            {currentProject && (
              <BrandAssetsManager onUploadClick={() => setShowBrandAssetsUploader(true)} />
            )}
            
            <div className="bg-card rounded-lg p-4 border">
              <h2 className="font-semibold mb-4">Export Stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Exports</span>
                  <span>{currentProject?.exports.history.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Export</span>
                  <span>-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showProjectDialog && (
        <ProjectDialog
          open={showProjectDialog}
          onOpenChange={setShowProjectDialog}
        />
      )}
      
      {showSymbolUploader && (
        <SymbolUploader
          open={showSymbolUploader}
          onOpenChange={setShowSymbolUploader}
        />
      )}
      
      {showExportDialog && (
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
        />
      )}
      
      {showBrandAssetsUploader && (
        <BrandAssetsUploader
          open={showBrandAssetsUploader}
          onOpenChange={setShowBrandAssetsUploader}
        />
      )}
      
      {showTemplateDialog && (
        <TemplateSelectionDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
        />
      )}
    </div>
  )
}