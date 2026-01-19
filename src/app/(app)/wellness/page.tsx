
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { FinancialWellness } from "@/components/wellness/financial-wellness";

export default function WellnessPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader
        title="Financial Wellness"
      />
      <div className="w-full min-w-0 max-w-full">
        <FinancialWellness />
      </div>
    </div>
  );
}
