/**
 * Render Safety Utilities
 * Prevents "Objects are not valid as a React child" errors
 */

import React from 'react';

/**
 * Safely renders any value as a React child
 * Converts objects, arrays, and other non-renderable values to strings
 */
export function safeRender(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (React.isValidElement(value)) {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map((item, index) => safeRender(item)).join(', ');
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
  
  return String(value);
}

/**
 * Safely renders text content, handles null/undefined gracefully
 */
export function safeText(text: string | null | undefined, fallback: string = ''): string {
  if (text === null || text === undefined) {
    return fallback;
  }
  if (typeof text === 'string') {
    return text;
  }
  return String(text);
}

/**
 * Safely renders meeting agenda with fallback
 */
export function safeAgenda(agenda: string | null | undefined): string {
  return safeText(agenda, 'No agenda specified');
}

/**
 * Safely renders user name with fallback
 */
export function safeName(name: any): string {
  if (name === null || name === undefined) return 'Unknown User';
  if (typeof name === 'string') return name;
  if (typeof name === 'number') return String(name);
  if (typeof name === 'object' && name.toString) return name.toString();
  return 'Unknown User';
}

/**
 * Safely renders company name with fallback
 */
export function safeCompany(company: any): string {
  if (company === null || company === undefined) return 'Unknown Company';
  if (typeof company === 'string') return company;
  if (typeof company === 'number') return String(company);
  if (typeof company === 'object' && company.toString) return company.toString();
  return 'Unknown Company';
}

/**
 * Safely renders email with fallback
 */
export function safeEmail(email: any): string {
  if (email === null || email === undefined) return 'no-email@example.com';
  if (typeof email === 'string') return email;
  return String(email);
}

/**
 * Safely renders role with fallback
 */
export function safeRole(role: any): string {
  if (role === null || role === undefined) return 'member';
  if (typeof role === 'string') return role;
  return String(role);
}

/**
 * Safely renders venue with fallback
 */
export function safeVenue(venue: any): string {
  if (venue === null || venue === undefined) return 'Venue TBD';
  if (typeof venue === 'string') return venue;
  return String(venue);
}

/**
 * Validates and sanitizes children before rendering
 */
export function safeChildren(children: React.ReactNode): React.ReactNode {
  if (children === null || children === undefined) {
    return null;
  }
  
  if (React.isValidElement(children)) {
    return children;
  }
  
  if (typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean') {
    return children;
  }
  
  if (Array.isArray(children)) {
    return children.map((child, index) => safeChildren(child)).join('');
  }
  
  // If it's an object, convert to string
  return safeRender(children);
}

/**
 * Higher-order component that wraps children with safety checks
 */
export function withRenderSafety<T extends {}>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function SafeComponent(props: T) {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      console.error('Render Safety: Component rendering failed', error);
      return React.createElement('div', {
        className: 'text-red-500 text-sm p-2 border border-red-200 rounded'
      }, `Rendering Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}