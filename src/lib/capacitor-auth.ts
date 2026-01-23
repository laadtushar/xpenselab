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
    console.log('App opened with URL:', event.url);
    
    // Check if this is an OAuth callback from external browser
    if (event.url.includes('auth/callback') || event.url.includes('xpenselab://')) {
      try {
        // Parse URL to check for success/error
        const url = new URL(event.url);
        const success = url.searchParams.get('success') === 'true';
        
        if (success) {
          // Check if we have credential info from the callback page
          const accessToken = url.searchParams.get('accessToken');
          const idToken = url.searchParams.get('idToken');
          const providerId = url.searchParams.get('providerId') || 'google.com';
          
          if (accessToken && idToken) {
            // Reconstruct the OAuth credential and sign in
            try {
              const provider = providerId === 'github.com' 
                ? new OAuthProvider('github.com')
                : new OAuthProvider('google.com');
              
              const credential = provider.credential({
                idToken: idToken,
                accessToken: accessToken
              });
              
              const userCredential = await signInWithCredential(auth, credential);
              console.log('OAuth redirect successful via credential:', userCredential.user.email);
              if (onAuthSuccess) {
                onAuthSuccess();
              }
            } catch (credError: any) {
              console.error('Failed to sign in with credential:', credError);
              // Fallback: try getRedirectResult (might work if sessionStorage was shared)
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
