
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ForecastGenerator } from "@/components/forecast/forecast-generator";

export default function ForecastPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader
        title="Predictive Forecast"
      />
      <ForecastGenerator />
    </div>
  );
}
