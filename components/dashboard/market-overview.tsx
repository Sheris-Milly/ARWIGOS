"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { motion } from "framer-motion"

interface MarketOverviewProps {
  data: any
  isLoading: boolean
}

export function MarketOverview({ data, isLoading }: MarketOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (!data || !data.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
        <h3 className="text-xl font-semibold text-red-500">Failed to load market data</h3>
        <p className="mt-2 text-sm text-zinc-400">Using fallback data. Please try again later.</p>
      </div>
    )
  }

  // Market indices data (in a real app, this would come from the API)
  const indices = [
    {
      name: "S&P 500",
      value: 5123.45,
      change: 1.23,
      data: generateMockChartData(1.23),
    },
    {
      name: "Nasdaq",
      value: 16234.56,
      change: 1.56,
      data: generateMockChartData(1.56),
    },
    {
      name: "Dow Jones",
      value: 38765.43,
      change: 0.87,
      data: generateMockChartData(0.87),
    },
    {
      name: "Russell 2000",
      value: 2012.34,
      change: -0.45,
      data: generateMockChartData(-0.45),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {indices.map((index, i) => (
        <motion.div
          key={index.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{index.name}</div>
            {index.change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-lg font-bold">{formatCurrency(index.value)}</div>
            <div className={index.change >= 0 ? "text-emerald-500" : "text-red-500"}>
              {index.change >= 0 ? "+" : ""}
              {formatPercentage(index.change / 100)}
            </div>
          </div>
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={index.data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={index.change >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Helper function to generate mock chart data
function generateMockChartData(trend: number) {
  const data = []
  let value = 100

  for (let i = 0; i < 20; i++) {
    // Generate random change with bias based on trend
    const change = Math.random() * 2 - 1 + trend / 10
    value = value * (1 + change / 100)

    data.push({
      time: i,
      value,
    })
  }

  return data
}
