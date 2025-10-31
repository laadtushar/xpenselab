'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This function ensures Firebase is initialized only once.
function getFirebaseServices() {
  let app: FirebaseApp;
  try {
    // Attempt to get the already initialized app.
    // This will succeed on subsequent renders and during the auth redirect flow.
    app = getApp();
  } catch (e) {
    // If getApp() throws, it means the app hasn't been initialized yet.
    // This will happen on the very first load of the application.
    app = initializeApp(firebaseConfig);
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
