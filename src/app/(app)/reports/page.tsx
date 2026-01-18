"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ReportGenerator } from "@/components/reports/report-generator";
import { SpendingByCategoryChart } from "@/components/reports/spending-by-category-chart";
import { MonthlyTrendsChart } from "@/components/reports/monthly-trends-chart";
import { IncomeVsExpenseChart } from "@/components/reports/income-vs-expense-chart";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Reports" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeVsExpenseChart />
        </div>
        <div className="lg:col-span-1">
          <SpendingByCategoryChart />
        </div>
      </div>

      <div className="grid gap-8">
        <MonthlyTrendsChart />
      </div>

      <ReportGenerator />
    </div>
  );
}
