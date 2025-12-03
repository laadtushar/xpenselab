'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs once on the client after the component mounts.
    // This is the safe place to initialize Firebase.
    let app: FirebaseApp;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        if (process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY) {
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY),
                    isTokenAutoRefreshEnabled: true,
                });
            } catch (e) {
                console.error("Error initializing App Check", e);
            }
        }
    } else {
        app = getApp();
    }
    
    setServices({
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    });

  }, []); // Empty dependency array ensures this runs only once.

  if (!services) {
    // Render nothing or a loader until Firebase is initialized.
    // This prevents children from trying to access Firebase services too early.
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
