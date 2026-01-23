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
    // Listen for page load errors (specifically for WebView)
    const handleError = (event: ErrorEvent) => {
      // Check for WebView-specific errors
      if (
        event.message?.includes('net::ERR_') ||
        event.message?.includes('Failed to load') ||
        event.message?.includes('NetworkError') ||
        event.message?.includes('Load failed')
      ) {
        setPageLoadError(true);
      }
    };

    // Listen for failed resource loads
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        (target instanceof HTMLImageElement || target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) &&
        !target.src?.includes('data:') // Ignore data URIs
      ) {
        // Check if it's a critical resource
        if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) {
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
