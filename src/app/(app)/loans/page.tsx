
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { LoanList } from "@/components/loans/loan-list";
import { AddLoanDialog } from "@/components/loans/add-loan-form";

export default function LoansPage() {
  return (
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
  );
}
