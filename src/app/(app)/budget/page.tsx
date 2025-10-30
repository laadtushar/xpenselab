"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { BudgetForm } from "@/components/budget/budget-form";
import { BudgetTracker } from "@/components/budget/budget-tracker";
import { AiBudgetAssistant } from "@/components/budget/ai-budget-assistant";

export default function BudgetPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Budget" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BudgetForm />
        </div>
        <div className="lg:col-span-2">
          <BudgetTracker />
        </div>
      </div>
      <AiBudgetAssistant />
    </div>
  );
}
