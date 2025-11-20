import * as PIXI from 'pixi.js'
import './pixi-init' // Ensure initialization happens first

export interface CreatePixiAppOptions {
  view: HTMLCanvasElement
  width: number
  height: number
  backgroundColor?: number
}

export function createPixiApp(options: CreatePixiAppOptions): PIXI.Application | null {
  try {
    // First try WebGL
    const app = new PIXI.Application({
      view: options.view,
      width: options.width,
      height: options.height,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: options.backgroundColor || 0x000000,
      forceCanvas: false,
      powerPreference: 'low-power' // Use low power to avoid some GPU issues
    });
    
    // Test if WebGL is working properly
    const renderer = app.renderer;
    if (renderer.type === PIXI.RENDERER_TYPE.WEBGL) {
      // Simple test to ensure WebGL context is functional
      const gl = (renderer as any).gl;
      if (!gl || gl.isContextLost()) {
        throw new Error('WebGL context lost or unavailable');
      }
    }
    
    return app;
  } catch (webglError) {
    console.warn('WebGL initialization failed, falling back to Canvas:', webglError);
    
    try {
      // Fallback to Canvas renderer
      const app = new PIXI.Application({
        view: options.view,
        width: options.width,
        height: options.height,
        antialias: false, // Canvas doesn't support antialiasing
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: options.backgroundColor || 0x000000,
        forceCanvas: true // Force Canvas renderer
      });
      
      console.log('Successfully initialized Canvas renderer');
      return app;
    } catch (canvasError) {
      console.error('Both WebGL and Canvas initialization failed:', canvasError);
      return null;
    }
  }
}