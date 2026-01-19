'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { buttonVariants } from '@/components/ui/button';

export function HomepageBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Only show on homepage
  if (!isMobile || pathname !== '/') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors rounded-lg",
            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
            pathname === '/'
              ? "text-primary bg-accent/50"
              : "text-muted-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Link>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "flex flex-col items-center justify-center gap-1 h-auto py-2 px-4"
          )}
        >
          <LogIn className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Login</span>
        </Link>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "sm" }),
            "flex flex-col items-center justify-center gap-1 h-auto py-2 px-4"
          )}
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Sign Up</span>
        </Link>
      </div>
    </nav>
  );
}
