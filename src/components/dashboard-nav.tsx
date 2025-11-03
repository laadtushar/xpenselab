'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, Users, Shapes, HandCoins, Link2 } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { SplitIcon } from '@/components/icons/split-icon';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/categories', label: 'Categories', icon: Shapes },
  { href: '/splits', label: 'Splits', icon: SplitIcon },
  { href: '/debts', label: 'Debts', icon: HandCoins },
  { href: '/reports', label: 'Reports', icon: FileText },
];

const secondaryNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
    <SidebarMenu>
      {navItems.map(({ href, label, icon: Icon }) => (
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
