import Link from 'next/link';
import { Logo } from '@/components/logo';
import { FamilyFooter } from '@/components/family-footer';
import { PrivacyContent } from '@/components/privacy/privacy-content';
import { buttonVariants } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy & GDPR | How XpenseLab Protects Your Financial Data',
  description:
    'What XpenseLab collects, how it is used and protected, optional client-side encryption, cookies, your GDPR rights and how to contact us about your data.',
  path: '/privacy',
});

// A public page, outside the signed-in (app) route group, so signed-out
// visitors and search engines can read it.
export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="XpenseLab Home">
            <Logo variant="horizontal" showText={true} />
          </Link>
          <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
            Open the app
          </Link>
        </div>
      </header>
      <main className="container flex-1 py-8">
        <PrivacyContent />
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
          <FamilyFooter />
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Back to the XpenseLab home page
          </Link>
        </div>
      </footer>
    </div>
  );
}
