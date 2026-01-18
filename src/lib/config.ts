/**
 * Central configuration for feature flags and environment variables.
 */
export const FEATURES = {
    get isMonzoEnabled() {
        return !!(
            process.env.NEXT_PUBLIC_MONZO_CLIENT_ID &&
            process.env.MONZO_CLIENT_SECRET
        );
    },
    get isSaltEdgeEnabled() {
        return !!(
            process.env.SALTEDGE_APP_ID &&
            process.env.SALTEDGE_SECRET
        );
    },
};

export const CONFIG = {
    isProduction: process.env.NODE_ENV === 'production',
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'xpenselab-1',
};
