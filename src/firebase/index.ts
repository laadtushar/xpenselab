'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
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
    
    // Initialize App Check right after the app is initialized, ONLY on the client.
    if (typeof window !== 'undefined') {
      // Ensure the reCAPTCHA site key is present before initializing App Check.
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
      if (siteKey) {
        try {
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true,
          });
          console.log("Firebase App Check initialized with ReCaptchaV3Provider.");
        } catch (appCheckError) {
          console.error("Firebase App Check initialization failed:", appCheckError);
        }
      } else {
        console.error(
          'App Check initialization skipped: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY is not set in environment variables. Authentication and other Firebase services may fail.'
        );
      }
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
export function initializeFirebase(): { firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } {
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