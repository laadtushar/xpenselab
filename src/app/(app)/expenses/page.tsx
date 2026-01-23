
"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useFinancials } from "@/context/financial-context";
import { TransactionFilters } from "@/components/shared/transaction-filters";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Receipt, PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";

type SortDescriptor = {
  column: 'description' | 'amount' | 'date';
  direction: 'ascending' | 'descending';
};

export default function ExpensesPage() {
  const { expenses, isLoading } = useFinancials();
  const [filters, setFilters] = useState({});
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'date', direction: 'descending' });

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    
    // @ts-ignore
    if (filters.search) {
        // @ts-ignore
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e => {
        // Handle encrypted/decrypted descriptions safely
        const description = e.description || '';
        return typeof description === 'string' && description.toLowerCase().includes(searchLower);
      });
    }
    // @ts-ignore
    if (filters.category) {
        // @ts-ignore
      filtered = filtered.filter(e => e.category === filters.category);
    }
    // @ts-ignore
    if (filters.dateRange?.from && filters.dateRange?.to) {
      filtered = filtered.filter(e => {
        const date = new Date(e.date);
        // @ts-ignore
        return date >= filters.dateRange.from && date <= filters.dateRange.to;
      });
    }

    filtered.sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];
      
      let cmp = 0;
      if (aValue > bValue) cmp = 1;
      if (aValue < bValue) cmp = -1;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });

    return filtered;
  }, [expenses, filters, sortDescriptor]);

  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Expenses">
        <div className="hidden md:block">
          <ExpenseForm />
        </div>
      </DashboardHeader>

      <Card className="w-full min-w-0 max-w-full">
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>View, filter, and manage your expenses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 w-full min-w-0 max-w-full">
            <TransactionFilters onFilterChange={setFilters} type="expense" />
            {isLoading ? (
                <TableSkeleton rows={5} />
            ) : filteredExpenses.length === 0 && expenses.length > 0 ? (
                <EmptyState
                  icon={<Receipt className="h-12 w-12" />}
                  title="No matching expenses"
                  description="Try adjusting your filters to see more results."
                />
            ) : filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="h-12 w-12" />}
                  title="No expenses yet"
                  description="Start tracking your expenses by adding your first expense."
                />
            ) : (
                <ExpensesTable expenses={filteredExpenses} onSortChange={setSortDescriptor} sortDescriptor={sortDescriptor} />
            )}
        </CardContent>
      </Card>

    </div>
  );
}
