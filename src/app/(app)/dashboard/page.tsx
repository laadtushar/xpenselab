"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Dashboard">
        <Link href="/expenses" passHref className="hidden md:inline-block">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </DashboardHeader>

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
