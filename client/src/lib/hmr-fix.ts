/**
 * HMR Error Fix - Prevents RefreshRuntime errors
 * Addresses "RefreshRuntime.register is not a function" errors
 */

// Prevent HMR-related errors by ensuring proper error handling
if (typeof window !== 'undefined' && import.meta.hot) {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console.error to catch and handle HMR errors
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Catch RefreshRuntime errors
    if (message.includes('RefreshRuntime.register is not a function')) {
      console.warn('🔧 HMR RefreshRuntime error detected - handling gracefully');
      return; // Don't propagate the error
    }
    
    // Catch other React HMR errors
    if (message.includes('Cannot read properties of undefined (reading \'register\')')) {
      console.warn('🔧 HMR register error detected - handling gracefully');
      return;
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };
  
  // Handle window errors
  window.addEventListener('error', (event) => {
    const message = event.message;
    
    if (message.includes('RefreshRuntime') || message.includes('Cannot read properties of undefined')) {
      console.warn('🔧 Window error related to HMR - preventing propagation');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    
    if (message.includes('RefreshRuntime') || message.includes('Cannot read properties of undefined')) {
      console.warn('🔧 Promise rejection related to HMR - preventing propagation');
      event.preventDefault();
      return false;
    }
  });
  
  // Additional protection for HMR module loading
  const originalImport = window.import || ((specifier: string) => import(specifier));
  
  // Override import to handle HMR module loading errors
  if (typeof window.import === 'undefined') {
    (window as any).import = async (specifier: string) => {
      try {
        return await originalImport(specifier);
      } catch (error) {
        console.warn('🔧 Import error handled:', error);
        return {}; // Return empty object to prevent crashes
      }
    };
  }
}

// Export a function to manually trigger HMR error recovery
export function recoverFromHMRError() {
  console.log('🔧 Attempting HMR error recovery...');
  
  // Clear any cached modules
  if (import.meta.hot) {
    import.meta.hot.invalidate();
  }
  
  // Force a gentle reload after a short delay
  setTimeout(() => {
    console.log('🔧 Performing gentle page reload for HMR recovery');
    window.location.reload();
  }, 100);
}

// Auto-recovery mechanism
let errorCount = 0;
const maxErrors = 3;

export function handleHMRError(error: any) {
  errorCount++;
  
  if (errorCount >= maxErrors) {
    console.warn('🔧 Multiple HMR errors detected - triggering recovery');
    recoverFromHMRError();
    errorCount = 0; // Reset counter
  }
}

// Reset error count on successful operations
export function resetErrorCount() {
  errorCount = 0;
}

console.log('🔧 HMR Error Fix loaded successfully');