/**
 * Central configuration for feature flags and environment variables.
 */
export const FEATURES = {
    // Feature flags can be added here as needed
};

export const CONFIG = {
    isProduction: process.env.NODE_ENV === 'production',
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-3845013162-4f4cd',
};
