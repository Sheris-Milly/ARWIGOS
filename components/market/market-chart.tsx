"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface MarketChartProps {
  data: any
  period: string
  isLoading: boolean
}

export function MarketChart({ data, period, isLoading }: MarketChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data || !data.data || !data.data.time_series) {
    return <div className="h-[400px] flex items-center justify-center">No chart data available</div>
  }

  const { time_series } = data.data

  // Format the data for the chart
  const chartData = time_series.map((point: any) => {
    const date = new Date(point.datetime)

    // Format the date based on the period
    let formattedDate
    if (period === "1D") {
      formattedDate = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (period === "5D") {
      formattedDate = `${date.toLocaleDateString([], { weekday: "short" })} ${date.toLocaleTimeString([], { hour: "2-digit" })}`
    } else if (period === "1M" || period === "3M") {
      formattedDate = date.toLocaleDateString([], { month: "short", day: "numeric" })
    } else {
      formattedDate = date.toLocaleDateString([], { month: "short", year: "2-digit" })
    }

    return {
      date: formattedDate,
      price: point.close,
      volume: point.volume,
    }
  })

  // Determine if the trend is positive or negative
  const isPositive = data.data.change >= 0
  const lineColor = isPositive ? "#16a34a" : "#dc2626"

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(value) => value} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
