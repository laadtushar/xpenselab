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
import { useFinancials } from "@/context/financial-context"
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { Loader2 } from "lucide-react"

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

export function MonthlyTrendsChart() {
    const { transactions, isLoading } = useFinancials()

    const data = useMemo(() => {
        // Last 6 months
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();

        return months.map(date => {
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthKey = format(date, "MMM yyyy");

            const monthlyTransactions = transactions.filter(t =>
                isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
            );

            const income = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const expenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                month: monthKey,
                income,
                expenses
            }
        });

    }, [transactions]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Financial Trends</CardTitle>
                    <CardDescription>Income vs Expenses - Last 6 Months</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
                <CardDescription>
                    Income vs Expenses - Last 6 Months
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
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
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
                            type="natural"
                            fill="var(--color-expenses)"
                            fillOpacity={0.4}
                            stroke="var(--color-expenses)"
                            stackId="a"
                        />
                        <Area
                            dataKey="income"
                            type="natural"
                            fill="var(--color-income)"
                            fillOpacity={0.4}
                            stroke="var(--color-income)"
                            stackId="b"
                        />
                        {/* Note: I'm not stacking them (stackId is different) to compare them overlayed, or same ID if I want them stacked. 
                Usually for Income vs Expense, overlay (separate stackIds or no stackId) is better to see net.
                Let's use different stackIds 'a' and 'b' so they don't stack on top of each other.
            */}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
