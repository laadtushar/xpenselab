"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Transaction } from "@/lib/types"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface SavingsRateCardProps {
    transactions: Transaction[]
    isLoading?: boolean
}

export function SavingsRateCard({ transactions, isLoading }: SavingsRateCardProps) {

    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const savings = income - expenses;
        const rate = income > 0 ? (savings / income) * 100 : 0;

        return {
            income,
            expenses,
            savings,
            rate
        };
    }, [transactions]);

    if (isLoading) {
        return (
            <div className="h-full min-h-[150px] w-full border rounded-lg animate-pulse bg-muted/20" />
        )
    }

    const isPositive = stats.savings >= 0;

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Savings Rate
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                    {stats.rate.toFixed(1)}%
                    {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {isPositive ? "Saved" : "Overspent"} <span className={isPositive ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
                        ${Math.abs(stats.savings).toLocaleString()}
                    </span> this period
                </p>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>0%</span>
                        <span>Target: 20%</span>
                        <span>50%</span>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, stats.rate))} className={isPositive ? "bg-emerald-100" : "bg-rose-100"} indicatorClassName={isPositive ? "bg-emerald-500" : "bg-rose-500"} />
                </div>
            </CardContent>
        </Card>
    )
}
