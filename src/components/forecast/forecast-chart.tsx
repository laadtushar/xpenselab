
"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useFinancials } from "@/context/financial-context";
import { format } from "date-fns";

interface ForecastChartProps {
  data: { date: string; balance: number }[];
}

const chartConfig = {
  balance: {
    label: "Projected Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ForecastChart({ data }: ForecastChartProps) {
  const { userData } = useFinancials();

  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: format(new Date(item.date), "MMM dd"),
    }));
  }, [data]);

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <AreaChart
        accessibilityLayer
        data={formattedData}
        margin={{ left: 12, right: 12, top: 10 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: userData?.currency || 'USD',
              notation: 'compact'
            }).format(value as number)
          }
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <defs>
            <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.1} />
            </linearGradient>
        </defs>
        <Area
          dataKey="balance"
          type="natural"
          fill="url(#fillBalance)"
          stroke="var(--color-balance)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
