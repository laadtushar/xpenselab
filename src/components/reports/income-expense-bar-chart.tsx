"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { differenceInDays, format, startOfDay, startOfMonth, addDays, addMonths, isSameDay, isSameMonth, min, max } from "date-fns"
import { Transaction } from "@/lib/types"

const chartConfig = {
    income: {
        label: "Income",
        color: "hsl(var(--chart-2))",
    },
    expenses: {
        label: "Expenses",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

interface IncomeExpenseBarChartProps {
    transactions: Transaction[]
    isLoading?: boolean
}

export function IncomeExpenseBarChart({ transactions, isLoading }: IncomeExpenseBarChartProps) {

    const data = useMemo(() => {
        if (transactions.length === 0) return [];

        const dates = transactions.map(t => new Date(t.date));
        const minDate = min(dates);
        const maxDate = max(dates);
        const diffDays = differenceInDays(maxDate, minDate);
        const isDaily = diffDays <= 35;

        const buckets: { date: Date, label: string, income: number, expenses: number }[] = [];

        let current = isDaily ? startOfDay(minDate) : startOfMonth(minDate);
        const end = isDaily ? startOfDay(maxDate) : startOfMonth(maxDate);

        while (current <= end) {
            buckets.push({
                date: current,
                label: format(current, isDaily ? "d MMM" : "MMM yyyy"),
                income: 0,
                expenses: 0
            });
            current = isDaily ? addDays(current, 1) : addMonths(current, 1);
        }

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const bucket = buckets.find(b =>
                isDaily ? isSameDay(new Date(b.date), tDate) : isSameMonth(new Date(b.date), tDate)
            );
            if (bucket) {
                if (t.type === 'income') {
                    bucket.income += Number(t.amount);
                } else {
                    bucket.expenses += Number(t.amount);
                }
            }
        });

        return buckets;

    }, [transactions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px] w-full border rounded-lg">
                <p className="text-sm text-muted-foreground animate-pulse">Loading chart...</p>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Income vs Expenses</CardTitle>
                    <CardDescription>Bar Chart Comparison</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground text-sm">No data for selected period</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>
                    Comparison
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
