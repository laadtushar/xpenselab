# Google OAuth Setup for Android WebView App

## Problem
Google blocks OAuth requests from WebViews with Error 403: `disallowed_useragent`. This is a security policy Google implemented to prevent OAuth abuse in embedded browsers.

## Solution
Use **Chrome Custom Tabs** (external browser) instead of WebView for OAuth flows. This is what Capacitor's Browser plugin uses.

## Google Console Configuration

### 1. Add Authorized Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the project associated with your Firebase project)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used for web)
5. Click **Edit**
6. Under **Authorized redirect URIs**, add:
   ```
   https://xpenselab.com/auth/callback
   ```
7. Click **Save**

### 2. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Ensure `xpenselab.com` is listed (it should be automatically added)
5. If not, click **Add domain** and add `xpenselab.com`

### 3. OAuth Consent Screen (if needed)

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Ensure your app is properly configured
3. Add any required scopes if needed

## How It Works

1. User clicks "Sign in with Google" in the app
2. App opens external browser (Chrome Custom Tabs) with Firebase Auth handler URL
3. Firebase redirects to Google OAuth (in external browser - allowed by Google)
4. User authenticates with Google
5. Google redirects back to Firebase handler
6. Firebase processes auth and redirects to `https://xpenselab.com/auth/callback`
7. Our callback page processes the auth result and redirects to `xpenselab://auth/callback`
8. App intercepts the custom scheme and completes authentication

## Testing

1. Build and install the Android app
2. Click "Sign in with Google"
3. External browser should open (not WebView)
4. Complete Google authentication
5. Browser should redirect back to app
6. User should be signed in

## Troubleshooting

- **Still getting disallowed_useragent**: Make sure Browser plugin is being used, not WebView
- **Redirect not working**: Check that `https://xpenselab.com/auth/callback` is in authorized redirect URIs
- **App not opening after auth**: Check AndroidManifest.xml has the custom scheme intent filter
