"use client"

import { useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFinancials } from "@/context/financial-context"
import { subDays, format, startOfDay } from "date-fns"
import { Loader2 } from "lucide-react"

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function OverviewChart() {
  const { transactions, isLoading } = useFinancials()

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    return last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dateStr = format(dayStart, 'yyyy-MM-dd');
      
      const income = transactions
        .filter(t => t.type === 'income' && format(new Date(t.date), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter(t => t.type === 'expense' && format(new Date(t.date), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: format(day, 'EEE'),
        income,
        expenses
      }
    });
  }, [transactions]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
          <CardDescription>Income vs. Expenses</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 7 Days</CardTitle>
        <CardDescription>Income vs. Expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip cursor={{fill: 'hsl(var(--accent))', radius: 'var(--radius)'}} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" radius={4}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-income)" className="transition-opacity" opacity={1} />
              ))}
            </Bar>
            <Bar dataKey="expenses" radius={4}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--color-expenses)" className="transition-opacity" opacity={1} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
