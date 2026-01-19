
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { LoanList } from "@/components/loans/loan-list";
import { AddLoanDialog } from "@/components/loans/add-loan-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

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

      {/* Mobile Quick Add FAB - positioned above bottom nav */}
      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <AddLoanDialog
          trigger={
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <PlusCircle className="h-6 w-6" />
              <span className="sr-only">Add Loan</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}
