'use client';

import { useEffect, useState, useCallback } from 'react';

interface WebViewErrorState {
  hasError: boolean;
  error: string | null;
  isOffline: boolean;
}

/**
 * Hook to detect WebView/network errors and offline state
 * This is specifically for Capacitor WebView apps
 */
export function useWebViewError(): [WebViewErrorState, () => void] {
  const [state, setState] = useState<WebViewErrorState>({
    hasError: false,
    error: null,
    isOffline: false,
  });

  const checkConnection = useCallback(async () => {
    const online = navigator.onLine;
    setState(prev => ({ ...prev, isOffline: !online }));

    // If offline, mark as error
    if (!online) {
      setState(prev => ({
        ...prev,
        hasError: true,
        error: 'No internet connection',
        isOffline: true,
      }));
      return;
    }

    // Try to fetch a lightweight endpoint to check connectivity
    // Use the root path to avoid redirects
    try {
      const testUrl = window.location.origin;
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok && response.status >= 500) {
        setState(prev => ({
          ...prev,
          hasError: true,
          error: `Server error (${response.status})`,
          isOffline: false,
        }));
      } else {
        // Connection is good, clear errors
        setState({
          hasError: false,
          error: null,
          isOffline: false,
        });
      }
    } catch (error) {
      // Network error - likely offline or connection issue
      const isOffline = !navigator.onLine;
      setState(prev => ({
        ...prev,
        hasError: true,
        error: isOffline 
          ? 'No internet connection' 
          : (error instanceof Error ? error.message : 'Connection failed'),
        isOffline,
      }));
    }
  }, []);

  const retry = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      isOffline: false,
    });
    // Reload the page
    window.location.reload();
  }, []);

  useEffect(() => {
    // Don't check connection immediately - wait a bit to let page load
    // Only check if we're already offline
    if (!navigator.onLine) {
      setState({
        hasError: true,
        error: 'No internet connection',
        isOffline: true,
      });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      // Re-check connection when coming back online
      setTimeout(checkConnection, 500);
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        hasError: true,
        error: 'No internet connection',
        isOffline: true,
      }));
    };

    // Listen for page errors
    const handleError = (event: ErrorEvent) => {
      // Only catch network/loading errors, not JavaScript errors
      if (event.message && (
        event.message.includes('Failed to fetch') ||
        event.message.includes('NetworkError') ||
        event.message.includes('Load failed') ||
        event.message.includes('net::ERR_')
      )) {
        setState(prev => ({
          ...prev,
          hasError: true,
          error: 'Failed to load page',
          isOffline: !navigator.onLine,
        }));
      }
    };

    // Listen for unhandled promise rejections (often network errors)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason instanceof TypeError &&
        (reason.message.includes('Failed to fetch') ||
         reason.message.includes('NetworkError') ||
         reason.message.includes('Load failed'))
      ) {
        setState(prev => ({
          ...prev,
          hasError: true,
          error: 'Network request failed',
          isOffline: !navigator.onLine,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Periodic connection check (every 60 seconds) - less aggressive
    // Only check if we think we're offline
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        checkConnection();
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return [state, retry];
}
