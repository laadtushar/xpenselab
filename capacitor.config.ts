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
