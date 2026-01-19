
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { InsightsGenerator } from "@/components/insights/insights-generator";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="AI Financial Insights" />
      <div className="w-full min-w-0 max-w-full">
        <InsightsGenerator />
      </div>
    </div>
  );
}
