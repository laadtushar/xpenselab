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
import { differenceInDays, format, startOfDay, startOfMonth, startOfWeek, startOfYear, addDays, addMonths, addWeeks, addYears, isSameDay, isSameMonth, isSameWeek, isSameYear, min, max, parseISO } from "date-fns"
import { Transaction, TimeGrain } from "@/lib/types"

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
    timeGrain?: TimeGrain
}

export function FinancialTrendsChart({ transactions, isLoading, timeGrain }: FinancialTrendsChartProps) {

    const data = useMemo(() => {
        if (transactions.length === 0) return [];

        // 1. Determine Date Range from filtered transactions
        const dates = transactions.map(t => new Date(t.date));
        const minDate = min(dates);
        const maxDate = max(dates);

        // 2. Decide Granularity
        let grain = timeGrain;
        if (!grain) {
            const diffDays = differenceInDays(maxDate, minDate);
            grain = diffDays <= 35 ? 'day' : 'month';
        }

        // Helpers based on grain
        const getStart = (d: Date) => {
            if (grain === 'week') return startOfWeek(d, { weekStartsOn: 1 });
            if (grain === 'month') return startOfMonth(d);
            if (grain === 'year') return startOfYear(d);
            return startOfDay(d);
        };

        const addInterval = (d: Date, n: number) => {
            if (grain === 'week') return addWeeks(d, n);
            if (grain === 'month') return addMonths(d, n);
            if (grain === 'year') return addYears(d, n);
            return addDays(d, n);
        };

        const isSame = (d1: Date, d2: Date) => {
            if (grain === 'week') return isSameWeek(d1, d2, { weekStartsOn: 1 });
            if (grain === 'month') return isSameMonth(d1, d2);
            if (grain === 'year') return isSameYear(d1, d2);
            return isSameDay(d1, d2);
        };

        const getLabel = (d: Date) => {
            if (grain === 'week') return `W${format(d, 'w')} ${format(d, 'MMM')}`;
            if (grain === 'month') return format(d, 'MMM yyyy');
            if (grain === 'year') return format(d, 'yyyy');
            return format(d, 'd MMM');
        };

        // 3. Create Time Buckets
        const buckets: { date: Date, label: string, income: number, expenses: number }[] = [];

        let current = getStart(minDate);
        const end = getStart(maxDate);

        // Generate all slots between min and max to ensure continuous line
        while (current <= end) {
            buckets.push({
                date: current,
                label: getLabel(current),
                income: 0,
                expenses: 0
            });
            current = addInterval(current, 1);
        }

        // 4. Aggregate Data
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const bucket = buckets.find(b => isSame(new Date(b.date), tDate));
            if (bucket) {
                if (t.type === 'income') {
                    bucket.income += Number(t.amount);
                } else {
                    bucket.expenses += Number(t.amount);
                }
            }
        });

        return buckets;

    }, [transactions, timeGrain]);

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
            <CardContent className="w-full min-w-0 max-w-full overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
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
