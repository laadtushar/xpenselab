
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ForecastGenerator } from "@/components/forecast/forecast-generator";

export default function ForecastPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader
        title="Predictive Forecast"
      />
      <div className="w-full min-w-0 max-w-full">
        <ForecastGenerator />
      </div>
    </div>
  );
}
