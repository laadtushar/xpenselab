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
          // Use toJSON() to get serializable credential data
          // This is safer than accessing properties directly
          const credential = result.credential;
          const providerId = result.providerId || 'google.com';
          
          try {
            // Serialize credential to JSON and base64 encode to avoid URL length issues
            const credentialJson = credential.toJSON();
            const encodedCredential = btoa(JSON.stringify(credentialJson));
            
            // If we're in external browser, redirect to custom scheme to return to app
            if (isExternalBrowser) {
              const params = new URLSearchParams({
                success: 'true',
                credential: encodedCredential,
                providerId: providerId
              });
              
              const redirectUrl = `xpenselab://auth/callback?${params.toString()}`;
              console.log('[Callback] Redirecting to app with URL:', redirectUrl.substring(0, 150) + '...');
              console.log('[Callback] Current location:', window.location.href);
              
              // Use window.location.href immediately (don't wait for Browser.close)
              // Some Android browsers need the redirect to happen immediately
              window.location.href = redirectUrl;
              
              // Also try to close Capacitor Browser (but don't wait for it)
              // Closing after redirect is better than before
              setTimeout(async () => {
                try {
                  const { Browser } = await import('@capacitor/browser');
                  await Browser.close();
                  console.log('[Callback] Browser closed after redirect');
                } catch (e) {
                  console.log('[Callback] Could not close browser:', e);
                }
              }, 500);
              
              // Fallback: if still on callback page after 2 seconds, try replace
              setTimeout(() => {
                if (window.location.href.includes('/auth/callback')) {
                  console.log('[Callback] Fallback: still on callback page, trying replace');
                  window.location.replace(redirectUrl);
                }
              }, 2000);
              
              return;
            } else {
              // We're in the app's WebView, just redirect to dashboard
              router.push('/dashboard');
              return;
            }
          } catch (encodeError: any) {
            console.error('Failed to encode credential:', encodeError);
            // Fallback: try direct property access (less reliable)
            const credentialAny = credential as any;
            const accessToken = credentialAny.accessToken || credentialAny.oauthAccessToken;
            const idToken = credentialAny.idToken || credentialAny.oauthIdToken;
            
            if (accessToken && idToken) {
              if (isExternalBrowser) {
                const params = new URLSearchParams({
                  success: 'true',
                  accessToken: accessToken.substring(0, 500), // Truncate to avoid URL limits
                  idToken: idToken.substring(0, 500),
                  providerId: providerId
                });
                const redirectUrl = `xpenselab://auth/callback?${params.toString()}`;
                console.log('Fallback redirect to app:', redirectUrl.substring(0, 100) + '...');
                
                // Try to close Capacitor Browser first
                try {
                  const { Browser } = await import('@capacitor/browser');
                  await Browser.close();
                } catch (e) {
                  // Ignore
                }
                
                window.location.href = redirectUrl;
                setTimeout(() => {
                  if (window.location.href.includes('xpenselab.com')) {
                    window.location.replace(redirectUrl);
                  }
                }, 1000);
                return;
              }
            }
            
            console.warn('Credential encoding failed and fallback also failed');
            if (isExternalBrowser) {
              window.location.replace('xpenselab://auth/callback?success=false&error=credential_encode_failed');
            } else {
              router.push('/login?error=credential_encode_failed');
            }
            return;
          }
        } else {
          // No redirect result
          if (isExternalBrowser) {
            console.warn('No redirect result found, redirecting to app with error');
            const redirectUrl = 'xpenselab://auth/callback?success=false&error=auth_failed';
            try {
              const { Browser } = await import('@capacitor/browser');
              await Browser.close();
            } catch (e) {
              // Ignore
            }
            window.location.href = redirectUrl;
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
    const timeout = setTimeout(async () => {
      const isExternalBrowser = !Capacitor.isNativePlatform() || typeof (window as any).Capacitor === 'undefined';
      if (isExternalBrowser) {
        console.warn('Callback page timeout - redirecting to app anyway');
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch (e) {
          // Ignore
        }
        window.location.href = 'xpenselab://auth/callback?success=false&error=timeout';
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
