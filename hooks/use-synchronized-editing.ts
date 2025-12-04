import { useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/project-store';
import { CanvasElement } from '@/types';

export function useSynchronizedEditing() {
  const { currentProject, updateProject, updateCanvasElement } = useProjectStore();
  
  // Use a ref to store the latest values without causing re-renders
  const stateRef = useRef({
    currentProject,
    canvasState: currentProject?.canvas,
  });

  // Update the ref when values change
  useEffect(() => {
    stateRef.current = {
      currentProject,
      canvasState: currentProject?.canvas,
    };
  }, [currentProject]);

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    const { currentProject, canvasState } = stateRef.current;
    if (!currentProject || !canvasState) return;

    const { elements, synchronizedEditing } = canvasState;

    if (!synchronizedEditing) {
      // Normal single element update using existing store method
      updateCanvasElement(elementId, updates);
      return;
    }

    // Find the element being updated
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement || !targetElement.syncGroup) {
      // No sync group, update normally
      updateCanvasElement(elementId, updates);
      return;
    }

    // Update all elements in the same sync group
    const updatedElements = elements.map(el => {
      if (el.syncGroup === targetElement.syncGroup) {
        // Calculate relative position/size changes
        const relativeUpdates: Partial<CanvasElement> = {};

        // For position changes, maintain relative positioning
        if (updates.position && targetElement.position) {
          const deltaX = updates.position.x - targetElement.position.x;
          const deltaY = updates.position.y - targetElement.position.y;
          
          // Get artboard dimensions for this element
          const artboard = canvasState.artboards.find(ab => ab.id === el.artboardId);
          const targetArtboard = canvasState.artboards.find(ab => ab.id === targetElement.artboardId);
          
          if (artboard && targetArtboard) {
            // Scale the position based on artboard size ratio
            const scaleX = artboard.width / targetArtboard.width;
            const scaleY = artboard.height / targetArtboard.height;
            
            relativeUpdates.position = {
              x: el.position.x + (deltaX * scaleX),
              y: el.position.y + (deltaY * scaleY),
            };
          }
        }

        // For size changes, scale proportionally
        if (updates.size && targetElement.size) {
          const artboard = canvasState.artboards.find(ab => ab.id === el.artboardId);
          const targetArtboard = canvasState.artboards.find(ab => ab.id === targetElement.artboardId);
          
          if (artboard && targetArtboard) {
            const scaleX = artboard.width / targetArtboard.width;
            const scaleY = artboard.height / targetArtboard.height;
            
            const widthRatio = updates.size.width / targetElement.size.width;
            const heightRatio = updates.size.height / targetElement.size.height;
            
            relativeUpdates.size = {
              width: el.size.width * widthRatio,
              height: el.size.height * heightRatio,
            };
          }
        }

        // Copy over other properties directly
        const directCopyProps = ['text', 'color', 'fontSize', 'fontWeight', 'textAlign', 
                                'fill', 'borderColor', 'borderWidth', 'radius', 'opacity',
                                'rotation', 'src', 'visible', 'locked'];
        
        directCopyProps.forEach(prop => {
          if (prop in updates) {
            (relativeUpdates as any)[prop] = (updates as any)[prop];
          }
        });

        return { ...el, ...relativeUpdates } as CanvasElement;
      }
      return el;
    }) as CanvasElement[];

    // Update the entire canvas with new elements
    updateProject(currentProject.id, {
      canvas: {
        ...canvasState,
        elements: updatedElements,
      }
    });
  }, [updateCanvasElement, updateProject]);

  const updateMultipleElements = useCallback((elementIds: string[], updates: Partial<CanvasElement>) => {
    const { currentProject, canvasState } = stateRef.current;
    if (!currentProject || !canvasState) return;

    const { elements, synchronizedEditing } = canvasState;

    if (!synchronizedEditing) {
      // Normal multiple element update
      const updatedElements = elements.map(el => 
        elementIds.includes(el.id) ? { ...el, ...updates } as CanvasElement : el
      ) as CanvasElement[];
      
      updateProject(currentProject.id, {
        canvas: {
          ...canvasState,
          elements: updatedElements,
        }
      });
      return;
    }

    // Collect all sync groups from selected elements
    const syncGroups = new Set<string>();
    elementIds.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element?.syncGroup) {
        syncGroups.add(element.syncGroup);
      }
    });

    // Update all elements in the collected sync groups
    const updatedElements = elements.map(el => {
      if (el.syncGroup && syncGroups.has(el.syncGroup)) {
        // Apply updates (simplified for multiple selection)
        return { ...el, ...updates } as CanvasElement;
      }
      if (elementIds.includes(el.id) && !el.syncGroup) {
        // Update elements without sync groups normally
        return { ...el, ...updates } as CanvasElement;
      }
      return el;
    }) as CanvasElement[];

    updateProject(currentProject.id, {
      canvas: {
        ...canvasState,
        elements: updatedElements,
      }
    });
  }, [updateProject]);

  const deleteElements = useCallback((elementIds: string[]) => {
    const { currentProject, canvasState } = stateRef.current;
    if (!currentProject || !canvasState) return;

    const { elements, synchronizedEditing } = canvasState;

    if (!synchronizedEditing) {
      // Normal deletion
      const remainingElements = elements.filter(el => !elementIds.includes(el.id));
      
      updateProject(currentProject.id, {
        canvas: {
          ...canvasState,
          elements: remainingElements,
        }
      });
      return;
    }

    // Collect sync groups of elements to delete
    const syncGroups = new Set<string>();
    elementIds.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element?.syncGroup) {
        syncGroups.add(element.syncGroup);
      }
    });

    // Delete all elements in the same sync groups
    const remainingElements = elements.filter(el => {
      if (el.syncGroup && syncGroups.has(el.syncGroup)) {
        return false; // Delete all in sync group
      }
      if (elementIds.includes(el.id) && !el.syncGroup) {
        return false; // Delete non-synced elements
      }
      return true; // Keep element
    });

    updateProject(currentProject.id, {
      canvas: {
        ...canvasState,
        elements: remainingElements,
      }
    });
  }, [updateProject]);

  const toggleSynchronizedEditing = useCallback(() => {
    const { currentProject, canvasState } = stateRef.current;
    if (!currentProject || !canvasState) return;

    updateProject(currentProject.id, {
      canvas: {
        ...canvasState,
        synchronizedEditing: !canvasState.synchronizedEditing,
      }
    });
  }, [updateProject]);

  return {
    updateElement,
    updateMultipleElements,
    deleteElements,
    toggleSynchronizedEditing,
    isSynchronized: currentProject?.canvas?.synchronizedEditing || false,
  };
}