'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// This function ensures Firebase is initialized only once.
function getFirebaseServices() {
  let app: FirebaseApp;
  try {
    // Attempt to get the already initialized app.
    app = getApp();
  } catch (e) {
    // If getApp() throws, it means the app hasn't been initialized yet.
    app = initializeApp(firebaseConfig);
    
    // Initialize App Check right after the app is initialized.
    // This should only run once.
    if (typeof window !== 'undefined') {
       initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
        // Optional: set to true to allow App Check to refresh tokens automatically.
        isTokenAutoRefreshEnabled: true
      });
    }
  }

  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}


// IMPORTANT: This is the function that should be used to get the services.
// It is a stable function that will always return the same initialized services.
export function initializeFirebase() {
    return getFirebaseServices();
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
