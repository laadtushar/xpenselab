
"use client";

import { useMemo } from "react";
import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/icons/category-icon";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function BudgetTracker() {
  const { expenses, budget, isLoading, userData } = useFinancials();

  const { totalExpenses, expensesByCategory, percentage } = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = expenses
        .filter(t => t.category)
        .reduce((acc, t) => {
            const category = t.category!;
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += t.amount;
            return acc;
        }, {} as Record<string, number>);

    const sortedCategories = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);


    const percentage = budget ? Math.min((totalExpenses / budget.amount) * 100, 100) : 0;

    return { totalExpenses, expensesByCategory: sortedCategories, percentage };
  }, [expenses, budget]);
  
  if (isLoading) {
    return (
      <Card>
         <CardHeader>
          <CardTitle>Budget Tracker</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">Set a monthly budget to start tracking your spending.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>
          You've spent {formatCurrency(totalExpenses, userData?.currency)} of your {formatCurrency(budget.amount, userData?.currency)} budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} />
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Top Spending Categories</h3>
          {expensesByCategory.length > 0 ? expensesByCategory.slice(0, 5).map(({ category, amount }) => (
            <div key={category} className="flex items-center">
              <CategoryIcon categoryName={category} className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">{category}</span>
              <span className="ml-auto text-sm font-medium">{formatCurrency(amount, userData?.currency)}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No expenses yet for this month.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
