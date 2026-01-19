import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Next.js", "React", "Tailwind CSS", "Firebase", "Genkit", "Finance App", "Expense Tracker"],
  authors: [{ name: "XpenseLab" }],
  creator: "XpenseLab",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
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
    icon: '/icon-192.png',
    apple: '/icon-192.png',
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
                    })
                    .catch((registrationError) => {
                      console.log('SW registration failed: ', registrationError);
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
