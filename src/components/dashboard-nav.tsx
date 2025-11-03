
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, Users, Shapes, HandCoins, Link2, Repeat, BrainCircuit, ScanLine, TrendingUp, HeartPulse } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { SplitIcon } from '@/components/icons/split-icon';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

const sharedNavItems = [
  { href: '/splits', label: 'Splits', icon: SplitIcon },
  { href: '/debts', label: 'Debts', icon: HandCoins },
];

const toolsNavItems = [
    { href: '/wellness', label: 'Wellness', icon: HeartPulse },
    { href: '/forecast', label: 'Forecast', icon: TrendingUp },
    { href: '/insights', label: 'Insights', icon: BrainCircuit },
    { href: '/scan-receipt', label: 'Scan Receipt', icon: ScanLine },
    { href: '/reports', label: 'Reports', icon: FileText },
]

export function DashboardNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const renderNavMenu = (items: typeof navItems) => (
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
