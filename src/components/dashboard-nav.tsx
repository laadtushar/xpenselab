'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings, Users, Shapes } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { SplitIcon } from '@/components/icons/split-icon';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/categories', label: 'Categories', icon: Shapes },
  { href: '/splits', label: 'Splits', icon: SplitIcon },
  { href: '/reports', label: 'Reports', icon: FileText },
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
  );
}
