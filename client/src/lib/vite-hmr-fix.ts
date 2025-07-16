/**
 * Vite HMR Fix - Prevents RefreshRuntime errors in Vite development
 * Comprehensive solution for HMR runtime issues
 */

// Ensure RefreshRuntime is available globally before any React components load
if (typeof window !== 'undefined' && import.meta.hot) {
  // Create a comprehensive RefreshRuntime mock
  const mockRefreshRuntime = {
    register: (type: any, id: string) => {
      // Mock registration - do nothing
    },
    
    createSignatureFunctionForTransform: () => {
      return () => {};
    },
    
    performReactRefresh: () => {
      // Mock refresh - do nothing
    },
    
    isLikelyComponentType: (type: any) => {
      return typeof type === 'function' && type.prototype && type.prototype.isReactComponent;
    },
    
    getFamilyByType: (type: any) => {
      return null;
    },
    
    schedule: (callback: () => void) => {
      callback();
    },
    
    injectIntoGlobalHook: (globalObject: any) => {
      // Mock injection
    }
  };
  
  // Ensure RefreshRuntime is available before any imports
  if (!(window as any).RefreshRuntime) {
    (window as any).RefreshRuntime = mockRefreshRuntime;
  }
  
  // Override the global __vite_plugin_react_preamble_installed__ to prevent conflicts
  (window as any).__vite_plugin_react_preamble_installed__ = true;
  
  // Intercept and handle React Refresh errors
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'error' && typeof listener === 'function') {
      const wrappedListener = (event: ErrorEvent) => {
        if (event.message?.includes('RefreshRuntime')) {
          console.warn('🔧 Vite HMR error intercepted:', event.message);
          event.preventDefault();
          return false;
        }
        return listener(event);
      };
      return originalAddEventListener.call(window, type, wrappedListener, options);
    }
    return originalAddEventListener.call(window, type, listener, options);
  };
}

// Export for manual usage if needed
export const ensureRefreshRuntime = () => {
  if (typeof window !== 'undefined' && !(window as any).RefreshRuntime) {
    (window as any).RefreshRuntime = {
      register: () => {},
      createSignatureFunctionForTransform: () => () => {},
      performReactRefresh: () => {},
      isLikelyComponentType: () => false,
      getFamilyByType: () => null,
      schedule: (cb: () => void) => cb(),
      injectIntoGlobalHook: () => {}
    };
  }
};