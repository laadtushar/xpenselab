import { pageMetadata } from '@/lib/seo';

// The sign-in page is public but not worth indexing: it has its own canonical
// and social tags, and noindex. It is deliberately left out of the sitemap.
export const metadata = pageMetadata({
  title: 'Sign in to XpenseLab with Google or GitHub',
  description:
    'Sign in to XpenseLab to manage your income, expenses and budgets. Secure authentication with your Google or GitHub account.',
  path: '/login',
  noindex: true,
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
