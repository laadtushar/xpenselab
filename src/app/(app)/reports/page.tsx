"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ReportGenerator } from "@/components/reports/report-generator";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Reports" />
      <ReportGenerator />
    </div>
  );
}
