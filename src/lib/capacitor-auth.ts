/**
 * Capacitor-specific authentication handling for OAuth redirects
 */

import { Capacitor } from '@capacitor/core';
import { Auth, getRedirectResult, OAuthProvider, signInWithCredential } from 'firebase/auth';

let isListenerAdded = false;

/**
 * Initialize Capacitor app URL listener for OAuth redirects
 * Call this once when the app starts
 */
export async function initializeCapacitorAuth(auth: Auth, onAuthSuccess?: () => void) {
  if (!Capacitor.isNativePlatform() || isListenerAdded) {
    return;
  }

  isListenerAdded = true;

  // Dynamically import App plugin only in native platform
  const { App } = await import('@capacitor/app');

  // Handle app opening from OAuth redirect (custom scheme)
  App.addListener('appUrlOpen', async (event) => {
    console.log('[Capacitor Auth] App opened with URL:', event.url);
    
    // Check if this is an OAuth callback from external browser
    if (event.url.includes('auth/callback') || event.url.includes('xpenselab://')) {
      console.log('[Capacitor Auth] Detected OAuth callback URL');
      try {
        // Parse URL to check for success/error
        let url: URL;
        try {
          url = new URL(event.url);
        } catch (urlError) {
          // If URL parsing fails, try to construct it manually
          console.error('[Capacitor Auth] Failed to parse URL, trying manual construction:', urlError);
          // Extract query string if present
          const queryIndex = event.url.indexOf('?');
          if (queryIndex > 0) {
            const base = event.url.substring(0, queryIndex);
            const query = event.url.substring(queryIndex);
            url = new URL(query, base);
          } else {
            url = new URL(event.url);
          }
        }
        
        const success = url.searchParams.get('success') === 'true';
        console.log('[Capacitor Auth] Success flag:', success);
        
        if (success) {
          // Check if we have encoded credential (preferred method)
          const encodedCredential = url.searchParams.get('credential');
          const providerId = url.searchParams.get('providerId') || 'google.com';
          
          if (encodedCredential) {
            // Reconstruct credential from JSON (preferred method)
            try {
              const credentialJson = JSON.parse(atob(encodedCredential));
              const provider = providerId === 'github.com' 
                ? new OAuthProvider('github.com')
                : new OAuthProvider('google.com');
              
              // Use credentialFromJSON if available, otherwise construct manually
              let credential;
              if (typeof provider.credentialFromJSON === 'function') {
                credential = provider.credentialFromJSON(credentialJson);
              } else {
                // Fallback: construct credential manually
                credential = provider.credential({
                  idToken: credentialJson.idToken,
                  accessToken: credentialJson.accessToken
                });
              }
              
              const userCredential = await signInWithCredential(auth, credential);
              console.log('[Capacitor Auth] OAuth redirect successful via credential:', userCredential.user.email);
              if (onAuthSuccess) {
                console.log('[Capacitor Auth] Calling onAuthSuccess callback');
                onAuthSuccess();
              }
            } catch (credError: any) {
              console.error('Failed to sign in with credential:', credError);
              // Fallback: try getRedirectResult
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const result = await getRedirectResult(auth);
                if (result && onAuthSuccess) {
                  onAuthSuccess();
                }
              } catch (fallbackError) {
                console.error('Fallback getRedirectResult also failed:', fallbackError);
              }
            }
          } else {
            // Fallback: try old method with accessToken/idToken (for backwards compatibility)
            const accessToken = url.searchParams.get('accessToken');
            const idToken = url.searchParams.get('idToken');
            
            if (accessToken && idToken) {
              try {
                const provider = providerId === 'github.com' 
                  ? new OAuthProvider('github.com')
                  : new OAuthProvider('google.com');
                
                const credential = provider.credential({
                  idToken: idToken,
                  accessToken: accessToken
                });
                
                const userCredential = await signInWithCredential(auth, credential);
                console.log('OAuth redirect successful via credential (fallback):', userCredential.user.email);
                if (onAuthSuccess) {
                  onAuthSuccess();
                }
              } catch (credError: any) {
                console.error('Failed to sign in with credential (fallback):', credError);
              }
            } else {
              // No credential info, try getRedirectResult (might work if sessionStorage was shared)
              await new Promise(resolve => setTimeout(resolve, 1000));
              const result = await getRedirectResult(auth);
              if (result) {
                console.log('OAuth redirect successful:', result.user.email);
                if (onAuthSuccess) {
                  onAuthSuccess();
                }
              } else {
                console.warn('No redirect result found and no credential info provided');
              }
            }
          }
        } else {
          const error = url.searchParams.get('error');
          console.error('OAuth callback indicated failure:', error);
        }
      } catch (error: any) {
        console.error('OAuth redirect error:', error);
        // Try to get redirect result anyway
        try {
          const result = await getRedirectResult(auth);
          if (result && onAuthSuccess) {
            onAuthSuccess();
          }
        } catch (retryError) {
          console.error('Failed to get redirect result:', retryError);
        }
      }
    }
  });

  // Check for redirect result on app startup (handles web URL redirects)
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('OAuth redirect result on startup:', result.user.email);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    }
  } catch (error: any) {
    // No redirect result, that's fine
    console.log('No OAuth redirect on startup');
  }
}
