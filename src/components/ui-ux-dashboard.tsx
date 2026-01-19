'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Activity, Wifi, WifiOff } from 'lucide-react';
import { runUIUXChecks, type UIUXIssue } from '@/lib/ui-ux-monitor';
import { networkMonitor } from '@/lib/network-monitor';

/**
 * UI/UX Dashboard Component
 * 
 * Displays a floating dashboard in development mode showing:
 * - Web Vitals metrics
 * - UI/UX issues
 * - Network request status
 * - Error counts
 */
export function UIUXDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<UIUXIssue[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState(networkMonitor.getMetrics());

  useEffect(() => {
    if (!isOpen || process.env.NODE_ENV !== 'development') return;

    // Refresh issues and metrics periodically
    const interval = setInterval(() => {
      setIssues(runUIUXChecks());
      setNetworkMetrics(networkMonitor.getMetrics());
    }, 2000);

    // Initial load
    setIssues(runUIUXChecks());
    setNetworkMetrics(networkMonitor.getMetrics());

    return () => clearInterval(interval);
  }, [isOpen]);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const highSeverityCount = issues.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;
  const lowSeverityCount = issues.filter(i => i.severity === 'low').length;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
        title="Toggle UI/UX Dashboard"
      >
        <Activity className="h-4 w-4" />
        {highSeverityCount > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
            {highSeverityCount}
          </span>
        )}
      </button>

      {/* Dashboard Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold">UI/UX Monitor</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Network Status */}
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2">
                {networkMetrics.failedRequests > 0 ? (
                  <WifiOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                <h3 className="font-semibold">Network</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span className="font-mono">{networkMetrics.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className={`font-mono ${networkMetrics.failedRequests > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {networkMetrics.failedRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slow (&gt;3s):</span>
                  <span className={`font-mono ${networkMetrics.slowRequests > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {networkMetrics.slowRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response:</span>
                  <span className="font-mono">{Math.round(networkMetrics.averageResponseTime)}ms</span>
                </div>
              </div>
            </div>

            {/* Issues Summary */}
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold">Issues</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">High:</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">
                    {highSeverityCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">Medium:</span>
                  <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">
                    {mediumSeverityCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Low:</span>
                  <span className="font-mono font-bold text-green-600 dark:text-green-400">
                    {lowSeverityCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {issues.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <h3 className="mb-2 font-semibold">Issue Details</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`rounded border-l-4 p-2 text-xs ${
                        issue.severity === 'high'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950'
                          : issue.severity === 'medium'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                          : 'border-green-500 bg-green-50 dark:bg-green-950'
                      }`}
                    >
                      <div className="font-semibold">{issue.type}</div>
                      <div className="text-gray-600 dark:text-gray-400">{issue.message}</div>
                      {issue.element && (
                        <button
                          onClick={() => {
                            issue.element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            issue.element?.style.outline = '2px solid red';
                            setTimeout(() => {
                              issue.element?.style.outline = '';
                            }, 3000);
                          }}
                          className="mt-1 text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Highlight Element
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {issues.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  No UI/UX issues detected!
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
