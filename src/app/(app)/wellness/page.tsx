
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { FinancialWellness } from "@/components/wellness/financial-wellness";

export default function WellnessPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        title="Financial Wellness"
      />
      <FinancialWellness />
    </div>
  );
}
