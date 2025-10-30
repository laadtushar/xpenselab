'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
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

/** Initiate Google sign-in via redirect. */
export function initiateGoogleSignInWithRedirect(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(authInstance, provider);
}

/** Handle the result of a Google sign-in redirect. */
export function getGoogleRedirectResult(authInstance: Auth): Promise<UserCredential | null> {
    return getRedirectResult(authInstance);
}


/** Initiate Google sign-in via popup. Returns a promise with the UserCredential. */
export function signInWithGooglePopup(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}
