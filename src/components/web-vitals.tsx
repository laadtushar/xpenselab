'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { runUIUXChecks, logUIUXIssues } from '@/lib/ui-ux-monitor';
import { setupGlobalErrorHandlers } from '@/lib/error-monitor';
import { setupNetworkMonitoring } from '@/lib/network-monitor';

/**
 * Web Vitals Component
 * 
 * Automatically tracks Core Web Vitals and UI/UX metrics:
 * - CLS (Cumulative Layout Shift): Detects layout instability
 * - LCP (Largest Contentful Paint): Measures loading performance
 * - INP (Interaction to Next Paint): Measures interactivity
 * - FCP (First Contentful Paint): Initial render time
 * - TTFB (Time to First Byte): Server response time
 * 
 * Also runs custom UI/UX checks:
 * - Touch target sizes
 * - Text overlap detection
 * - Viewport issues
 * - Accessibility violations
 * 
 * These metrics help detect UI/UX issues across all responsive screens.
 */
export function WebVitals() {
  useEffect(() => {
    // Setup global error handlers
    const cleanupErrorHandlers = setupGlobalErrorHandlers();
    
    // Setup network monitoring
    setupNetworkMonitoring();

    // Function to handle metric reporting
    const handleMetric = (metric: Metric) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${emoji} [Web Vitals] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          delta: metric.delta,
        });
      }

      // You can extend this to send to:
      // - Firebase Performance Monitoring
      // - Google Analytics
      // - Your own analytics endpoint
      // - Sentry or other monitoring tools
      
      // Example: Send to Firebase Performance Monitoring (if enabled)
      // if (typeof window !== 'undefined' && (window as any).firebase?.performance) {
      //   const perf = (window as any).firebase.performance();
      //   const trace = perf.trace(metric.name);
      //   trace.setMetric(metric.name, metric.value);
      //   trace.stop();
      // }
    };

    // Track all Core Web Vitals
    onCLS(handleMetric);      // Layout shifts (UI stability)
    onLCP(handleMetric);      // Loading performance
    onINP(handleMetric);      // Interactivity (replaces FID)
    onFCP(handleMetric);      // First contentful paint
    onTTFB(handleMetric);     // Server response time

    // Run custom UI/UX checks only in development (they're expensive)
    // Web Vitals tracking always runs (lightweight)
    let cleanupUIUXChecks: (() => void) | null = null;
    
    if (process.env.NODE_ENV === 'development') {
      const runChecks = () => {
        // Wait a bit for layout to stabilize
        setTimeout(() => {
          const issues = runUIUXChecks();
          logUIUXIssues(issues);
        }, 2000);
      };

      // Run checks on initial load
      if (document.readyState === 'complete') {
        runChecks();
      } else {
        window.addEventListener('load', runChecks);
      }

      // Run checks on resize (responsive issues)
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const issues = runUIUXChecks();
          logUIUXIssues(issues);
        }, 500);
      };
      window.addEventListener('resize', handleResize);

      cleanupUIUXChecks = () => {
        window.removeEventListener('load', runChecks);
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }

    // Cleanup function
    return () => {
      cleanupUIUXChecks?.();
      cleanupErrorHandlers();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
