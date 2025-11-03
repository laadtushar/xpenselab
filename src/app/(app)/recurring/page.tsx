
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { RecurringTransactionList } from "@/components/recurring/recurring-list";
import { AddRecurringTransactionDialog } from "@/components/recurring/recurring-form";

export default function RecurringPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Recurring Transactions">
        <AddRecurringTransactionDialog />
      </DashboardHeader>
      <RecurringTransactionList />
    </div>
  );
}
