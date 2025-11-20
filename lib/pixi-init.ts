import * as PIXI from 'pixi.js'

// Initialize PIXI with proper settings
export function initializePixi() {
  // Disable PIXI DevTools which can cause issues
  if (typeof window !== 'undefined') {
    (window as any).__PIXI_DISABLE_DEVTOOLS__ = true;
  }

  // Set PIXI settings before any application is created
  if (PIXI.settings) {
    PIXI.settings.STRICT_TEXTURE_CACHE = false;
    PIXI.settings.RENDER_OPTIONS = {
      ...PIXI.settings.RENDER_OPTIONS,
      hello: false,
    };
  }

  // Override problematic WebGL checks
  if (typeof window !== 'undefined' && window.WebGLRenderingContext) {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param: number) {
      try {
        const result = originalGetParameter.call(this, param);
        // If we get 0 or null for shader-related parameters, return a safe default
        if ((result === 0 || result === null) && 
            (param === 0x8DFB || param === 0x8DFC || param === 0x8DFD || param === 0x8DFE || param === 0x8DFF)) {
          return 128; // Safe default for shader parameters
        }
        return result;
      } catch (e) {
        console.warn('WebGL parameter error:', e);
        return 128; // Safe fallback
      }
    };
  }
}

// Call initialization immediately
initializePixi();