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

// Removed getRedirectUrl() - not needed with native plugin

/** Initiate Google sign-in (uses native plugin in mobile, popup in web). */
export async function initiateGoogleSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  // For native apps, use @capacitor-firebase/authentication plugin (best practice)
  if (isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      
      console.log('[Auth] Using native Firebase Authentication plugin for Google sign-in');
      
      // Use native plugin - this handles OAuth flow natively
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (!result.credential?.idToken) {
        throw new Error('No ID token received from native authentication');
      }
      
      // Create credential from native result and sign in with Firebase Web SDK
      // Use static method GoogleAuthProvider.credential()
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      
      if (!credential) {
        throw new Error('Failed to create credential from native authentication result');
      }
      
      // Sign in with the credential
      return await signInWithCredential(authInstance, credential);
    } catch (error: any) {
      console.error('[Auth] Native Google sign-in failed:', error);
      // Fallback to web popup if native fails
      console.warn('[Auth] Falling back to web popup');
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
      
      console.log('[Auth] Using native Firebase Authentication plugin for GitHub sign-in');
      
      // Use native plugin - this handles OAuth flow natively
      const result = await FirebaseAuthentication.signInWithGithub();
      
      // GitHub uses accessToken, but the plugin might return idToken
      // Check both and use OAuthProvider for flexibility
      const token = result.credential?.accessToken || result.credential?.idToken;
      
      if (!token) {
        throw new Error('No access token or ID token received from native authentication');
      }
      
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
      
      // Sign in with the credential
      return await signInWithCredential(authInstance, credential);
    } catch (error: any) {
      console.error('[Auth] Native GitHub sign-in failed:', error);
      // Fallback to web popup if native fails
      console.warn('[Auth] Falling back to web popup');
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
