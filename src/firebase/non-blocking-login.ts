'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
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

/** Initiate Google sign-in via Redirect (avoids COOP issues). */
export function initiateGoogleSignInWithRedirect(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(authInstance, provider);
}

/** Initiate GitHub sign-in via Redirect (avoids COOP issues). */
export function initiateGitHubSignInWithRedirect(authInstance: Auth): Promise<void> {
  const provider = new GithubAuthProvider();
  return signInWithRedirect(authInstance, provider);
}

/** Handle redirect result after OAuth redirect. */
export async function handleAuthRedirect(authInstance: Auth): Promise<UserCredential | null> {
  try {
    const result = await getRedirectResult(authInstance);
    return result;
  } catch (error) {
    console.error('Auth redirect error:', error);
    return null;
  }
}
