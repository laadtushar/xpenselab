import { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Sign In | XpenseLab',
  description: 'Sign in to XpenseLab to access your personal finance tracker. Secure authentication with Google or GitHub.',
  robots: {
    index: false, // Login pages typically shouldn't be indexed
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
