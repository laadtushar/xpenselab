'use client';

import { useEffect, useState } from 'react';
import { useWebViewError } from '@/hooks/use-webview-error';
import { OfflineErrorPage } from '@/components/offline-error-page';
import { Capacitor } from '@capacitor/core';

interface WebViewErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Component that handles WebView errors and offline states
 * Only active in Capacitor native apps (Android/iOS)
 */
export function WebViewErrorHandler({ children }: WebViewErrorHandlerProps) {
  const [errorState, retry] = useWebViewError();
  const [isNative, setIsNative] = useState(false);
  const [pageLoadError, setPageLoadError] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor native app
    if (typeof window !== 'undefined') {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
    }
  }, []);

  useEffect(() => {
    // Only listen for errors after a delay to avoid false positives during initial load
    const timeout = setTimeout(() => {
      // Listen for page load errors (specifically for WebView)
      const handleError = (event: ErrorEvent) => {
        // Check for WebView-specific errors, but be more specific
        if (
          event.message &&
          (event.message.includes('net::ERR_TIMED_OUT') ||
           event.message.includes('net::ERR_CONNECTION_REFUSED') ||
           event.message.includes('net::ERR_NAME_NOT_RESOLVED') ||
           event.message.includes('Failed to fetch') && event.message.includes('timeout'))
        ) {
          setPageLoadError(true);
        }
      };

      // Listen for failed resource loads (but only critical ones)
      const handleResourceError = (event: Event) => {
        const target = event.target as HTMLElement;
        // Only care about critical resources that would break the app
        if (target instanceof HTMLScriptElement && target.src) {
          // Check if it's a Next.js chunk or critical script
          if (target.src.includes('/_next/') || target.src.includes('runtime')) {
            setPageLoadError(true);
          }
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('error', handleResourceError, true); // Use capture phase

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('error', handleResourceError, true);
      };
    }, 5000); // Wait 5 seconds before enabling error detection

    return () => clearTimeout(timeout);
  }, []);

  // Only show error page in native apps when there's an error
  if (isNative && (errorState.hasError || pageLoadError)) {
    return (
      <OfflineErrorPage
        onRetry={() => {
          setPageLoadError(false);
          retry();
        }}
        error={errorState.error || undefined}
      />
    );
  }

  return <>{children}</>;
}
