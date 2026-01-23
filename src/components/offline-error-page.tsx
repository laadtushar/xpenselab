'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OfflineErrorPageProps {
  onRetry: () => void;
  error?: string;
}

export function OfflineErrorPage({ onRetry, error }: OfflineErrorPageProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Wait a bit to show the retry animation
      await new Promise(resolve => setTimeout(resolve, 500));
      onRetry();
    } finally {
      // Reset retry state after a delay
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101622] p-4">
      <Card className="w-full max-w-md border-border/40 bg-background/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {!isOnline ? (
              <WifiOff className="h-16 w-16 text-muted-foreground" />
            ) : (
              <AlertCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <div className="space-y-2">
            <Logo variant="stacked" showText={true} className="mx-auto" />
            <CardTitle className="text-2xl">
              {!isOnline ? 'No Internet Connection' : 'Unable to Load Page'}
            </CardTitle>
            <CardDescription className="text-base">
              {!isOnline
                ? 'Please check your internet connection and try again.'
                : error || 'The page could not be loaded. Please try again.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            {!isOnline ? (
              <p>Make sure you're connected to Wi‑Fi or mobile data.</p>
            ) : (
              <p>This could be due to a network issue or server problem.</p>
            )}
          </div>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
            size="lg"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
          {!isOnline && (
            <p className="text-center text-xs text-muted-foreground">
              Waiting for connection...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
