"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Expenses">
        <ExpenseForm />
      </DashboardHeader>
      
      <ExpensesTable />
    </div>
  );
}
