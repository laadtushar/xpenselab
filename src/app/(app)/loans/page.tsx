
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
      
      {/* Mobile Add Button */}
      <div className="md:hidden">
        <AddLoanDialog />
      </div>
      
      <div className="w-full min-w-0 max-w-full">
        <LoanList />
      </div>
    </div>
  );
}
