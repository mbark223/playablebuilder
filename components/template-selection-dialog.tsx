'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TemplateSelector } from './templates/template-selector'
import { useProjectStore } from '@/store/project-store'
import { Toast } from '@/components/ui/toast'
import type { PlayableTemplate } from '@/types/templates'

interface TemplateSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TemplateSelectionDialog({ open, onOpenChange }: TemplateSelectionDialogProps) {
  const { currentProject, applyTemplate } = useProjectStore()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const handleSelectTemplate = (template: PlayableTemplate) => {
    if (currentProject) {
      applyTemplate(template)
      setToastMessage(`Template "${template.name}" applied successfully!`)
      setShowToast(true)
      onOpenChange(false)
    }
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Gameplay Template</DialogTitle>
            <DialogDescription>
              Select a pre-configured gameplay scenario for your playable ad
            </DialogDescription>
          </DialogHeader>
          
          <TemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentTemplateId={currentProject?.templateId}
          />
        </DialogContent>
      </Dialog>
      
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}