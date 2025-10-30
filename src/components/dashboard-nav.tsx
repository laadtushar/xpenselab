'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowLeftRight, PiggyBank, FileText, Settings } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: ArrowLeftRight },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={label}>
          <Link href={href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={href === '/dashboard' ? pathname === href : pathname.startsWith(href)}
              tooltip={{ children: label, side: 'right' }}
            >
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
