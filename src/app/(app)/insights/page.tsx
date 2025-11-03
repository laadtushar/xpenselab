
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { InsightsGenerator } from "@/components/insights/insights-generator";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="AI Financial Insights" />
      <InsightsGenerator />
    </div>
  );
}
