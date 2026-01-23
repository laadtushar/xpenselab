"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-2))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const mockData = [
  { name: "Mon", income: 0, expenses: 45 },
  { name: "Tue", income: 0, expenses: 120 },
  { name: "Wed", income: 2500, expenses: 85 },
  { name: "Thu", income: 0, expenses: 200 },
  { name: "Fri", income: 0, expenses: 150 },
  { name: "Sat", income: 0, expenses: 90 },
  { name: "Sun", income: 0, expenses: 60 },
]

export function DashboardPreview() {
  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid gap-2 grid-cols-3">
        <Card className="border">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">$2,500</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Net: $2,500</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">$750</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Net: $750</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Savings</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-green-600">$1,750</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs">Last 7 Days</CardTitle>
          <CardDescription className="text-[10px]">Income vs. Expenses</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart data={mockData}>
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={4}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                style={{ fontSize: '10px' }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(value) => `$${value}`}
                style={{ fontSize: '10px' }}
              />
              <ChartTooltip cursor={{fill: 'hsl(var(--accent))', radius: 'var(--radius)'}} content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" radius={4} fill="var(--color-income)" />
              <Bar dataKey="expenses" radius={4} fill="var(--color-expenses)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
