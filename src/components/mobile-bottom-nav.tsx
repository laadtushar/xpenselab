'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  // Only show on app routes, not on homepage or login
  const isAppRoute = pathname.startsWith('/dashboard') || 
                     pathname.startsWith('/income') || 
                     pathname.startsWith('/expenses') || 
                     pathname.startsWith('/budget') ||
                     pathname.startsWith('/categories') ||
                     pathname.startsWith('/splits') ||
                     pathname.startsWith('/debts') ||
                     pathname.startsWith('/loans') ||
                     pathname.startsWith('/recurring') ||
                     pathname.startsWith('/wellness') ||
                     pathname.startsWith('/forecast') ||
                     pathname.startsWith('/insights') ||
                     pathname.startsWith('/scan-receipt') ||
                     pathname.startsWith('/reports') ||
                     pathname.startsWith('/integrations') ||
                     pathname.startsWith('/settings');

  if (!isAppRoute) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {mainNavItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors",
              "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
              isActive(href)
                ? "text-primary bg-accent/50"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors",
            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
            pathname.startsWith('/settings')
              ? "text-primary bg-accent/50"
              : "text-muted-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </Link>
      </div>
    </nav>
  );
}
