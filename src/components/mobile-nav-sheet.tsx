'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, 
  Shapes, HandCoins, Link2, Repeat, BrainCircuit, ScanLine, TrendingUp, 
  HeartPulse, Landmark, X, LogOut, User, Crown
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SplitIcon } from '@/components/icons/split-icon';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFinancials } from '@/context/financial-context';

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
  const auth = useAuth();
  const { user } = useUser();
  const { userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';
  
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLinkClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleSignOut = () => {
    setOpen(false);
    if (auth) {
      auth.signOut();
    }
  };

  // Swipe down to close functionality
  useEffect(() => {
    if (!open) return;

    let cleanup: (() => void) | null = null;

    // Use setTimeout to ensure the DOM is rendered
    const timeoutId = setTimeout(() => {
      const sheetContent = sheetContentRef.current;
      const dragHandle = dragHandleRef.current;
      const scrollContainer = scrollContainerRef.current;

      if (!sheetContent) return;

      const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
        isScrolling.current = false;
        
        // Check if we're starting the touch on the scrollable content
        const target = e.target as Node;
        if (scrollContainer && scrollContainer.contains(target)) {
          const scrollTop = scrollContainer.scrollTop;
          const scrollHeight = scrollContainer.scrollHeight;
          const clientHeight = scrollContainer.clientHeight;
          
          // If we're not at the top of the scroll container, allow scrolling
          if (scrollTop > 0 || scrollHeight <= clientHeight) {
            isScrolling.current = true;
          }
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (isScrolling.current) return;

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;

        // Only allow swipe down (positive deltaY)
        if (deltaY > 0) {
          // Prevent default scrolling if we're swiping down from the top
          if (scrollContainer && scrollContainer.scrollTop === 0) {
            e.preventDefault();
          }
          
          // Add visual feedback by moving the sheet down
          if (deltaY > 10) {
            sheetContent.style.transform = `translateY(${Math.min(deltaY, 100)}px)`;
            sheetContent.style.transition = 'none';
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const currentY = e.changedTouches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        const deltaTime = Date.now() - touchStartTime.current;
        const velocity = deltaTime > 0 ? Math.abs(deltaY) / deltaTime : 0;

        // Reset transform
        sheetContent.style.transform = '';
        sheetContent.style.transition = '';

        // Close if swiped down enough (100px) or fast enough (0.3px/ms)
        if (!isScrolling.current && (deltaY > 100 || (deltaY > 50 && velocity > 0.3))) {
          setOpen(false);
        }

        isScrolling.current = false;
      };

      // Add listeners to drag handle and sheet content
      if (dragHandle) {
        dragHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
        dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
        dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });
      }

      sheetContent.addEventListener('touchstart', handleTouchStart, { passive: false });
      sheetContent.addEventListener('touchmove', handleTouchMove, { passive: false });
      sheetContent.addEventListener('touchend', handleTouchEnd, { passive: true });

      cleanup = () => {
        if (dragHandle) {
          dragHandle.removeEventListener('touchstart', handleTouchStart);
          dragHandle.removeEventListener('touchmove', handleTouchMove);
          dragHandle.removeEventListener('touchend', handleTouchEnd);
        }
        sheetContent.removeEventListener('touchstart', handleTouchStart);
        sheetContent.removeEventListener('touchmove', handleTouchMove);
        sheetContent.removeEventListener('touchend', handleTouchEnd);
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [open]);

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
        ref={sheetContentRef}
      >
        <div 
          ref={dragHandleRef}
          className="flex items-center justify-center mb-4 shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="h-1.5 w-12 bg-muted rounded-full" />
        </div>
        <SheetHeader className="text-left pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <Logo variant="horizontal" showText={true} />
          </div>
          {/* User info section */}
          {user && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.displayName || 'User'}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                {isPremium && (
                  <div className="text-xs text-primary font-medium mt-0.5">Premium</div>
                )}
              </div>
            </div>
          )}
        </SheetHeader>
        <div ref={scrollContainerRef} className="mt-6 space-y-6 overflow-y-auto pb-8 flex-1 min-h-0">
          {personalNavItems.length > 0 && renderNavSection(personalNavItems, 'Personal')}
          {renderNavSection(sharedNavItems, 'Shared')}
          {renderNavSection(toolsNavItems, 'Tools & Reports')}
          {/* Settings & More section - ensure it's always visible */}
          {otherNavItems.length > 0 && renderNavSection(otherNavItems, 'Settings & More')}
          
          {/* Upgrade to Premium button for non-premium users */}
          {!isPremium && (
            <div className="pt-4 border-t">
              <button
                onClick={() => handleLinkClick('/checkout')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                )}
              >
                <Crown className="h-5 w-5 shrink-0" />
                <span className="text-left">Upgrade to Premium</span>
              </button>
            </div>
          )}
          
          {/* Logout button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSignOut}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20",
                "text-destructive"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-left">Sign Out</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
