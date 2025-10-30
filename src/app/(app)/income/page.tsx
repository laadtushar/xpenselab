"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { IncomeTable } from "@/components/income/income-table";
import { IncomeForm } from "@/components/income/income-form";

export default function IncomePage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Income">
        <IncomeForm />
      </DashboardHeader>
      
      <IncomeTable />
    </div>
  );
}
