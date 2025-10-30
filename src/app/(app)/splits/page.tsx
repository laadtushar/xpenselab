'use client';

import { DashboardHeader } from '@/components/shared/dashboard-header';

export default function SplitsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Expense Splits" />
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Coming Soon!</h2>
        <p className="text-muted-foreground mt-2">
          This is where you'll be able to manage your shared expenses and splits.
        </p>
      </div>
    </div>
  );
}
