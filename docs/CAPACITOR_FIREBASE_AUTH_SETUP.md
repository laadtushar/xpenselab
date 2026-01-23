# @capacitor-firebase/authentication Setup Guide

## Installation Complete ✅
- Package installed: `@capacitor-firebase/authentication`
- Configuration added to `capacitor.config.ts`
- Android variables added to `variables.gradle`

## Next Steps

### 1. Sync Capacitor
```bash
npx cap sync android
```

### 2. Android Setup

#### A. Add SHA-1 Fingerprint to Firebase
1. Get your app's SHA-1 fingerprint:
   ```bash
   # For debug keystore (development)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore (production)
   keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
   ```

2. Add SHA-1 to Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** → **Your apps** → **Android app**
   - Click **Add fingerprint** and paste your SHA-1

#### B. Enable Google Sign-In
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → **Enable**
3. Add your OAuth client ID and secret (if not already configured)
4. Save

#### C. Enable GitHub Sign-In
1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **GitHub** → **Enable**
3. Add your GitHub OAuth App Client ID and Secret
4. Save

### 3. Test
1. Build the Android app: `npx cap run android`
2. Test Google sign-in
3. Test GitHub sign-in
4. Verify web sign-in still works (uses popup)

## How It Works

### Native (Android/iOS)
1. User clicks "Sign in with Google/GitHub"
2. Native plugin opens OAuth flow (Custom Tabs on Android)
3. User authenticates
4. Plugin returns credential with `idToken` (and `accessToken` for GitHub)
5. We create Firebase credential from token
6. Sign in with `signInWithCredential()`
7. ✅ User is authenticated - seamless!

### Web
1. User clicks "Sign in with Google/GitHub"
2. Uses Firebase Web SDK `signInWithPopup()`
3. ✅ User is authenticated

## Benefits Over Previous Implementation

1. ✅ **No custom URL schemes needed** - Plugin handles redirects
2. ✅ **No browser closing issues** - Plugin manages lifecycle
3. ✅ **No callback page needed** - Plugin handles everything
4. ✅ **No API routes needed** - Plugin generates OAuth URLs
5. ✅ **Better security** - Uses native OAuth implementations
6. ✅ **Simpler code** - Much less code to maintain
7. ✅ **Better UX** - Seamless authentication flow

## Troubleshooting

### "No ID token received"
- Check Firebase Console → Authentication → Sign-in method is enabled
- Verify SHA-1 fingerprint is added
- Check Android logs for errors

### "Failed to create credential"
- Verify the native plugin returned a valid token
- Check console logs for token values

### Sign-in works but user not signed in
- Check `auth.currentUser` after sign-in
- Verify `onAuthStateChanged` listener is working
- Check React state updates
