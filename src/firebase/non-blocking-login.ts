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
  UserCredential
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

/** Initiate Google sign-in (uses redirect in native, popup in web). */
export async function initiateGoogleSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  
  // Use redirect for native apps (Firebase will redirect to web URL, WebView will handle it)
  if (isNativePlatform()) {
    await signInWithRedirect(authInstance, provider);
    // Note: signInWithRedirect doesn't return a promise with the result
    // The result is handled via getRedirectResult after redirect
    throw new Error('REDIRECT_INITIATED'); // Special error to indicate redirect was initiated
  }
  
  // Use popup for web
  return signInWithPopup(authInstance, provider);
}

/** Initiate GitHub sign-in (uses redirect in native, popup in web). */
export async function initiateGitHubSignInWithPopup(authInstance: Auth): Promise<UserCredential> {
  const provider = new GithubAuthProvider();
  
  // Use redirect for native apps (Firebase will redirect to web URL, WebView will handle it)
  if (isNativePlatform()) {
    await signInWithRedirect(authInstance, provider);
    // Note: signInWithRedirect doesn't return a promise with the result
    throw new Error('REDIRECT_INITIATED'); // Special error to indicate redirect was initiated
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
