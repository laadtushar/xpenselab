'use client';

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * This helps detect UI/UX issues caused by runtime errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error | unknown): ErrorBoundaryState {
    // Ensure we always have an Error object
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'An unknown error occurred');
    
    return {
      hasError: true,
      error: errorObj,
    };
  }

  componentDidCatch(error: Error | unknown, errorInfo: React.ErrorInfo) {
    // Handle empty/null/undefined errors
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      const emptyError = new Error('An unknown error occurred (empty error object)');
      emptyError.name = 'EmptyError';
      
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Error Boundary caught an empty error object');
        console.error('Error info:', errorInfo);
      }
      
      if (this.props.onError) {
        this.props.onError(emptyError, errorInfo);
      }
      return;
    }
    
    // Ensure we always have an Error object
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : JSON.stringify(error) || 'An unknown error occurred');
    
    // Extract error properties for better logging
    const errorDetails = {
      name: errorObj.name || 'Unknown Error',
      message: errorObj.message || 'No error message',
      stack: errorObj.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      originalError: error, // Keep reference to original error
    };

    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Boundary caught an error:', errorDetails);
      // Also log the raw error object for debugging
      console.error('Raw error object:', error);
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(errorObj, errorInfo);
    }

    // In production, send to error tracking service (Firebase Crashlytics, Sentry, etc.)
    // Example:
    // if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
    //   (window as any).firebase.crashlytics().recordError(errorObj);
    // }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
            <h2 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-200">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-red-600 dark:text-red-300">
              {process.env.NODE_ENV === 'development' 
                ? (this.state.error?.message || 'An unexpected error occurred')
                : 'We apologize for the inconvenience. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
