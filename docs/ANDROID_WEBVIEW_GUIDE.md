# Android WebView App Guide

## Overview

This guide explains how to convert XpenseLab into a native Android WebView application using **Capacitor**. Capacitor is the modern, recommended approach for wrapping web apps as native mobile apps.

## What is a WebView App?

A WebView app wraps your web application in a native Android container, allowing you to:
- Distribute via Google Play Store
- Access native device features (camera, file system, etc.)
- Use native UI components when needed
- Maintain a single codebase (your existing Next.js app)

## Why Capacitor?

- ✅ Modern and actively maintained (by Ionic team)
- ✅ Works seamlessly with Next.js
- ✅ Leverages your existing PWA setup
- ✅ Native plugin ecosystem
- ✅ Easy to configure and deploy
- ✅ Supports both Android and iOS (future expansion)

## Prerequisites

1. **Node.js** (v18+)
2. **Android Studio** (for Android SDK and emulator)
3. **Java Development Kit (JDK)** 17 or higher
4. **Your Next.js app** (already built and deployed)

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name**: `XpenseLab`
- **App ID**: `com.xpenselab.app` (or your preferred reverse domain)
- **Web dir**: `.next` (for production builds) or `out` (if using static export)

## Step 3: Configure Next.js for Static Export (Recommended)

For WebView apps, you typically want a static export. Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ... existing config ...
  
  // Add this for static export
  output: 'export', // This generates static HTML files
  
  // Disable image optimization for static export (or use unoptimized)
  images: {
    unoptimized: true,
    // ... existing remotePatterns ...
  },
};
```

**Note**: If you need SSR features (like API routes), you'll need to:
- Keep your Next.js server running
- Point Capacitor to your deployed URL (`https://xpenselab.com`)
- This is simpler but requires internet connection

## Step 4: Build Your App

```bash
npm run build
```

This creates the static files in `.next/out` (or `.next` depending on your config).

## Step 5: Configure Capacitor

Create/update `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xpenselab.app',
  appName: 'XpenseLab',
  webDir: '.next/out', // or '.next' depending on your build output
  server: {
    // For development, you can point to your local server
    // url: 'http://localhost:9002',
    // cleartext: true,
    
    // For production, use your deployed URL
    // url: 'https://xpenselab.com',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#101622',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#101622',
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set this for production builds
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },
};

export default config;
```

## Step 6: Add Android Platform

```bash
npx cap add android
```

This creates an `android/` folder in your project root.

## Step 7: Install Required Plugins

For your app's features, install these plugins:

```bash
# Camera access (for receipt scanning)
npm install @capacitor/camera

# File system access (for CSV imports/exports)
npm install @capacitor/filesystem

# App state and lifecycle
npm install @capacitor/app

# Keyboard handling
npm install @capacitor/keyboard

# Status bar styling
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen
```

## Step 8: Update Code for Native Features

### Camera Access

Update `src/components/receipt-scanner/receipt-scanner.tsx`:

```typescript
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

// Replace navigator.mediaDevices.getUserMedia with:
const getCameraPermission = async () => {
  if (Capacitor.isNativePlatform()) {
    // Use Capacitor Camera plugin
    try {
      const permission = await Camera.requestPermissions();
      if (permission.camera === 'granted') {
        setHasCameraPermission(true);
        // Use Camera.getPhoto() for native camera
      }
    } catch (error) {
      setHasCameraPermission(false);
    }
  } else {
    // Use web API (existing code)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    setHasCameraPermission(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }
};
```

### Handle Deep Links

Create `src/lib/capacitor.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();

// Handle app URLs (for OAuth redirects)
if (isNative) {
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);
    // Handle Firebase Auth redirects
    if (url.pathname === '/auth/callback') {
      // Process authentication
    }
  });
}
```

## Step 9: Configure Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <!-- Existing permissions -->
  
  <!-- Camera -->
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-feature android:name="android.hardware.camera" android:required="false" />
  
  <!-- Internet (already included) -->
  <uses-permission android:name="android.permission.INTERNET" />
  
  <!-- File access -->
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                   android:maxSdkVersion="32" />
  
  <!-- Network state -->
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

## Step 10: Handle Firebase Authentication

### Option A: Use Custom URL Scheme (Recommended)

1. Update `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  // ... existing config ...
  appId: 'com.xpenselab.app',
  // This creates a custom URL scheme: xpenselab://
};
```

2. Update Firebase Auth settings:
   - Go to Firebase Console → Authentication → Settings
   - Add authorized redirect URI: `xpenselab://auth/callback`
   - Update your OAuth providers to allow this URL

3. Update your auth code to handle the custom scheme:
```typescript
// In your login component
const redirectUrl = Capacitor.isNativePlatform() 
  ? 'xpenselab://auth/callback'
  : window.location.origin + '/auth/callback';
```

### Option B: Use Universal Links (Advanced)

Requires domain verification and more complex setup.

## Step 11: Handle Stripe Payments

Stripe Checkout works in WebView, but you need to handle redirects:

```typescript
// In your checkout page
if (Capacitor.isNativePlatform()) {
  // Use In-App Browser or handle redirects
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url: checkoutUrl });
} else {
  window.location.href = checkoutUrl;
}
```

Install browser plugin:
```bash
npm install @capacitor/browser
```

## Step 12: Build and Test

```bash
# Build your Next.js app
npm run build

# Sync files to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync
2. Select a device/emulator
3. Click Run ▶️

## Step 13: Configure App Icon and Splash Screen

### App Icon

1. Generate icons using [Capacitor Assets](https://capacitorjs.com/docs/guides/splash-screens-and-icons) or [App Icon Generator](https://www.appicon.co/)
2. Place icons in `android/app/src/main/res/`:
   - `mipmap-mdpi/ic_launcher.png` (48x48)
   - `mipmap-hdpi/ic_launcher.png` (72x72)
   - `mipmap-xhdpi/ic_launcher.png` (96x96)
   - `mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192x192)

Or use your existing SVG logo and convert it.

### Splash Screen

Create splash screen images or use Capacitor's splash screen plugin configuration.

## Step 14: Production Build

### Generate Keystore

```bash
keytool -genkey -v -keystore xpenselab-release.keystore -alias xpenselab -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing

Create `android/key.properties`:
```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=xpenselab
storeFile=../xpenselab-release.keystore
```

Update `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### Build Release APK

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose APK
3. Select your keystore
4. Build

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Step 15: Testing Checklist

- [ ] App launches successfully
- [ ] Firebase Authentication works (Google/GitHub OAuth)
- [ ] Camera access for receipt scanning
- [ ] Stripe checkout and payment flow
- [ ] File import/export (CSV)
- [ ] Offline functionality (if using service worker)
- [ ] Push notifications (if implemented)
- [ ] Deep linking (OAuth callbacks)
- [ ] App icon and splash screen display correctly
- [ ] Status bar styling matches app theme

## Step 16: Publishing to Google Play

1. Create a Google Play Developer account ($25 one-time fee)
2. Create a new app in Google Play Console
3. Fill out store listing (description, screenshots, etc.)
4. Upload APK or AAB (Android App Bundle - recommended)
5. Complete content rating questionnaire
6. Set up pricing and distribution
7. Submit for review

## Important Considerations

### Firebase API Key Restrictions

Your Firebase API key is already restricted to `xpenselab.com`. For the Android app:
- Add your app's package name: `com.xpenselab.app`
- Or create a separate API key for the mobile app
- Update Android app restrictions in Firebase Console

### Service Worker

Service workers work in WebView, but test thoroughly:
- Cache strategies
- Offline functionality
- Update mechanisms

### Performance

- WebView apps can be slower than native apps
- Optimize your Next.js bundle size
- Use code splitting
- Lazy load heavy components

### Updates

- App updates require new Play Store submission
- Consider using Capacitor's Live Updates (paid feature) or CodePush
- Or rely on your web app's auto-update mechanism

## Alternative: Point to Deployed URL

Instead of bundling the app, you can point Capacitor to your deployed URL:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  // ... other config ...
  server: {
    url: 'https://xpenselab.com',
    cleartext: false,
  },
};
```

**Pros:**
- Instant updates (no Play Store approval)
- Smaller app size
- Easier maintenance

**Cons:**
- Requires internet connection
- Less "native" feel
- Can't work fully offline

## Troubleshooting

### Build Errors

- Ensure Java JDK 17+ is installed
- Check Android SDK is properly configured
- Verify Gradle version compatibility

### Camera Not Working

- Check permissions in AndroidManifest.xml
- Verify runtime permissions are requested
- Test on a real device (emulator camera can be flaky)

### Firebase Auth Issues

- Verify redirect URIs are configured correctly
- Check API key restrictions include Android app
- Test OAuth flow in WebView

### Stripe Redirect Issues

- Use Capacitor Browser plugin for checkout
- Handle success/cancel callbacks properly
- Test payment flow end-to-end

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Google Play Console](https://play.google.com/console)

## Next Steps

1. Start with development build and test on emulator
2. Test all critical features
3. Build release APK for internal testing
4. Submit to Google Play Beta/Internal testing
5. Gather feedback and iterate
6. Submit for production release

---

**Note**: This guide covers Android. For iOS, the process is similar but requires:
- macOS and Xcode
- Apple Developer account ($99/year)
- iOS-specific configuration
