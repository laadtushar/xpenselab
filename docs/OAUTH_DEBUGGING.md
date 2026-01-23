# OAuth Flow Debugging Guide

## Issue: Browser stays open after login, doesn't return to app

### Symptoms
- User clicks "Sign in with Google"
- External browser opens
- User completes authentication
- Browser stays on callback page
- App doesn't receive the redirect

### Debugging Steps

#### 1. Check Console Logs

**In the app (before clicking sign-in):**
- Look for: `[Capacitor Auth] App opened with URL:`
- This confirms the listener is set up

**In external browser (on callback page):**
- Look for: `[Callback] Redirecting to app with URL:`
- This confirms the redirect is being attempted
- Check the full URL being redirected to

**In the app (after redirect):**
- Look for: `[Capacitor Auth] App opened with URL: xpenselab://...`
- This confirms the app intercepted the custom scheme

#### 2. Test Custom Scheme Manually

In Android, you can test if the custom scheme works:
```bash
adb shell am start -a android.intent.action.VIEW -d "xpenselab://auth/callback?success=true&test=1"
```

If this opens the app, the intent filter is working.

#### 3. Check Android Logs

```bash
adb logcat | grep -i "xpenselab\|capacitor\|oauth"
```

Look for:
- Intent filter matches
- URL interception
- Any errors

#### 4. Verify Intent Filter

Check `android/app/src/main/AndroidManifest.xml`:
- Should have intent filter with `xpenselab` scheme
- Should have `BROWSABLE` category
- Activity should have `android:launchMode="singleTask"`

#### 5. Test Redirect in Browser

Open Chrome on Android and manually navigate to:
```
xpenselab://auth/callback?success=true&test=1
```

If it asks to open the app, the scheme is registered correctly.

### Common Issues

1. **Listener not initialized**: `initializeCapacitorAuth` must be called before redirect
   - ✅ Fixed: Now called in both login page and app layout

2. **Browser not closing**: Some browsers don't allow `window.close()`
   - ✅ Fixed: Using `Browser.close()` from Capacitor plugin

3. **URL too long**: Credentials in URL might exceed limits
   - ✅ Fixed: Using base64-encoded JSON instead of raw tokens

4. **Intent filter mismatch**: URL format doesn't match intent filter
   - ✅ Fixed: Added specific host/path filter

5. **Timing issue**: Redirect happens before listener is ready
   - ✅ Fixed: Listener initialized early in login page

### Testing Checklist

- [ ] Console shows listener setup: `[Capacitor Auth] App opened with URL:`
- [ ] Console shows redirect attempt: `[Callback] Redirecting to app with URL:`
- [ ] Console shows app interception: `[Capacitor Auth] Detected OAuth callback URL`
- [ ] Console shows successful sign-in: `[Capacitor Auth] OAuth redirect successful`
- [ ] App comes to foreground after redirect
- [ ] User is signed in after redirect

### Next Steps if Still Failing

1. Check if `Browser.close()` is preventing redirect - try removing it
2. Try using `window.location.replace()` instead of `href`
3. Check if there's a browser security policy blocking custom schemes
4. Verify the redirect URL format matches exactly: `xpenselab://auth/callback?...`
5. Test with a simpler redirect first: `xpenselab://test`
