/**
 * React Guardian - Prevents React import errors
 * Ensures React is always available and properly imported
 */

import React from 'react';

// Verify React is properly loaded
if (!React || !React.useState || !React.useEffect) {
  console.error('React Guardian: React is not properly loaded');
  throw new Error('React is not available. Please check your dependencies.');
}

// Export React hooks with fallback protection
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useContext = React.useContext;
export const createContext = React.createContext;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useRef = React.useRef;

// Ensure global React is available
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

export default React;