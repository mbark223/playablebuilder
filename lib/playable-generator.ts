import { 
  CanvasElement, 
  Artboard,
  ImageCanvasElement,
  TextCanvasElement,
  ShapeCanvasElement,
  SlotCanvasElement 
} from '@/types';
import { MarketingKitSummary } from '@/lib/marketing-kit';
import { nanoid } from 'nanoid';

interface SizeInfo {
  id: string;
  width: number;
  height: number;
}

interface GeneratedPlayables {
  artboards: Artboard[];
  elements: CanvasElement[];
}

type ProgressCallback = (progress: number, message: string) => void;

// Layout variations for different ad formats
const LAYOUT_VARIATIONS = {
  portrait: [
    { name: 'Classic', config: { heroTop: 0.15, logoBottom: 0.85, ctaBottom: 0.92 } },
    { name: 'Centered', config: { heroTop: 0.35, logoBottom: 0.75, ctaBottom: 0.88 } },
    { name: 'Bottom Heavy', config: { heroTop: 0.5, logoBottom: 0.8, ctaBottom: 0.9 } },
  ],
  square: [
    { name: 'Balanced', config: { heroTop: 0.2, logoBottom: 0.8, ctaBottom: 0.9 } },
    { name: 'Top Focus', config: { heroTop: 0.1, logoBottom: 0.85, ctaBottom: 0.92 } },
    { name: 'Center Stage', config: { heroTop: 0.35, logoBottom: 0.7, ctaBottom: 0.85 } },
  ],
  landscape: [
    { name: 'Side by Side', config: { heroLeft: 0.1, logoRight: 0.9, ctaBottom: 0.85 } },
    { name: 'Full Width', config: { heroTop: 0.2, logoBottom: 0.8, ctaBottom: 0.9 } },
  ],
};

function getAspectRatio(width: number, height: number): 'portrait' | 'square' | 'landscape' {
  const ratio = width / height;
  if (ratio < 0.8) return 'portrait';
  if (ratio > 1.2) return 'landscape';
  return 'square';
}

function generateElementId(baseId: string, artboardId: string): string {
  return `${baseId}_${artboardId}`;
}

function createElementForArtboard(
  baseElement: any,
  artboard: Artboard,
  layoutConfig: any,
  elementType: string
): CanvasElement {
  // Create base element structure
  const baseStructure = {
    id: generateElementId(baseElement.id || nanoid(), artboard.id),
    name: baseElement.name || elementType,
    artboardId: artboard.id,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    rotation: 0,
    opacity: 1,
    layer: baseElement.layer || 0,
    visible: true,
    locked: false,
  };

  // Apply layout configuration and create specific element type
  let element: CanvasElement;
  
  switch (elementType) {
    case 'hero':
    case 'logo':
    case 'background': {
      const width = elementType === 'hero' ? artboard.width * 0.8 : 
                   elementType === 'logo' ? artboard.width * 0.3 : 
                   artboard.width;
      const height = elementType === 'hero' ? artboard.height * 0.3 : 
                    elementType === 'logo' ? width * 0.5 : 
                    artboard.height;
      const x = elementType === 'background' ? 0 : (artboard.width - width) / 2;
      const y = elementType === 'hero' ? artboard.height * (layoutConfig.heroTop || 0.2) :
               elementType === 'logo' ? artboard.height * (layoutConfig.logoBottom || 0.8) - height :
               0;
      
      element = {
        ...baseStructure,
        type: 'image',
        position: { x, y },
        size: { width, height },
        src: baseElement.src || '',
        fit: 'contain',
        maintainAspect: true,
      } as ImageCanvasElement;
      break;
    }
    case 'headline':
    case 'ctaText': {
      const width = elementType === 'headline' ? artboard.width * 0.9 : artboard.width * 0.6;
      const height = elementType === 'headline' ? 60 : 80;
      const x = (artboard.width - width) / 2;
      const y = elementType === 'headline' ? artboard.height * 0.05 : 
               artboard.height * (layoutConfig.ctaBottom || 0.9) - height;
      
      element = {
        ...baseStructure,
        type: 'text',
        position: { x, y },
        size: { width, height },
        text: baseElement.text || '',
        fontSize: baseElement.fontSize || 24,
        fontWeight: baseElement.fontWeight || 400,
        color: baseElement.color || '#000000',
        textAlign: baseElement.textAlign || 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        autoWidth: false,
      } as TextCanvasElement;
      break;
    }
    case 'cta': {
      const width = artboard.width * 0.6;
      const height = 80;
      const x = (artboard.width - width) / 2;
      const y = artboard.height * (layoutConfig.ctaBottom || 0.9) - height;
      
      element = {
        ...baseStructure,
        type: 'shape',
        position: { x, y },
        size: { width, height },
        fill: baseElement.fill || '#007AFF',
        borderColor: 'transparent',
        borderWidth: 0,
        radius: baseElement.cornerRadius || 40,
      } as ShapeCanvasElement;
      break;
    }
    case 'slot': {
      const slotSize = Math.min(artboard.width, artboard.height) * 0.6;
      const x = (artboard.width - slotSize) / 2;
      const y = (artboard.height - slotSize) / 2;
      
      element = {
        ...baseStructure,
        type: 'slot',
        position: { x, y },
        size: { width: slotSize, height: slotSize },
      } as SlotCanvasElement;
      break;
    }
    default:
      // Default to shape element
      element = {
        ...baseStructure,
        type: 'shape',
        fill: '#cccccc',
        borderColor: 'transparent',
        borderWidth: 0,
        radius: 0,
      } as ShapeCanvasElement;
  }

  // Apply any additional properties from baseElement
  if (baseElement.syncGroup) {
    (element as any).syncGroup = baseElement.syncGroup;
  }

  return element;
}

export async function generatePlayableVariations(
  marketingKit: MarketingKitSummary,
  sizes: SizeInfo[],
  onProgress?: ProgressCallback
): Promise<GeneratedPlayables> {
  const artboards: Artboard[] = [];
  const elements: CanvasElement[] = [];
  const totalSteps = sizes.length * 3; // 3 variations per size
  let currentStep = 0;

  // Generate master elements that will be synchronized
  const masterElements: Map<string, Partial<CanvasElement>> = new Map();
  
  // Create master background
  if (marketingKit.background) {
    masterElements.set('background', {
      id: `master_background_${nanoid()}`,
      type: 'image',
      name: 'Background',
      src: marketingKit.background,
      layer: 0,
      syncGroup: 'background',
    });
  }

  // Create master hero image
  if (marketingKit.hero) {
    masterElements.set('hero', {
      id: `master_hero_${nanoid()}`,
      type: 'image',
      name: 'Hero Image',
      src: marketingKit.hero,
      layer: 1,
      syncGroup: 'hero',
    });
  }

  // Create master logo
  if (marketingKit.logo) {
    masterElements.set('logo', {
      id: `master_logo_${nanoid()}`,
      type: 'image',
      name: 'Logo',
      src: marketingKit.logo,
      layer: 2,
      syncGroup: 'logo',
    });
  }

  // Create master headline
  if (marketingKit.headline) {
    masterElements.set('headline', {
      id: `master_headline_${nanoid()}`,
      type: 'text',
      name: 'Headline',
      text: marketingKit.headline,
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight: 700,
      color: '#000000',
      textAlign: 'center',
      layer: 3,
      syncGroup: 'headline',
    });
  }

  // Create master CTA
  masterElements.set('cta', {
    id: `master_cta_${nanoid()}`,
    type: 'shape',
    name: 'CTA Button',
    shape: 'rectangle',
    fill: '#007AFF',
    cornerRadius: 40,
    layer: 4,
    syncGroup: 'cta',
  });

  if (marketingKit.cta) {
    masterElements.set('ctaText', {
      id: `master_cta_text_${nanoid()}`,
      type: 'text',
      name: 'CTA Text',
      text: marketingKit.cta,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 700,
      color: '#FFFFFF',
      textAlign: 'center',
      layer: 5,
      syncGroup: 'cta',
    });
  }

  // Add slot gameplay element
  masterElements.set('slot', {
    id: `master_slot_${nanoid()}`,
    type: 'slot',
    name: 'Slot Game',
    layer: 10,
    syncGroup: 'slot',
  });

  // Generate artboards and elements for each size
  for (const size of sizes) {
    const aspectRatio = getAspectRatio(size.width, size.height);
    const layoutVariations = LAYOUT_VARIATIONS[aspectRatio] || LAYOUT_VARIATIONS.square;
    
    // Create up to 3 variations per size
    const variationCount = Math.min(3, layoutVariations.length);
    
    for (let i = 0; i < variationCount; i++) {
      currentStep++;
      onProgress?.(
        (currentStep / totalSteps) * 100,
        `Creating ${aspectRatio} variation ${i + 1}/${variationCount}`
      );

      const variation = layoutVariations[i];
      const artboardId = nanoid();
      
      // Create artboard
      const artboard: Artboard = {
        id: artboardId,
        name: `${size.width}×${size.height} - ${variation.name}`,
        width: size.width,
        height: size.height,
        backgroundColor: '#FFFFFF',
      };
      artboards.push(artboard);

      // Create elements for this artboard based on master elements
      for (const [elementType, masterElement] of masterElements) {
        if (elementType === 'ctaText') {
          // Skip CTA text for now, we'll add it after CTA button is created
          continue;
        }
        
        const element = createElementForArtboard(
          masterElement,
          artboard,
          variation.config,
          elementType
        );
        elements.push(element);
      }
      
      // Now add CTA text on top of CTA button
      const ctaTextMaster = masterElements.get('ctaText');
      if (ctaTextMaster) {
        const ctaButton = elements.find(
          el => el.artboardId === artboardId && el.name === 'CTA Button'
        );
        if (ctaButton) {
          const ctaTextElement = createElementForArtboard(
            {
              ...ctaTextMaster,
              // Override position to match button
              position: ctaButton.position,
              size: ctaButton.size,
            },
            artboard,
            variation.config,
            'ctaText'
          );
          elements.push(ctaTextElement);
        }
      }

      // Add a small delay to make the progress visible
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  onProgress?.(100, 'Generation complete!');

  return { artboards, elements };
}