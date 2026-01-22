import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { GeistSans } from 'geist/font/sans';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { WebVitals } from '@/components/web-vitals';
import { ErrorBoundary } from '@/components/error-boundary';
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
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Next.js", "React", "Tailwind CSS", "Firebase", "Genkit", "Finance App", "Expense Tracker"],
  authors: [{ name: "XpenseLab" }],
  creator: "XpenseLab",
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
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [],
  },
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
        <meta name="theme-color" content="#000000" />
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
