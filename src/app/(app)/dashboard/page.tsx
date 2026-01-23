"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Crown } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { useFinancials } from "@/context/financial-context";

export default function DashboardPage() {
  const { userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Dashboard">
        <div className="flex items-center gap-2">
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary hidden sm:inline">Premium</span>
            </div>
          )}
          {!isPremium && (
            <Link href="/checkout">
              <Button variant="default" size="sm" className="hidden sm:flex">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
          )}
          <Link href="/expenses" passHref className="hidden md:inline-block">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      <UpgradeBanner />

      <div className="w-full min-w-0 max-w-full">
        <DashboardStats />
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-3 w-full min-w-0 max-w-full">
        <div className="lg:col-span-2 min-w-0 w-full max-w-full">
          <OverviewChart />
        </div>
        <div className="lg:col-span-1 min-w-0 w-full max-w-full">
          <RecentTransactions />
        </div>
      </div>

    </div>
  );
}
