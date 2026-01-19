
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { LoanList } from "@/components/loans/loan-list";
import { AddLoanDialog } from "@/components/loans/add-loan-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useRouter } from "next/navigation";

export default function LoansPage() {
  const router = useRouter();

  const handleRefresh = async () => {
    router.refresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
        <DashboardHeader title="Loans & EMIs">
          <div className="hidden md:block">
            <AddLoanDialog />
          </div>
        </DashboardHeader>
        <div className="w-full min-w-0 max-w-full">
          <LoanList />
        </div>
      </div>
    </PullToRefresh>
  );
}
