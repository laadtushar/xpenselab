
"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { IncomeTable } from "@/components/income/income-table";
import { IncomeForm } from "@/components/income/income-form";
import { useFinancials } from "@/context/financial-context";
import { TransactionFilters } from "@/components/shared/transaction-filters";
import type { Income } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

type SortDescriptor = {
  column: 'description' | 'amount' | 'date';
  direction: 'ascending' | 'descending';
};

export default function IncomePage() {
  const { incomes, isLoading } = useFinancials();
  const [filters, setFilters] = useState({});
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'date', direction: 'descending' });
  const filteredIncomes = useMemo(() => {
    let filtered = [...incomes];

    // @ts-ignore
    if (filters.search) {
        // @ts-ignore
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(i => {
        // Handle encrypted/decrypted descriptions safely
        const description = i.description || '';
        return typeof description === 'string' && description.toLowerCase().includes(searchLower);
      });
    }
    // @ts-ignore
    if (filters.category) {
        // @ts-ignore
      filtered = filtered.filter(i => i.category === filters.category);
    }
    // @ts-ignore
    if (filters.dateRange?.from && filters.dateRange?.to) {
      filtered = filtered.filter(i => {
        const date = new Date(i.date);
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
  }, [incomes, filters, sortDescriptor]);

  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Income">
        <div className="hidden md:block">
          <IncomeForm />
        </div>
      </DashboardHeader>

      <Card className="w-full min-w-0 max-w-full">
        <CardHeader>
          <CardTitle>Income History</CardTitle>
          <CardDescription>View, filter, and manage your income.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 w-full min-w-0 max-w-full">
          <TransactionFilters onFilterChange={setFilters} type="income" />
            {isLoading ? (
                <TableSkeleton rows={5} />
            ) : filteredIncomes.length === 0 && incomes.length > 0 ? (
                <EmptyState
                  icon={<DollarSign className="h-12 w-12" />}
                  title="No matching income records"
                  description="Try adjusting your filters to see more results."
                />
            ) : filteredIncomes.length === 0 ? (
                <EmptyState
                  icon={<DollarSign className="h-12 w-12" />}
                  title="No income recorded yet"
                  description="Start tracking your income by adding your first income entry."
                />
            ) : (
                <IncomeTable incomes={filteredIncomes} onSortChange={setSortDescriptor} sortDescriptor={sortDescriptor} />
            )}
        </CardContent>
      </Card>

    </div>
  );
}
