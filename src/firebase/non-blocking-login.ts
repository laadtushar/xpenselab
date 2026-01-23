'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  getAuth
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** Check if running in Capacitor native app */
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform();
}

/** Get redirect URL for OAuth */
function getRedirectUrl(): string {
  if (isNativePlatform()) {
    return 'xpenselab://auth/callback';
  }
  return typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '';
}

/** Initiate Google sign-in (uses external browser in native, popup in web). */
export async function initiateGoogleSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  
  // For native apps, use external browser (Chrome Custom Tabs) to avoid Google's WebView blocking
  if (isNativePlatform()) {
    try {
      // Import Browser plugin dynamically
      const { Browser } = await import('@capacitor/browser');
      
      // Use our web callback URL as the redirect target
      const webCallbackUrl = 'https://xpenselab.com/auth/callback';
      
      // Get the OAuth URL from our API route
      // Always use full URL for native apps since we're in a WebView
      const apiUrl = 'https://xpenselab.com/api/auth/google-url';
      
      console.log('Fetching OAuth URL from:', apiUrl);
      const response = await fetch(`${apiUrl}?redirectUrl=${encodeURIComponent(webCallbackUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OAuth URL: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.url) {
        console.error('API returned invalid data:', data);
        throw new Error('Failed to get OAuth URL from API');
      }
      
      console.log('Opening OAuth URL in external browser:', data.url);
      
      // Open in external browser (Chrome Custom Tabs on Android)
      // This bypasses Google's WebView blocking policy
      await Browser.open({ 
        url: data.url
      });
      
      // The authentication flow:
      // 1. External browser opens Firebase handler URL
      // 2. Firebase redirects to Google OAuth (in external browser - allowed by Google)
      // 3. User authenticates with Google
      // 4. Google redirects back to Firebase handler
      // 5. Firebase processes auth and redirects to webCallbackUrl (https://xpenselab.com/auth/callback)
      // 6. Our callback page processes getRedirectResult() and redirects to custom scheme (xpenselab://auth/callback)
      // 7. App intercepts custom scheme via appUrlOpen listener
      // 8. App calls getRedirectResult() to complete authentication
      
      throw new Error('REDIRECT_INITIATED');
    } catch (error: any) {
      if (error.message === 'REDIRECT_INITIATED') {
        throw error;
      }
      // Fallback: use regular redirect (will likely be blocked by Google in WebView)
      console.warn('Failed to open external browser, falling back to redirect:', error);
      await signInWithRedirect(authInstance, provider);
      throw new Error('REDIRECT_INITIATED');
    }
  }
  
  // Use popup for web
  return signInWithPopup(authInstance, provider);
}

/** Initiate GitHub sign-in (uses external browser in native, popup in web). */
export async function initiateGitHubSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  const provider = new GithubAuthProvider();
  
  // For native apps, use external browser (Chrome Custom Tabs) to avoid potential WebView issues
  if (isNativePlatform()) {
    try {
      // Import Browser plugin dynamically
      const { Browser } = await import('@capacitor/browser');
      
      // Use our web callback URL as the redirect target
      const webCallbackUrl = 'https://xpenselab.com/auth/callback';
      
      // Get the OAuth URL from our API route
      // Always use full URL for native apps since we're in a WebView
      const apiUrl = 'https://xpenselab.com/api/auth/github-url';
      
      console.log('Fetching GitHub OAuth URL from:', apiUrl);
      const response = await fetch(`${apiUrl}?redirectUrl=${encodeURIComponent(webCallbackUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub OAuth URL: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.url) {
        console.error('API returned invalid data:', data);
        throw new Error('Failed to get GitHub OAuth URL from API');
      }
      
      console.log('Opening GitHub OAuth URL in external browser:', data.url);
      
      // Open in external browser (Chrome Custom Tabs on Android)
      await Browser.open({ 
        url: data.url
      });
      
      throw new Error('REDIRECT_INITIATED');
    } catch (error: any) {
      if (error.message === 'REDIRECT_INITIATED') {
        throw error;
      }
      // Fallback: use regular redirect
      console.warn('Failed to open external browser for GitHub, falling back to redirect:', error);
      await signInWithRedirect(authInstance, provider);
      throw new Error('REDIRECT_INITIATED');
    }
  }
  
  // Use popup for web
  return signInWithPopup(authInstance, provider);
}

/** Handle OAuth redirect result (call this on app startup) */
export async function handleOAuthRedirect(authInstance: Auth): Promise<UserCredential | null> {
  try {
    const result = await getRedirectResult(authInstance);
    return result;
  } catch (error: any) {
    console.error('OAuth redirect error:', error);
    return null;
  }
}
