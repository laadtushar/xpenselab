/**
 * Network Request Monitor
 * 
 * Tracks network requests to detect:
 * - Slow API calls
 * - Failed requests
 * - Network connectivity issues
 * - Timeout errors
 * 
 * Production-safe: Sanitizes URLs to remove sensitive data
 */

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * Sanitizes URLs to remove sensitive query parameters and tokens
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    // Remove sensitive query parameters
    const sensitiveParams = ['token', 'apiKey', 'apikey', 'auth', 'password', 'secret', 'key'];
    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    // Return pathname + search (without origin for privacy)
    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, return a safe placeholder
    return '/[sanitized]';
  }
}

interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  slowRequests: number; // > 3 seconds
  averageResponseTime: number;
  requests: NetworkRequest[];
}

class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  private readonly maxRequests = 100; // Keep last 100 requests
  private readonly slowThreshold = 3000; // 3 seconds

  /**
   * Logs a network request (sanitizes URL for production safety)
   */
  logRequest(request: NetworkRequest): void {
    // Sanitize URL to remove sensitive data
    const sanitizedRequest = {
      ...request,
      url: sanitizeUrl(request.url),
    };

    this.requests.push(sanitizedRequest);
    
    // Keep only last N requests
    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }

    // Log slow or failed requests in development only
    if (process.env.NODE_ENV === 'development') {
      if (!sanitizedRequest.success) {
        console.warn('⚠️ Network Request Failed:', sanitizedRequest);
      } else if (sanitizedRequest.duration > this.slowThreshold) {
        console.warn('🐌 Slow Network Request:', sanitizedRequest);
      }
    }
  }

  /**
   * Gets current network metrics
   */
  getMetrics(): NetworkMetrics {
    const successfulRequests = this.requests.filter(r => r.success);
    const failedRequests = this.requests.filter(r => !r.success);
    const slowRequests = this.requests.filter(r => r.success && r.duration > this.slowThreshold);
    
    const averageResponseTime = successfulRequests.length > 0
      ? successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length
      : 0;

    return {
      totalRequests: this.requests.length,
      failedRequests: failedRequests.length,
      slowRequests: slowRequests.length,
      averageResponseTime,
      requests: [...this.requests].reverse(), // Most recent first
    };
  }

  /**
   * Clears all stored requests
   */
  clear(): void {
    this.requests = [];
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

/**
 * Monitors fetch requests
 */
export function monitorFetch(): void {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = typeof args[1] === 'object' && args[1]?.method ? args[1].method : 'GET';
    const startTime = performance.now();

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;

      networkMonitor.logRequest({
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        duration,
        timestamp: new Date().toISOString(),
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      networkMonitor.logRequest({
        url,
        method,
        duration,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
}

/**
 * Monitors XMLHttpRequest (for libraries that use it)
 */
export function monitorXHR(): void {
  // Don't monitor in production if disabled via env var
  if (process.env.NEXT_PUBLIC_DISABLE_MONITORING === 'true') {
    return;
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any).__monitoredUrl = url.toString();
    (this as any).__monitoredMethod = method;
    (this as any).__monitoredStartTime = performance.now();
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args: any[]) {
    this.addEventListener('loadend', function () {
      const duration = performance.now() - (this as any).__monitoredStartTime;
      networkMonitor.logRequest({
        url: (this as any).__monitoredUrl,
        method: (this as any).__monitoredMethod,
        status: this.status,
        statusText: this.statusText,
        duration,
        timestamp: new Date().toISOString(),
        success: this.status >= 200 && this.status < 400,
        error: this.status >= 400 ? `HTTP ${this.status}` : undefined,
      });
    });

    return originalSend.call(this, ...args);
  };
}

/**
 * Sets up network monitoring
 */
export function setupNetworkMonitoring(): void {
  monitorFetch();
  monitorXHR();
}
