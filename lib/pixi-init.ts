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

  // Don't override WebGL methods as it causes issues
  // Instead, configure PIXI to handle failures gracefully
}

// Call initialization immediately
initializePixi();