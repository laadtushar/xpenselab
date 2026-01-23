import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length === 0) {
    // Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS or default service account)
    adminApp = initializeApp({
      projectId: 'studio-3845013162-4f4cd',
    });
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(initializeAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(initializeAdminApp());
}
