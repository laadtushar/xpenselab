'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { getRedirectResult } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page
 * This page handles OAuth redirects from external browsers
 * For native apps, it redirects to the custom scheme after processing auth
 */
export default function AuthCallbackPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;

    const processAuth = async () => {
      try {
        // Get the redirect result from Firebase
        const result = await getRedirectResult(auth);
        
        if (result) {
          // Authentication successful
          if (Capacitor.isNativePlatform()) {
            // For native apps, redirect to custom scheme to return to app
            // The app will intercept this and process the auth result
            window.location.href = 'xpenselab://auth/callback?success=true';
          } else {
            // For web, redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          // No redirect result - might be an error or user cancelled
          if (Capacitor.isNativePlatform()) {
            window.location.href = 'xpenselab://auth/callback?success=false';
          } else {
            router.push('/login?error=auth_failed');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        if (Capacitor.isNativePlatform()) {
          window.location.href = 'xpenselab://auth/callback?success=false&error=' + encodeURIComponent(error.message || 'unknown');
        } else {
          router.push('/login?error=' + encodeURIComponent(error.message || 'auth_failed'));
        }
      }
    };

    processAuth();
  }, [auth, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          {Capacitor.isNativePlatform() 
            ? 'Completing sign-in...' 
            : 'Processing authentication...'}
        </p>
      </div>
    </div>
  );
}
