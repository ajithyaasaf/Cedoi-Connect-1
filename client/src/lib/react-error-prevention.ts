/**
 * Advanced React Error Prevention System
 * Comprehensive solution to prevent "Objects are not valid as a React child" errors
 */

import React from 'react';

/**
 * React Child Validator - Ensures all JSX children are valid
 */
export function validateReactChild(child: any): React.ReactNode {
  // Handle null/undefined
  if (child === null || child === undefined) {
    return null;
  }

  // Handle primitives (string, number, boolean)
  if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
    return child;
  }

  // Handle valid React elements
  if (React.isValidElement(child)) {
    return child;
  }

  // Handle arrays
  if (Array.isArray(child)) {
    return child.map((item, index) => validateReactChild(item)).filter(Boolean);
  }

  // Handle objects - convert to safe string representation
  if (typeof child === 'object') {
    // Check if it's a Date object
    if (child instanceof Date) {
      return child.toISOString();
    }
    
    // Check if it's an Error object
    if (child instanceof Error) {
      return child.message;
    }
    
    // For other objects, return a safe string representation
    try {
      return JSON.stringify(child);
    } catch (e) {
      return '[Complex Object]';
    }
  }

  // Handle functions
  if (typeof child === 'function') {
    return '[Function]';
  }

  // Fallback - convert to string
  return String(child);
}

/**
 * Advanced Error Boundary Component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AdvancedErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Advanced Error Boundary caught an error:', error, errorInfo);
    
    // Check for React child errors specifically
    if (error.message.includes('Objects are not valid as a React child')) {
      console.error('React child error detected:', error);
      // Log additional debugging info
      console.error('Error stack:', error.stack);
      console.error('Component stack:', errorInfo.componentStack);
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return React.createElement('div', {
        className: 'min-h-screen bg-red-50 flex items-center justify-center p-4'
      }, 
        React.createElement('div', {
          className: 'bg-white rounded-lg shadow-lg p-6 max-w-md w-full'
        }, [
          React.createElement('h2', {
            key: 'title',
            className: 'text-xl font-bold text-red-600 mb-2'
          }, 'Application Error'),
          React.createElement('p', {
            key: 'message',
            className: 'text-gray-700 mb-4'
          }, 'Something went wrong. Please refresh the page.'),
          React.createElement('button', {
            key: 'button',
            className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
            onClick: () => window.location.reload()
          }, 'Refresh Page')
        ])
      );
    }

    return this.props.children;
  }
}

/**
 * Safe Text Renderer - Ensures all text is safely rendered
 */
export function SafeText({ children, fallback = '' }: { children: any; fallback?: string }) {
  const safeContent = validateReactChild(children);
  
  if (safeContent === null || safeContent === undefined || safeContent === '') {
    return fallback;
  }
  
  return safeContent;
}

/**
 * Safe Component Wrapper - Wraps any component to prevent child errors
 */
export function SafeWrapper({ children }: { children: React.ReactNode }) {
  try {
    const validatedChildren = validateReactChild(children);
    return React.createElement(React.Fragment, {}, validatedChildren);
  } catch (error) {
    console.error('SafeWrapper caught an error:', error);
    return React.createElement('span', {
      className: 'text-red-500 text-sm'
    }, 'Content Error');
  }
}

/**
 * Hook to safely render any content
 */
export function useSafeRender() {
  return {
    safeText: (text: any, fallback?: string) => validateReactChild(text) || fallback || '',
    safeRender: validateReactChild,
    SafeText,
    SafeWrapper
  };
}