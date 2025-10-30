import type { Metadata } from 'next';
import './globals.css';
import { FinancialProvider } from '@/context/financial-context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'FinanceFlow',
  description: 'Manage your finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FinancialProvider>
          {children}
        </FinancialProvider>
        <Toaster />
      </body>
    </html>
  );
}
