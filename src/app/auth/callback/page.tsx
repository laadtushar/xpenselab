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
              
              // Use window.location.replace to ensure redirect happens
              window.location.replace(`xpenselab://auth/callback?${params.toString()}`);
              
              // Try to close the browser after redirect (may not work in all browsers)
              setTimeout(() => {
                try {
                  if (window.opener) {
                    window.close();
                  }
                } catch (e) {
                  // Ignore - browser may not allow closing
                }
              }, 500);
              
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
                window.location.replace(`xpenselab://auth/callback?${params.toString()}`);
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
