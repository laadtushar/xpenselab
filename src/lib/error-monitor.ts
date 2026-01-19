/**
 * Global Error Monitor
 * 
 * Catches and logs unhandled JavaScript errors, promise rejections,
 * and other runtime errors that could affect UI/UX.
 */

interface ErrorReport {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Sanitizes URL to remove sensitive data
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    // Remove sensitive query parameters
    const sensitiveParams = ['token', 'apiKey', 'apikey', 'auth', 'password', 'secret', 'key'];
    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    // Return pathname only (no origin or query params for privacy)
    return urlObj.pathname;
  } catch {
    return '/[sanitized]';
  }
}

/**
 * Logs error reports (can be extended to send to monitoring service)
 * Production-safe: Sanitizes URLs and only logs in development
 */
function logErrorReport(report: ErrorReport): void {
  // Sanitize URL before logging
  const sanitizedReport = {
    ...report,
    url: sanitizeUrl(report.url),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Global Error:', sanitizedReport);
  }

  // In production, send to error tracking service (Firebase Crashlytics, Sentry, etc.)
  // Example:
  // if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
  //   (window as any).firebase.crashlytics().log(sanitizedReport.message);
  //   (window as any).firebase.crashlytics().recordError(sanitizedReport.error || new Error(sanitizedReport.message));
  // }
}

/**
 * Sets up global error handlers
 * Can be disabled via NEXT_PUBLIC_DISABLE_MONITORING env var
 */
export function setupGlobalErrorHandlers(): () => void {
  // Allow disabling monitoring via environment variable
  if (process.env.NEXT_PUBLIC_DISABLE_MONITORING === 'true') {
    return () => {}; // Return no-op cleanup function
  }
  // Handle unhandled JavaScript errors
  const handleError = (event: ErrorEvent) => {
    const report: ErrorReport = {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    logErrorReport(report);
  };

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const report: ErrorReport = {
      message: `Unhandled Promise Rejection: ${event.reason?.toString() || 'Unknown'}`,
      error: event.reason instanceof Error ? event.reason : undefined,
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    logErrorReport(report);
  };

  // Handle resource loading errors (images, scripts, etc.)
  const handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const report: ErrorReport = {
        message: `Resource loading error: ${target.tagName}`,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
      logErrorReport(report);
    }
  };

  // Attach handlers
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleResourceError, true); // Use capture phase

  // Return cleanup function
  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleResourceError, true);
  };
}
