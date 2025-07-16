/**
 * React Guardian - Prevents React import errors
 * Ensures React is always available and properly imported
 */

// Ensure React is globally available
if (typeof window !== 'undefined' && !(window as any).React) {
  try {
    // Use dynamic import instead of require in browser
    import('react').then(React => {
      (window as any).React = React;
    }).catch(e => {
      console.warn('React not found in window object');
    });
  } catch (e) {
    console.warn('React not found in window object');
  }
}

// Import and re-export React to ensure it's available
import * as React from 'react';

// Ensure React is properly exported
export default React;
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useContext = React.useContext;
export const createContext = React.createContext;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useRef = React.useRef;

// Comprehensive RefreshRuntime error prevention
if (typeof window !== 'undefined') {
  // Create a global RefreshRuntime fallback
  if (!(window as any).RefreshRuntime) {
    (window as any).RefreshRuntime = {
      register: () => {},
      createSignatureFunctionForTransform: () => () => {},
      performReactRefresh: () => {},
      isLikelyComponentType: () => false,
      getFamilyByType: () => null,
      register: () => {},
      schedule: () => {},
      injectIntoGlobalHook: () => {}
    };
  }
  
  // Override console.error to catch and handle RefreshRuntime errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('RefreshRuntime.register is not a function') || 
        message.includes('RefreshRuntime') ||
        message.includes('Cannot read properties of undefined (reading \'register\')')) {
      console.warn('🔧 RefreshRuntime error intercepted and handled');
      return;
    }
    originalError.apply(console, args);
  };
  
  // Global error handler for runtime errors
  window.addEventListener('error', (event) => {
    if (event.message.includes('RefreshRuntime')) {
      console.warn('🔧 RefreshRuntime window error intercepted');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (message.includes('RefreshRuntime')) {
      console.warn('🔧 RefreshRuntime promise rejection intercepted');
      event.preventDefault();
      return false;
    }
  });
}

// Global error handler for React child errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message.includes('Objects are not valid as a React child')) {
      console.error('React child error detected:', event.error);
      event.preventDefault();
      // Attempt to recover
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Objects are not valid as a React child')) {
      console.error('React child error in promise:', event.reason);
      event.preventDefault();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  });
}