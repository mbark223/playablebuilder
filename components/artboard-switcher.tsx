'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Smartphone, 
  Square, 
  Monitor, 
  Link2, 
  Unlink,
  Eye,
  EyeOff,
  Copy,
  Trash2
} from 'lucide-react';
import { Artboard, CanvasState } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ArtboardSwitcherProps {
  artboards: Artboard[];
  selectedArtboardId: string | null;
  onSelectArtboard: (id: string) => void;
  onDeleteArtboard?: (id: string) => void;
  onDuplicateArtboard?: (id: string) => void;
  synchronizedEditing?: boolean;
  onToggleSynchronized?: () => void;
}

function getArtboardIcon(width: number, height: number) {
  const aspectRatio = width / height;
  if (aspectRatio < 0.8) return Smartphone;
  if (aspectRatio > 1.2) return Monitor;
  return Square;
}

function getArtboardLabel(artboard: Artboard) {
  const aspectRatio = artboard.width / artboard.height;
  let type = 'Custom';
  
  if (aspectRatio < 0.8) type = 'Portrait';
  else if (aspectRatio > 1.2) type = 'Landscape';
  else type = 'Square';
  
  return `${artboard.width}×${artboard.height}`;
}

export function ArtboardSwitcher({
  artboards,
  selectedArtboardId,
  onSelectArtboard,
  onDeleteArtboard,
  onDuplicateArtboard,
  synchronizedEditing = false,
  onToggleSynchronized,
}: ArtboardSwitcherProps) {
  if (artboards.length === 0) return null;

  return (
    <div className="flex items-center space-x-4 p-2 bg-background border-b">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-muted-foreground">Artboards:</span>
        
        <ToggleGroup 
          type="single" 
          value={selectedArtboardId || undefined}
          onValueChange={(value) => value && onSelectArtboard(value)}
          className="flex space-x-1"
        >
          {artboards.map((artboard) => {
            const Icon = getArtboardIcon(artboard.width, artboard.height);
            const isSelected = artboard.id === selectedArtboardId;
            
            return (
              <DropdownMenu key={artboard.id}>
                <DropdownMenuTrigger asChild>
                  <ToggleGroupItem
                    value={artboard.id}
                    className={cn(
                      "relative flex items-center space-x-2 px-3 py-1.5",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{getArtboardLabel(artboard)}</span>
                    {artboard.name && (
                      <Badge variant="secondary" className="ml-1 text-xs py-0 px-1">
                        {artboard.name}
                      </Badge>
                    )}
                  </ToggleGroupItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onSelectArtboard(artboard.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {onDuplicateArtboard && (
                    <DropdownMenuItem onClick={() => onDuplicateArtboard(artboard.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDeleteArtboard && artboards.length > 1 && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteArtboard(artboard.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </ToggleGroup>
      </div>

      {onToggleSynchronized && artboards.length > 1 && (
        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant={synchronizedEditing ? "default" : "outline"}
            size="sm"
            onClick={onToggleSynchronized}
            className="flex items-center space-x-2"
          >
            {synchronizedEditing ? (
              <>
                <Link2 className="h-4 w-4" />
                <span>Synchronized</span>
              </>
            ) : (
              <>
                <Unlink className="h-4 w-4" />
                <span>Independent</span>
              </>
            )}
          </Button>
          <Badge variant="outline" className="text-xs">
            {synchronizedEditing 
              ? 'Edits apply to all artboards' 
              : 'Edits apply to selected artboard only'}
          </Badge>
        </div>
      )}
    </div>
  );
}