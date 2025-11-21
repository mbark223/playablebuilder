'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Trophy, 
  Timer, 
  TrendingUp, 
  Gift,
  CheckCircle2,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { predefinedTemplates, getTemplatesByCategory } from '@/lib/templates/predefined-templates'
import type { PlayableTemplate } from '@/types/templates'

interface TemplateSelectorProps {
  onSelectTemplate: (template: PlayableTemplate) => void
  currentTemplateId?: string
}

const categoryIcons = {
  engagement: Sparkles,
  conversion: TrendingUp,
  retention: Timer,
  bonus: Gift,
  seasonal: Trophy
}

const categoryColors = {
  engagement: 'bg-blue-500',
  conversion: 'bg-green-500',
  retention: 'bg-purple-500',
  bonus: 'bg-yellow-500',
  seasonal: 'bg-red-500'
}

const categoryGradients = {
  engagement: 'from-blue-500/80 via-indigo-500/80 to-purple-500/80',
  conversion: 'from-green-500/80 via-emerald-500/80 to-teal-500/80',
  retention: 'from-violet-500/80 via-fuchsia-500/80 to-rose-500/80',
  bonus: 'from-amber-500/80 via-orange-500/80 to-red-500/80',
  seasonal: 'from-red-500/80 via-pink-500/80 to-purple-500/80'
}

export function TemplateSelector({ onSelectTemplate, currentTemplateId }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PlayableTemplate | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleSelectTemplate = (template: PlayableTemplate) => {
    setSelectedTemplate(template)
    setShowDetails(true)
  }

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      setShowDetails(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Choose a Template</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a pre-built gameplay scenario to quickly create engaging playable ads
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="bonus">Bonus</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TemplateGrid 
              templates={predefinedTemplates} 
              currentTemplateId={currentTemplateId}
              onSelect={handleSelectTemplate}
            />
          </TabsContent>

          {(['engagement', 'conversion', 'retention', 'bonus', 'seasonal'] as const).map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <TemplateGrid 
                templates={getTemplatesByCategory(category)} 
                currentTemplateId={currentTemplateId}
                onSelect={handleSelectTemplate}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={categoryColors[selectedTemplate.category]}>
                    {selectedTemplate.category}
                  </Badge>
                  {selectedTemplate.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Scenario Flow</h4>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    <div className="space-y-2">
                      {selectedTemplate.scenario.steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">
                              {step.type.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {step.action.replace(/-/g, ' ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Offer Configuration</h4>
                  <div className="rounded-md border p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {selectedTemplate.scenario.offer.type}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Headline:</span> {selectedTemplate.scenario.offer.content.headline}
                    </p>
                    {selectedTemplate.scenario.offer.content.bonus && (
                      <p className="text-sm">
                        <span className="font-medium">Bonus:</span> {selectedTemplate.scenario.offer.content.bonus.amount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmTemplate}>
                    Use This Template
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

interface TemplateGridProps {
  templates: PlayableTemplate[]
  currentTemplateId?: string
  onSelect: (template: PlayableTemplate) => void
}

function TemplateGrid({ templates, currentTemplateId, onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => {
        const Icon = categoryIcons[template.category]
        const isSelected = currentTemplateId === template.id

        return (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
              }`}
              onClick={() => onSelect(template)}
            >
              <div className="relative h-36 w-full overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[template.category]} opacity-80`}
                />
                <div
                  className="absolute inset-0 bg-center bg-cover mix-blend-lighten opacity-70"
                  style={{ backgroundImage: `url(${template.thumbnail})` }}
                />
                <div className="relative z-10 h-full w-full flex flex-col justify-between p-4 text-white">
                  <p className="text-xs uppercase tracking-wide opacity-80">{template.scenario.type.replace('-', ' ')}</p>
                  <div>
                    <p className="text-sm font-medium">{template.scenario.offer.content.headline}</p>
                    <p className="text-xs opacity-80">{template.scenario.offer.content.cta.text}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-md ${categoryColors[template.category]} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-xs text-gray-500">
                        {template.scenario.steps.length} steps
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <span>{template.scenario.steps.length} steps</span>
                    <span>•</span>
                    <span>{template.popularity}% popularity</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {template.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(template)
                      }}
                    >
                      <Info className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(template)
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
