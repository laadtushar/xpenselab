import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';

// Everything in this route group is the signed-in product. Signed-out
// visitors only ever see the loading shell before the redirect to /login, so
// none of it belongs in a search index. (Metadata cannot be exported from the
// client component, hence the shell lives in components/app-shell.tsx.)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
