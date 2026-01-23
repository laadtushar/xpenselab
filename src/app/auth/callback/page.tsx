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
        // For native apps, we need to process the redirect result here (in external browser)
        // and pass the OAuth credential to the app via custom scheme
        if (Capacitor.isNativePlatform()) {
          try {
            // Call getRedirectResult in the external browser where sessionStorage is available
            const result = await getRedirectResult(auth);
            
            if (result && result.credential) {
              // Extract credential info to pass to the app
              // OAuthCredential has accessToken and idToken properties
              const credential = result.credential as any;
              const accessToken = credential.accessToken || credential.oauthAccessToken;
              const idToken = credential.idToken || credential.oauthIdToken;
              const providerId = result.providerId || 'google.com';
              
              if (accessToken && idToken) {
                // Redirect to custom scheme with credential info
                // The app will reconstruct the credential and sign in
                const params = new URLSearchParams({
                  success: 'true',
                  accessToken: accessToken,
                  idToken: idToken,
                  providerId: providerId
                });
                window.location.href = `xpenselab://auth/callback?${params.toString()}`;
              } else {
                console.warn('Credential missing accessToken or idToken');
                window.location.href = 'xpenselab://auth/callback?success=false&error=missing_credential';
              }
            } else {
              // No redirect result
              window.location.href = 'xpenselab://auth/callback?success=false&error=auth_failed';
            }
          } catch (error: any) {
            console.error('Auth callback error in external browser:', error);
            window.location.href = 'xpenselab://auth/callback?success=false&error=' + encodeURIComponent(error.message || 'unknown');
          }
          return;
        }
        
        // For web, process the redirect result here
        const result = await getRedirectResult(auth);
        
        if (result) {
          // Authentication successful - redirect to dashboard
          router.push('/dashboard');
        } else {
          // No redirect result - might be an error or user cancelled
          router.push('/login?error=auth_failed');
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
