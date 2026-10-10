'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';

// Plain public content that never touches Firebase. FirebaseClientProvider
// renders nothing until it has initialised in the browser, so wrapping these
// pages in it left their server-rendered HTML empty: no <h1>, no text, no
// links for any crawler that does not run JavaScript. They render outside it.
// Everything else (the sign-in page and the signed-in app) keeps the single
// provider it always had, so moving between those pages does not remount it.
const PUBLIC_STATIC_PATHS = new Set(['/', '/privacy']);

export function FirebaseScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_STATIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
