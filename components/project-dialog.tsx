'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, Trash2, Calendar, Package } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProjectDialog({ open, onOpenChange }: ProjectDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [brandName, setBrandName] = useState('')
  
  const { projects, currentProject, createProject, setCurrentProject, deleteProject } = useProjectStore()
  
  const handleCreateProject = () => {
    if (!projectName.trim() || !brandName.trim()) return
    
    createProject(projectName, brandName)
    setProjectName('')
    setBrandName('')
    setIsCreating(false)
    onOpenChange(false)
  }
  
  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId)
    onOpenChange(false)
  }
  
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Projects</DialogTitle>
          <DialogDescription>
            Manage your playable ad projects
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isCreating ? (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Create New Project</h3>
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Summer Slots Campaign"
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Lucky Vegas"
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-md outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateProject} disabled={!projectName.trim() || !brandName.trim()}>
                  Create Project
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button onClick={() => setIsCreating(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-auto">
                {projects.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No projects yet. Create your first project to get started.
                  </p>
                ) : (
                  projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-colors
                        ${currentProject?.id === project.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{project.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {project.brand}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(project.modified))} ago
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {project.config.symbols.length} symbols • {project.config.features.length} features
                          </div>
                        </div>
                        
                        {currentProject?.id === project.id && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min'
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr'
  return Math.floor(seconds / 86400) + ' days'
}