import type { Metadata } from 'next';
import './globals.css';
import { FinancialProvider } from '@/context/financial-context';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
      <body className={`font-sans antialiased ${inter.variable}`}>
        <FinancialProvider>
          {children}
        </FinancialProvider>
        <Toaster />
      </body>
    </html>
  );
}
