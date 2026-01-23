"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

const mockBudgets = [
  { category: "Food & Dining", spent: 320, budget: 500, percentage: 64 },
  { category: "Entertainment", spent: 45, budget: 100, percentage: 45 },
  { category: "Transportation", spent: 180, budget: 300, percentage: 60 },
]

export function BudgetPreview() {
  return (
    <div className="border rounded-lg bg-background">
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold">Monthly Budget</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Track your spending</p>
      </div>
      <div className="p-3 space-y-3">
        {mockBudgets.map((budget) => (
          <div key={budget.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{budget.category}</span>
              <span className="text-muted-foreground text-[10px]">
                {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.budget, "USD")}
              </span>
            </div>
            <Progress value={budget.percentage} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{budget.percentage}% used</span>
              <span>{formatCurrency(budget.budget - budget.spent, "USD")} left</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
