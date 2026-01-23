# Migration to @capacitor-firebase/authentication

## Overview
Migrated from Firebase Web SDK OAuth to `@capacitor-firebase/authentication` native plugin for better reliability and best practices.

## Changes Made

### 1. Package Installation
- ✅ Installed `@capacitor-firebase/authentication`

### 2. Configuration Updates

#### `capacitor.config.ts`
- Added `FirebaseAuthentication` plugin configuration:
  ```typescript
  FirebaseAuthentication: {
    skipNativeAuth: false,
    providers: ['google.com', 'github.com'],
  }
  ```

#### `android/variables.gradle`
- Added required variables:
  ```gradle
  rgcfaIncludeGoogle = true
  androidxCredentialsVersion = '1.3.0'
  ```

### 3. Code Changes

#### `src/firebase/non-blocking-login.ts`
- **Google Sign-In**: Now uses `FirebaseAuthentication.signInWithGoogle()` for native platforms
- **GitHub Sign-In**: Now uses `FirebaseAuthentication.signInWithGithub()` for native platforms
- Removed custom URL scheme handling
- Removed Browser plugin usage for OAuth
- Removed API route calls for OAuth URLs
- Native plugin returns `idToken` which is used with `GoogleAuthProvider.credential()` and `signInWithCredential()`

#### `src/app/(auth)/login/page.tsx`
- Removed `initializeCapacitorAuth` import and setup
- Removed `handleOAuthRedirect` call
- Simplified error handling (no more `REDIRECT_INITIATED` checks)

#### `src/app/(app)/layout.tsx`
- Removed `initializeCapacitorAuth` import and setup

### 4. Files to Remove (Optional Cleanup)
- `src/app/auth/callback/page.tsx` - No longer needed (native plugin handles redirects)
- `src/app/api/auth/google-url/route.ts` - No longer needed
- `src/app/api/auth/github-url/route.ts` - No longer needed
- `src/lib/capacitor-auth.ts` - No longer needed (or can be simplified)

## Next Steps

### 1. Sync Capacitor
```bash
npx cap sync android
```

### 2. Android Setup
1. Add SHA-1 fingerprint to Firebase Console:
   - Go to Firebase Console → Project Settings
   - Add your app's SHA-1 fingerprint (get it with: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`)

2. Enable Google Sign-In in Firebase Console:
   - Firebase Console → Authentication → Sign-in method
   - Enable Google

3. Enable GitHub Sign-In in Firebase Console:
   - Firebase Console → Authentication → Sign-in method
   - Enable GitHub (add Client ID and Secret)

### 3. Test
- Build and test Google sign-in on Android
- Build and test GitHub sign-in on Android
- Verify web sign-in still works (uses popup)

## Benefits

1. **No Custom URL Schemes**: Native plugin handles redirects automatically
2. **No Browser Closing Issues**: Plugin manages browser lifecycle
3. **Better Security**: Uses native OAuth implementations
4. **Simpler Code**: No manual redirect handling needed
5. **Better UX**: Seamless authentication flow

## How It Works Now

1. User clicks "Sign in with Google" in app
2. Native plugin opens OAuth flow (Custom Tabs on Android)
3. User authenticates
4. Plugin returns `idToken` directly
5. We create Firebase credential from `idToken`
6. Sign in with `signInWithCredential()`
7. User is authenticated - no redirect handling needed!
