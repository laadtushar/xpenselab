'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, Users, Shapes, HandCoins, Link2, Repeat, BrainCircuit, ScanLine, TrendingUp, HeartPulse, Landmark, Crown } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { SplitIcon } from '@/components/icons/split-icon';
import { useFinancials } from '@/context/financial-context';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

const sharedNavItems: NavItem[] = [
  { href: '/splits', label: 'Splits', icon: SplitIcon },
  { href: '/debts', label: 'Debts', icon: HandCoins },
  { href: '/loans', label: 'Loans', icon: Landmark },
];

const toolsNavItems: NavItem[] = [
    { href: '/wellness', label: 'Wellness', icon: HeartPulse },
    { href: '/forecast', label: 'Forecast', icon: TrendingUp },
    { href: '/insights', label: 'Insights', icon: BrainCircuit },
    { href: '/scan-receipt', label: 'Scan Receipt', icon: ScanLine },
    { href: '/reports', label: 'Reports', icon: FileText },
]

export function DashboardNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const renderNavMenu = (items: NavItem[]) => (
      <SidebarMenu>
        {items.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={label}>
            <SidebarMenuButton
                asChild
                isActive={href === '/dashboard' ? pathname === href : pathname.startsWith(href)}
                tooltip={{ children: label, side: 'right' }}
                onClick={handleLinkClick}
            >
                <Link href={href}>
                <Icon />
                <span>{label}</span>
                </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
    </SidebarMenu>
  )

  return (
    <>
        <div className="flex flex-col gap-2">
            <div className="px-2 text-xs text-muted-foreground font-medium uppercase">Personal</div>
            {renderNavMenu(navItems)}
        </div>
        <div className="flex flex-col gap-2">
            <div className="px-2 text-xs text-muted-foreground font-medium uppercase">Shared</div>
            {renderNavMenu(sharedNavItems)}
        </div>
        <div className="flex flex-col gap-2">
            <div className="px-2 text-xs text-muted-foreground font-medium uppercase">Tools & Reports</div>
            {renderNavMenu(toolsNavItems)}
        </div>
     <SidebarMenu className="mt-auto">
        {!isPremium && (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/checkout') || pathname.startsWith('/pricing')}
              tooltip={{ children: 'Upgrade to Premium', side: 'right' }}
              onClick={handleLinkClick}
              className="bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <Link href="/checkout">
                <Crown className="h-4 w-4" />
                <span>Upgrade to Premium</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/integrations')}
                tooltip={{ children: 'Integrations', side: 'right' }}
                onClick={handleLinkClick}
            >
                <Link href="/integrations">
                    <Link2 />
                    <span>Integrations</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/settings')}
                tooltip={{ children: 'Settings', side: 'right' }}
                onClick={handleLinkClick}
            >
                <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
     </SidebarMenu>
     </>
  );
}
