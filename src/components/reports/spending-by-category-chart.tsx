"use client"

import { useMemo } from "react"
import { Pie, PieChart, Label, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { useFinancials } from "@/context/financial-context"
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { Loader2 } from "lucide-react"

// Generate a color palette for categories
// You might want to move this to a utility or constant file
const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))", // For others
]

export function SpendingByCategoryChart() {
    const { expenses, isLoading } = useFinancials()

    const data = useMemo(() => {
        // Current month filter by default, or maybe all time? 
        // Let's do current month for now as it's most relevant for "Spending"
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        const currentMonthExpenses = expenses.filter(t =>
            isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
        );

        const categoryMap = new Map<string, number>();

        currentMonthExpenses.forEach(expense => {
            const category = expense.category || "Uncategorized";
            const current = categoryMap.get(category) || 0;
            categoryMap.set(category, current + Number(expense.amount));
        });

        const sortedCategories = Array.from(categoryMap.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        // Keep top 5, group rest as "Other"
        if (sortedCategories.length > 5) {
            const top5 = sortedCategories.slice(0, 5);
            const otherAmount = sortedCategories.slice(5).reduce((sum, item) => sum + item.amount, 0);
            return [
                ...top5,
                { category: "Other", amount: otherAmount }
            ];
        }

        return sortedCategories;
    }, [expenses]);

    const totalSpending = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.amount, 0);
    }, [data]);

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            amount: { label: "Amount" },
        };
        data.forEach((item, index) => {
            config[item.category] = {
                label: item.category,
                color: COLORS[index % COLORS.length]
            }
        })
        return config;
    }, [data])


    if (isLoading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Current Month</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Current Month</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[250px]">
                    <p className="text-muted-foreground text-sm">No expenses this month</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Current Month</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={data}
                            dataKey="amount"
                            nameKey="category"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalSpending.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Total
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
