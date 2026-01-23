import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { WebVitals } from '@/components/web-vitals';
import { ErrorBoundary } from '@/components/error-boundary';
import { WebViewErrorHandler } from '@/components/webview-error-handler';
import { SplashScreenHandler } from '@/components/splash-screen-handler';
import { UIUXDashboard } from '@/components/ui-ux-dashboard';
import { CookieConsent } from '@/components/cookie-consent';
import { siteConfig } from '@/config/site';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'XpenseLab',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/logo-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/logo-icon.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@xpenselab',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.siteUrl,
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  category: 'finance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0d59f2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="XpenseLab" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                      console.log('SW registered: ', registration);
                      
                      // Track registration errors
                      let errorCount = 0;
                      const MAX_ERRORS = 3;
                      
                      // Check for updates every hour
                      const updateInterval = setInterval(() => {
                        registration.update().catch((error) => {
                          console.warn('SW update check failed:', error);
                          errorCount++;
                          if (errorCount >= MAX_ERRORS) {
                            console.error('Too many SW errors, unregistering...');
                            clearInterval(updateInterval);
                            registration.unregister().catch(() => {});
                          }
                        });
                      }, 60 * 60 * 1000);
                      
                      // Check for updates on page focus
                      const focusHandler = () => {
                        registration.update().catch((error) => {
                          console.warn('SW update on focus failed:', error);
                        });
                      };
                      window.addEventListener('focus', focusHandler);
                      
                      // Listen for service worker updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated') {
                              // New service worker activated, reload to get latest version
                              // Use a more user-friendly approach - auto-reload after short delay
                              const shouldReload = confirm('A new version is available. Reload now? (Auto-reload in 5 seconds)');
                              if (shouldReload) {
                                window.location.reload();
                              } else {
                                // Auto-reload after 5 seconds
                                setTimeout(() => {
                                  window.location.reload();
                                }, 5000);
                              }
                            }
                          });
                        }
                      });
                      
                      // Handle service worker errors
                      navigator.serviceWorker.addEventListener('error', (event) => {
                        console.error('Service Worker error:', event);
                        errorCount++;
                        if (errorCount >= MAX_ERRORS) {
                          console.error('Too many SW errors, unregistering...');
                          clearInterval(updateInterval);
                          window.removeEventListener('focus', focusHandler);
                          registration.unregister().catch(() => {});
                        }
                      });
                    })
                    .catch((registrationError) => {
                      console.error('SW registration failed: ', registrationError);
                      // Don't retry indefinitely - log and move on
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <ErrorBoundary>
          <WebViewErrorHandler>
            <SplashScreenHandler />
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <FirebaseClientProvider>
                {children}
                </FirebaseClientProvider>
                <Toaster />
                <WebVitals />
                <UIUXDashboard />
                <CookieConsent />
                <PWAInstallPrompt />
            </ThemeProvider>
          </WebViewErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}
