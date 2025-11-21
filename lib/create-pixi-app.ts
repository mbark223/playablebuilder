import * as PIXI from 'pixi.js'
import './pixi-init' // Ensure initialization happens first

export interface CreatePixiAppOptions {
  view: HTMLCanvasElement
  width: number
  height: number
  backgroundColor?: number
}

// Monkey patch PIXI to avoid the shader check error
if (typeof window !== 'undefined') {
  // Override the checkMaxIfStatementsInShader function that's causing issues
  const pixiUtils = (PIXI as any).utils || (PIXI as any);
  if (pixiUtils.checkMaxIfStatementsInShader) {
    pixiUtils.checkMaxIfStatementsInShader = function() {
      return true; // Always return true to bypass the check
    };
  }
  
  // Also try to patch it on the renderer utils
  if ((PIXI as any).Renderer?.utils?.checkMaxIfStatementsInShader) {
    (PIXI as any).Renderer.utils.checkMaxIfStatementsInShader = function() {
      return true;
    };
  }
  
  // Ensure Canvas renderer is available
  if (!(PIXI as any).CanvasRenderer && (PIXI as any).Renderer) {
    (PIXI as any).CanvasRenderer = (PIXI as any).Renderer;
  }
}

export function createPixiApp(options: CreatePixiAppOptions): PIXI.Application | null {
  try {
    // Don't try to get 2D context first as it might conflict with PIXI
    // Let PIXI handle the context creation
    
    // Try to create PIXI app with explicit Canvas renderer
    try {
      // Force PIXI to use Canvas renderer by setting preference
      if ((PIXI as any).settings) {
        (PIXI as any).settings.PREFER_ENV = (PIXI as any).ENV?.CANVAS || 1;
        (PIXI as any).settings.RENDER_OPTIONS = {
          ...(PIXI as any).settings.RENDER_OPTIONS,
          forceCanvas: true
        };
      }
      
      const app = new PIXI.Application({
        view: options.view,
        width: options.width,
        height: options.height,
        resolution: 1, // Fixed resolution to avoid scaling issues
        autoDensity: false,
        backgroundColor: options.backgroundColor || 0x000000,
        forceCanvas: true,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
        // Explicitly specify the renderer
        ...(PIXI.VERSION.startsWith('7') ? { preferWebGLVersion: 0 } : {})
      } as any);
      
      console.log('Successfully initialized Canvas renderer');
      return app;
    } catch (pixiError) {
      console.error('PIXI initialization failed:', pixiError);
      
      // Last resort: try with absolute minimal settings
      try {
        const minimalApp = new PIXI.Application({
          view: options.view,
          width: options.width,
          height: options.height,
          forceCanvas: true
        } as any);
        
        console.log('Initialized with minimal settings');
        return minimalApp;
      } catch (minimalError) {
        console.error('Minimal initialization also failed:', minimalError);
        return null;
      }
    }
  } catch (error) {
    console.error('Canvas setup failed:', error);
    return null;
  }
}