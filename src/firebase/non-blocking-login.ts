'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithCredential,
  UserCredential,
  getAuth
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

// Debug logging utility (can be disabled in production)
const DEBUG = process.env.NODE_ENV === 'development';
const authLog = (...args: any[]) => {
  if (DEBUG) console.log('[Auth]', ...args);
};
const authError = (...args: any[]) => {
  console.error('[Auth]', ...args); // Always log errors
};
const authWarn = (...args: any[]) => {
  if (DEBUG) console.warn('[Auth]', ...args);
};

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
  const capacitor = (window as any).Capacitor;
  const isNative = capacitor?.isNativePlatform?.() ?? false;
  authLog('Platform check:', {
    hasCapacitor: !!capacitor,
    isNative,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
  });
  return isNative;
}

// Removed getRedirectUrl() - not needed with native plugin

/** Initiate Google sign-in (uses native plugin in mobile, popup in web). */
export async function initiateGoogleSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  // For native apps, use @capacitor-firebase/authentication plugin (best practice)
  if (isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      
      authLog('Using native Firebase Authentication plugin for Google sign-in');
      authLog('Calling FirebaseAuthentication.signInWithGoogle()...');
      
      // Use native plugin - this handles OAuth flow natively
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      authLog('Native plugin returned result:', {
        hasCredential: !!result.credential,
        hasIdToken: !!result.credential?.idToken,
        hasAccessToken: !!result.credential?.accessToken,
        userEmail: result.user?.email
      });
      
      if (!result.credential?.idToken) {
        throw new Error('No ID token received from native authentication');
      }
      
      authLog('Creating Firebase credential from idToken...');
      // Create credential from native result and sign in with Firebase Web SDK
      // Use static method GoogleAuthProvider.credential()
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      
      if (!credential) {
        throw new Error('Failed to create credential from native authentication result');
      }
      
      authLog('Signing in with credential...');
      // Sign in with the credential
      const userCredential = await signInWithCredential(authInstance, credential);
      authLog('✅ Sign-in successful! User:', userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      authError('Native Google sign-in failed:', error);
      if (DEBUG) {
        authError('Error details:', {
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack?.substring(0, 500)
        });
      }
      // Fallback to web popup if native fails
      authWarn('Falling back to web popup');
      const provider = new GoogleAuthProvider();
      return signInWithPopup(authInstance, provider);
    }
  }
  
  // Use popup for web
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}

/** Initiate GitHub sign-in (uses native plugin in mobile, popup in web). */
export async function initiateGitHubSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  // For native apps, use @capacitor-firebase/authentication plugin (best practice)
  if (isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      
      authLog('Using native Firebase Authentication plugin for GitHub sign-in');
      authLog('Calling FirebaseAuthentication.signInWithGithub()...');
      
      // Use native plugin - this handles OAuth flow natively
      const result = await FirebaseAuthentication.signInWithGithub();
      
      authLog('Native plugin returned result:', {
        hasCredential: !!result.credential,
        hasIdToken: !!result.credential?.idToken,
        hasAccessToken: !!result.credential?.accessToken,
        userEmail: result.user?.email
      });
      
      // GitHub uses accessToken, but the plugin might return idToken
      // Check both and use OAuthProvider for flexibility
      const token = result.credential?.accessToken || result.credential?.idToken;
      
      if (!token) {
        throw new Error('No access token or ID token received from native authentication');
      }
      
      authLog('Creating Firebase credential from token...');
      // Create credential from native result and sign in with Firebase Web SDK
      // GitHub uses accessToken, so use OAuthProvider
      const { OAuthProvider } = await import('firebase/auth');
      const provider = new OAuthProvider('github.com');
      const credential = provider.credential({
        accessToken: result.credential?.accessToken || token,
        idToken: result.credential?.idToken
      });
      
      if (!credential) {
        throw new Error('Failed to create credential from native authentication result');
      }
      
      authLog('Signing in with credential...');
      // Sign in with the credential
      const userCredential = await signInWithCredential(authInstance, credential);
      authLog('✅ Sign-in successful! User:', userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      authError('Native GitHub sign-in failed:', error);
      if (DEBUG) {
        authError('Error details:', {
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack?.substring(0, 500)
        });
      }
      // Fallback to web popup if native fails
      authWarn('Falling back to web popup');
      const provider = new GithubAuthProvider();
      return signInWithPopup(authInstance, provider);
    }
  }
  
  // Use popup for web
  const provider = new GithubAuthProvider();
  return signInWithPopup(authInstance, provider);
}

/** Handle OAuth redirect result (call this on app startup) - Not needed with native plugin */
export async function handleOAuthRedirect(authInstance: Auth): Promise<UserCredential | null> {
  // With native plugin, redirects are handled automatically
  // This function is kept for backwards compatibility but won't be used
  return null;
}
