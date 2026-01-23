import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xpenselab.app',
  appName: 'XpenseLab',
  // Point to your deployed URL instead of local files
  // This allows the app to work with your Next.js API routes
  server: {
    url: 'https://xpenselab.com',
    cleartext: false, // Use HTTPS
  },
  // For local development, you can override with:
  // server: {
  //   url: 'http://localhost:9002',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Don't auto-hide, we'll hide it manually
      launchAutoHide: false, // Keep splash visible until page loads
      backgroundColor: '#101622',
      showSpinner: true,
      spinnerColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#101622',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false, // Use native authentication for mobile
      providers: ['google.com', 'github.com'], // Enable Google and GitHub providers
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
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
