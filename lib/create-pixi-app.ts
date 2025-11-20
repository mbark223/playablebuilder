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
}

export function createPixiApp(options: CreatePixiAppOptions): PIXI.Application | null {
  // First, let's try to create a simple canvas renderer directly
  try {
    // Force Canvas2D renderer from the start
    const app = new PIXI.Application({
      view: options.view,
      width: options.width,
      height: options.height,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: options.backgroundColor || 0x000000,
      forceCanvas: true, // Always use Canvas
      // Disable features that might cause issues
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    });
    
    console.log('Successfully initialized Canvas renderer');
    return app;
  } catch (error) {
    console.error('Canvas renderer initialization failed:', error);
    
    // Try one more time with minimal options
    try {
      const app = new PIXI.Application({
        view: options.view,
        width: options.width,
        height: options.height,
        backgroundColor: options.backgroundColor || 0x000000,
        forceCanvas: true
      });
      
      return app;
    } catch (finalError) {
      console.error('All renderer initialization attempts failed:', finalError);
      return null;
    }
  }
}