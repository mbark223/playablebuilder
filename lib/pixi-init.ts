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
    // Disable the hello message
    if (PIXI.settings.RENDER_OPTIONS) {
      (PIXI.settings.RENDER_OPTIONS as any).hello = false;
    }
  }

  // Override problematic WebGL checks more aggressively
  if (typeof window !== 'undefined' && window.WebGLRenderingContext) {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
    
    // Override getParameter to handle all shader-related queries
    WebGLRenderingContext.prototype.getParameter = function(param: number) {
      try {
        // Handle specific problematic parameters
        switch (param) {
          // MAX_VERTEX_UNIFORM_VECTORS
          case 0x8DFB:
            return 128;
          // MAX_VARYING_VECTORS
          case 0x8DFC:
            return 16;
          // MAX_FRAGMENT_UNIFORM_VECTORS
          case 0x8DFD:
            return 128;
          // MAX_VERTEX_ATTRIBS
          case 0x8869:
            return 16;
          // MAX_TEXTURE_IMAGE_UNITS
          case 0x8872:
            return 16;
          default:
            const result = originalGetParameter.call(this, param);
            // Ensure we never return 0 for critical parameters
            if (result === 0 || result === null) {
              console.warn(`WebGL parameter ${param.toString(16)} returned ${result}, using fallback`);
              return 1;
            }
            return result;
        }
      } catch (e) {
        console.warn('WebGL parameter error:', e);
        return 1; // Safe fallback
      }
    };

    // Also handle WebGL2 if available
    if (window.WebGL2RenderingContext) {
      WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
    }
  }
}

// Call initialization immediately
initializePixi();