
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { LoanList } from "@/components/loans/loan-list";
import { AddLoanDialog } from "@/components/loans/add-loan-form";

export default function LoansPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Loans & EMIs">
        <AddLoanDialog />
      </DashboardHeader>
      <LoanList />
    </div>
  );
}
