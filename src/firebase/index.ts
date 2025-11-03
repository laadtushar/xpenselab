'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

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
      try {
        initializeAppCheck(app, {
          // Use ReCaptchaEnterpriseProvider, which doesn't require a site key in the code.
          provider: new ReCaptchaEnterpriseProvider(/* siteKey */),
          isTokenAutoRefreshEnabled: true
        });
        console.log("Firebase App Check initialized with ReCaptchaEnterpriseProvider.");
      } catch (appCheckError) {
          console.error("Firebase App Check initialization failed:", appCheckError);
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
