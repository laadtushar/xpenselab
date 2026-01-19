
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { RecurringTransactionList } from "@/components/recurring/recurring-list";
import { AddRecurringTransactionDialog } from "@/components/recurring/recurring-form";

export default function RecurringPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Recurring Transactions">
        <div className="hidden md:block">
          <AddRecurringTransactionDialog />
        </div>
      </DashboardHeader>
      <div className="w-full min-w-0 max-w-full">
        <RecurringTransactionList />
      </div>
    </div>
  );
}
