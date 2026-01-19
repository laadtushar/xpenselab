
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { RecurringTransactionList } from "@/components/recurring/recurring-list";
import { AddRecurringTransactionDialog } from "@/components/recurring/recurring-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useRouter } from "next/navigation";

export default function RecurringPage() {
  const router = useRouter();

  const handleRefresh = async () => {
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
        <DashboardHeader title="Recurring Transactions">
          <div className="hidden md:block">
            <AddRecurringTransactionDialog />
          </div>
        </DashboardHeader>
        <div className="w-full min-w-0 max-w-full">
          <RecurringTransactionList />
        </div>

        {/* Mobile Quick Add FAB - positioned above bottom nav */}
        <div className="fixed bottom-20 right-4 md:hidden z-40">
          <AddRecurringTransactionDialog
            trigger={
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                <PlusCircle className="h-6 w-6" />
                <span className="sr-only">Add Recurring Transaction</span>
              </Button>
            }
          />
        </div>
      </div>
    </PullToRefresh>
  );
}
