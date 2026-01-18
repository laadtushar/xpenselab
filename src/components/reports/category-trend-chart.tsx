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

interface CategoryTrendChartProps {
    transactions: Transaction[]
    isLoading?: boolean
}

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))",
]

export function CategoryTrendChart({ transactions, isLoading }: CategoryTrendChartProps) {

    const chartDataResult = useMemo(() => {
        if (transactions.length === 0) return { data: [], config: {} };

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
        const diffDays = differenceInDays(maxDate, minDate);
        const isDaily = diffDays <= 35;

        // 3. Build Data Points
        const buckets: any[] = [];
        let current = isDaily ? startOfDay(minDate) : startOfMonth(minDate);
        const end = isDaily ? startOfDay(maxDate) : startOfMonth(maxDate);

        while (current <= end) {
            const bucket: any = {
                date: current,
                label: format(current, isDaily ? "d MMM" : "MMM yyyy"),
                Other: 0
            };
            // Initialize top categories to 0
            topCategories.forEach(cat => bucket[cat] = 0);

            buckets.push(bucket);
            current = isDaily ? addDays(current, 1) : addMonths(current, 1);
        }

        // 4. Fill Data
        expenses.forEach(t => {
            const tDate = new Date(t.date);
            const bucket = buckets.find(b =>
                isDaily ? isSameDay(new Date(b.date), tDate) : isSameMonth(new Date(b.date), tDate)
            );
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

    }, [transactions]);

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
            <CardContent>
                <ChartContainer config={config} className="h-[300px] w-full">
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
