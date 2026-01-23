'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, 
  Shapes, HandCoins, Link2, Repeat, BrainCircuit, ScanLine, TrendingUp, 
  HeartPulse, Landmark, X 
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SplitIcon } from '@/components/icons/split-icon';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Note: Dashboard, Income, Expenses, Budget are in bottom nav, so only show additional items here
const personalNavItems = [
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

const sharedNavItems = [
  { href: '/splits', label: 'Splits', icon: SplitIcon },
  { href: '/debts', label: 'Debts', icon: HandCoins },
  { href: '/loans', label: 'Loans', icon: Landmark },
];

const toolsNavItems = [
  { href: '/wellness', label: 'Wellness', icon: HeartPulse },
  { href: '/forecast', label: 'Forecast', icon: TrendingUp },
  { href: '/insights', label: 'Insights', icon: BrainCircuit },
  { href: '/scan-receipt', label: 'Scan Receipt', icon: ScanLine },
  { href: '/reports', label: 'Reports', icon: FileText },
];

const otherNavItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
  { href: '/privacy', label: 'Privacy & GDPR', icon: FileText },
];

export function MobileNavSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLinkClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  };

  const renderNavSection = (
    items: NavItem[],
    title?: string
  ) => (
    <div className="space-y-1">
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}
      {items.map(({ href, label, icon: Icon }) => (
        <button
          key={href}
          onClick={() => handleLinkClick(href)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
            isActive(href)
              ? "bg-accent text-accent-foreground"
              : "text-foreground"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-left">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] max-h-[600px] rounded-t-2xl pb-safe-area-inset-bottom flex flex-col"
        closeClassName="hidden"
      >
        <div className="flex items-center justify-center mb-4 shrink-0">
          <div className="h-1.5 w-12 bg-muted rounded-full" />
        </div>
        <SheetHeader className="text-left pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <Logo variant="horizontal" showText={true} />
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-6 overflow-y-auto pb-8 flex-1 min-h-0">
          {personalNavItems.length > 0 && renderNavSection(personalNavItems, 'Personal')}
          {renderNavSection(sharedNavItems, 'Shared')}
          {renderNavSection(toolsNavItems, 'Tools & Reports')}
          {/* Settings & More section - ensure it's always visible */}
          {otherNavItems.length > 0 && renderNavSection(otherNavItems, 'Settings & More')}
        </div>
      </SheetContent>
    </Sheet>
  );
}
