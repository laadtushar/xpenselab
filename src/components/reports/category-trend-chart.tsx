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
import { differenceInDays, format, startOfDay, startOfMonth, startOfWeek, startOfYear, addDays, addMonths, addWeeks, addYears, isSameDay, isSameMonth, isSameWeek, isSameYear, min, max } from "date-fns"
import { Transaction, TimeGrain } from "@/lib/types"

interface CategoryTrendChartProps {
    transactions: Transaction[]
    isLoading?: boolean
    timeGrain?: TimeGrain
}

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))",
]

export function CategoryTrendChart({ transactions, isLoading, timeGrain }: CategoryTrendChartProps) {

    const chartDataResult = useMemo(() => {
        if (transactions.length === 0) return { data: [], config: {}, topCategories: [] };

        // 1. Identify Top 5 Categories overall for the period
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryTotals = new Map<string, number>();
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + t.amount);
        });

        const topCategories = Array.from(categoryTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);

        // 2. Determine Time Buckets
        const dates = transactions.map(t => new Date(t.date));
        const minDate = min(dates);
        const maxDate = max(dates);

        let grain = timeGrain;
        if (!grain) {
            const diffDays = differenceInDays(maxDate, minDate);
            grain = diffDays <= 35 ? 'day' : 'month';
        }

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

        // 3. Build Data Points
        const buckets: any[] = [];
        let current = getStart(minDate);
        const end = getStart(maxDate);

        while (current <= end) {
            const bucket: any = {
                date: current,
                label: getLabel(current),
                Other: 0
            };
            // Initialize top categories to 0
            topCategories.forEach(cat => bucket[cat] = 0);

            buckets.push(bucket);
            current = addInterval(current, 1);
        }

        // 4. Fill Data
        expenses.forEach(t => {
            const tDate = new Date(t.date);
            const bucket = buckets.find(b => isSame(new Date(b.date), tDate));
            if (bucket) {
                const cat = t.category || 'Uncategorized';
                if (topCategories.includes(cat)) {
                    bucket[cat] += t.amount;
                } else {
                    bucket.Other += t.amount;
                }
            }
        });

        // 5. Generate Config
        const config: ChartConfig = {};
        topCategories.forEach((cat, index) => {
            config[cat] = {
                label: cat,
                color: COLORS[index % COLORS.length]
            };
        });
        config['Other'] = {
            label: 'Other',
            color: COLORS[5]
        };

        return { data: buckets, config, topCategories };

    }, [transactions, timeGrain]);

    const { data, config, topCategories } = chartDataResult;

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
                    <CardTitle>Category Trends</CardTitle>
                    <CardDescription>Top Categories Over Time</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground text-sm">No expenses found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Trends</CardTitle>
                <CardDescription>
                    Top Categories Over Time
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full min-w-0 max-w-full overflow-x-auto">
                <ChartContainer config={config} className="h-[300px] w-full min-w-[300px]">
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
                        {topCategories?.map((cat) => (
                            <Bar key={cat} dataKey={cat} stackId="a" fill={`var(--color-${cat})`} radius={[0, 0, 4, 4]} />
                        ))}
                        <Bar dataKey="Other" stackId="a" fill="var(--color-Other)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
