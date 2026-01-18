"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { differenceInDays, format, startOfDay, startOfMonth, addDays, addMonths, isSameDay, isSameMonth, min, max, parseISO } from "date-fns"
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

interface FinancialTrendsChartProps {
    transactions: Transaction[]
    isLoading?: boolean
}

export function FinancialTrendsChart({ transactions, isLoading }: FinancialTrendsChartProps) {

    const data = useMemo(() => {
        if (transactions.length === 0) return [];

        // 1. Determine Date Range from filtered transactions
        const dates = transactions.map(t => new Date(t.date));
        const minDate = min(dates);
        const maxDate = max(dates);
        const diffDays = differenceInDays(maxDate, minDate);

        // 2. Decide Granularity
        const isDaily = diffDays <= 35; // Show daily if less than ~1 month selected

        // 3. Create Time Buckets
        const buckets: { date: Date, label: string, income: number, expenses: number }[] = [];

        let current = isDaily ? startOfDay(minDate) : startOfMonth(minDate);
        const end = isDaily ? startOfDay(maxDate) : startOfMonth(maxDate);

        // Generate all slots between min and max to ensure continuous line
        while (current <= end) {
            buckets.push({
                date: current,
                label: format(current, isDaily ? "d MMM" : "MMM yyyy"),
                income: 0,
                expenses: 0
            });
            current = isDaily ? addDays(current, 1) : addMonths(current, 1);
        }

        // 4. Aggregate Data
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
                <p className="text-sm text-muted-foreground animate-pulse">Loading trends...</p>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Financial Trends</CardTitle>
                    <CardDescription>Income vs Expenses</CardDescription>
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
                <CardTitle>Financial Trends</CardTitle>
                <CardDescription>
                    Income vs Expenses
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Area
                            dataKey="expenses"
                            type="monotone"
                            fill="var(--color-expenses)"
                            fillOpacity={0.4}
                            stroke="var(--color-expenses)"
                            stackId="a"
                        />
                        <Area
                            dataKey="income"
                            type="monotone"
                            fill="var(--color-income)"
                            fillOpacity={0.4}
                            stroke="var(--color-income)"
                            stackId="b"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
