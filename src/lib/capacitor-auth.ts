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
    
    // Check if this is an OAuth callback
    if (event.url.includes('auth/callback') || event.url.includes('xpenselab://') || event.url.includes('__/auth/handler')) {
      try {
        // Wait a bit for Firebase to process the redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('OAuth redirect successful:', result.user.email);
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      } catch (error: any) {
        console.error('OAuth redirect error:', error);
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
