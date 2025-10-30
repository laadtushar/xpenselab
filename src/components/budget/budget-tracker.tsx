"use client";

import { useMemo } from "react";
import { useFinancials } from "@/context/financial-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { expenseCategories } from "@/lib/types";
import { CategoryIcon } from "@/components/icons/category-icon";
import { Loader2 } from "lucide-react";

export function BudgetTracker() {
  const { expenses, budget, isLoading } = useFinancials();

  const { totalExpenses, expensesByCategory, percentage } = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = expenseCategories.map(category => {
      const amount = expenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { category, amount };
    }).filter(c => c.amount > 0)
    .sort((a,b) => b.amount - a.amount);

    const percentage = budget ? Math.min((totalExpenses / budget.amount) * 100, 100) : 0;

    return { totalExpenses, expensesByCategory, percentage };
  }, [expenses, budget]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
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
          You've spent {formatCurrency(totalExpenses)} of your {formatCurrency(budget.amount)} budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} />
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Top Spending Categories</h3>
          {expensesByCategory.length > 0 ? expensesByCategory.slice(0, 5).map(({ category, amount }) => (
            <div key={category} className="flex items-center">
              <CategoryIcon category={category} className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">{category}</span>
              <span className="ml-auto text-sm font-medium">{formatCurrency(amount)}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No expenses yet for this month.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
