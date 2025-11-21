import * as PIXI from 'pixi.js'

// Initialize PIXI with proper settings
export function initializePixi() {
  // Disable PIXI DevTools which can cause issues
  if (typeof window !== 'undefined') {
    (window as any).__PIXI_DISABLE_DEVTOOLS__ = true;
    (globalThis as any).__PIXI_DEVTOOLS__ = {
      pixi: null,
      app: null
    };
  }

  // Set PIXI settings before any application is created
  if (PIXI.settings) {
    PIXI.settings.STRICT_TEXTURE_CACHE = false;
    // Force Canvas renderer preference
    (PIXI.settings as any).PREFER_ENV = 1; // CANVAS
    (PIXI.settings as any).FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;
    
    // Disable the hello message
    if (PIXI.settings.RENDER_OPTIONS) {
      (PIXI.settings.RENDER_OPTIONS as any).hello = false;
      (PIXI.settings.RENDER_OPTIONS as any).forceCanvas = true;
    }
  }

  // Don't try to override autoDetectRenderer as it may be read-only in production
  // Instead rely on the settings we've already configured above
}

// Call initialization immediately
initializePixi();