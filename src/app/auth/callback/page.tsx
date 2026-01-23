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
        // Check if we're in an external browser (not the app's WebView)
        // If Capacitor is not available or we're not in native platform, we're in external browser
        const isExternalBrowser = !Capacitor.isNativePlatform() || typeof (window as any).Capacitor === 'undefined';
        
        // Always process redirect result first (it's available in external browser's sessionStorage)
        const result = await getRedirectResult(auth);
        
        if (result && result.credential) {
          // Extract credential info to pass to the app
          const credential = result.credential as any;
          const accessToken = credential.accessToken || credential.oauthAccessToken;
          const idToken = credential.idToken || credential.oauthIdToken;
          const providerId = result.providerId || 'google.com';
          
          if (accessToken && idToken) {
            // If we're in external browser, redirect to custom scheme to return to app
            if (isExternalBrowser) {
              const params = new URLSearchParams({
                success: 'true',
                accessToken: accessToken,
                idToken: idToken,
                providerId: providerId
              });
              // Use window.location.replace to ensure redirect happens
              window.location.replace(`xpenselab://auth/callback?${params.toString()}`);
              return;
            } else {
              // We're in the app's WebView, just redirect to dashboard
              router.push('/dashboard');
              return;
            }
          } else {
            console.warn('Credential missing accessToken or idToken');
            if (isExternalBrowser) {
              window.location.replace('xpenselab://auth/callback?success=false&error=missing_credential');
            } else {
              router.push('/login?error=missing_credential');
            }
            return;
          }
        } else {
          // No redirect result
          if (isExternalBrowser) {
            window.location.replace('xpenselab://auth/callback?success=false&error=auth_failed');
          } else {
            router.push('/login?error=auth_failed');
          }
          return;
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        const isExternalBrowser = !Capacitor.isNativePlatform() || typeof (window as any).Capacitor === 'undefined';
        if (isExternalBrowser) {
          window.location.replace('xpenselab://auth/callback?success=false&error=' + encodeURIComponent(error.message || 'unknown'));
        } else {
          router.push('/login?error=' + encodeURIComponent(error.message || 'auth_failed'));
        }
      }
    };

    processAuth();
  }, [auth, router]);

  // Fallback: if we're still here after 5 seconds, try to redirect anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      const isExternalBrowser = !Capacitor.isNativePlatform() || typeof (window as any).Capacitor === 'undefined';
      if (isExternalBrowser) {
        console.warn('Callback page timeout - redirecting to app anyway');
        window.location.replace('xpenselab://auth/callback?success=false&error=timeout');
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          Completing sign-in...
        </p>
        <p className="text-xs text-muted-foreground">
          You will be redirected back to the app shortly...
        </p>
      </div>
    </div>
  );
}
