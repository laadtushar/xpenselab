/**
 * Capacitor-specific authentication handling for OAuth redirects
 */

import { Capacitor } from '@capacitor/core';
import { Auth, getRedirectResult } from 'firebase/auth';

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
          // Wait a bit for Firebase to process the redirect
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Get the redirect result from Firebase
          const result = await getRedirectResult(auth);
          if (result) {
            console.log('OAuth redirect successful:', result.user.email);
            if (onAuthSuccess) {
              onAuthSuccess();
            }
          } else {
            console.warn('No redirect result found, but callback indicated success');
            // Try again after a longer delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryResult = await getRedirectResult(auth);
            if (retryResult && onAuthSuccess) {
              onAuthSuccess();
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
