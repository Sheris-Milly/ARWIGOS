"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface PerformanceProps {
  stocks: any[]
}

export function PortfolioPerformance({ stocks }: PerformanceProps) {
  const [period, setPeriod] = useState("1M")

  // Generate historical performance data
  const performanceData = generatePerformanceData(period)

  // Generate stock comparison data
  const comparisonData = generateComparisonData(stocks, period)

  // Generate sector allocation data
  const sectorData = generateSectorData(stocks)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Historical performance of your investments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1M" onValueChange={setPeriod} value={period}>
            <TabsList className="mb-4">
              <TabsTrigger value="1M">1 Month</TabsTrigger>
              <TabsTrigger value="3M">3 Months</TabsTrigger>
              <TabsTrigger value="6M">6 Months</TabsTrigger>
              <TabsTrigger value="1Y">1 Year</TabsTrigger>
              <TabsTrigger value="MAX">All Time</TabsTrigger>
            </TabsList>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Value"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Portfolio Value"
                    stroke="#3b82f6"
                    fill="rgba(59, 130, 246, 0.1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    name="S&P 500"
                    stroke="#10b981"
                    fill="rgba(16, 185, 129, 0.1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Performance Comparison</CardTitle>
            <CardDescription>Individual stock performance over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Return"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {stocks.map((stock, index) => (
                  <Line
                    key={stock.symbol}
                    type="monotone"
                    dataKey={stock.symbol}
                    name={stock.symbol}
                    stroke={getColor(index)}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>Distribution across market sectors</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Allocation"]} />
                <Legend />
                <Bar dataKey="value" name="Allocation" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Generate a color based on index
function getColor(index: number) {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
  ]
  return colors[index % colors.length]
}

// Generate historical performance data
function generatePerformanceData(period: string) {
  const data = []
  const now = new Date()
  const startDate = new Date()
  let dataPoints = 30

  // Set start date based on period
  switch (period) {
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1)
      dataPoints = 30
      break
    case "3M":
      startDate.setMonth(startDate.getMonth() - 3)
      dataPoints = 90
      break
    case "6M":
      startDate.setMonth(startDate.getMonth() - 6)
      dataPoints = 180
      break
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1)
      dataPoints = 365
      break
    case "MAX":
      startDate.setFullYear(startDate.getFullYear() - 5)
      dataPoints = 60 // Monthly data points for 5 years
      break
  }

  // Generate data points
  const interval = (now.getTime() - startDate.getTime()) / dataPoints
  let portfolioValue = 20000 // Starting value
  let benchmarkValue = 20000 // Starting value for benchmark

  for (let i = 0; i <= dataPoints; i++) {
    const date = new Date(startDate.getTime() + i * interval)

    // Generate random changes with slight upward bias
    const portfolioChange = Math.random() * 0.04 - 0.015 // -1.5% to +2.5%
    const benchmarkChange = Math.random() * 0.03 - 0.01 // -1% to +2%

    portfolioValue = portfolioValue * (1 + portfolioChange)
    benchmarkValue = benchmarkValue * (1 + benchmarkChange)

    // Format date based on period
    let formattedDate
    if (period === "MAX") {
      formattedDate = date.toLocaleDateString("en-US", { year: "2-digit", month: "short" })
    } else if (period === "1Y") {
      formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else {
      formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    data.push({
      date: formattedDate,
      value: Math.round(portfolioValue),
      benchmark: Math.round(benchmarkValue),
    })
  }

  return data
}

// Generate stock comparison data
function generateComparisonData(stocks: any[], period: string) {
  const data = []
  const now = new Date()
  const startDate = new Date()
  let dataPoints = 30

  // Set start date based on period
  switch (period) {
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1)
      dataPoints = 30
      break
    case "3M":
      startDate.setMonth(startDate.getMonth() - 3)
      dataPoints = 90
      break
    case "6M":
      startDate.setMonth(startDate.getMonth() - 6)
      dataPoints = 180
      break
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1)
      dataPoints = 365
      break
    case "MAX":
      startDate.setFullYear(startDate.getFullYear() - 5)
      dataPoints = 60 // Monthly data points for 5 years
      break
  }

  // Generate data points
  const interval = (now.getTime() - startDate.getTime()) / dataPoints

  // Initialize stock values
  const stockValues: Record<string, number> = {}
  stocks.forEach((stock) => {
    stockValues[stock.symbol] = 0 // Start at 0% return
  })

  for (let i = 0; i <= dataPoints; i++) {
    const date = new Date(startDate.getTime() + i * interval)

    // Generate random changes for each stock
    const dataPoint: any = {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }

    stocks.forEach((stock) => {
      // Generate random change with bias based on stock's overall performance
      const bias = stock.gainPercent > 0 ? 0.005 : -0.005
      const change = Math.random() * 0.04 - 0.02 + bias // -1.5% to +2.5% with bias

      stockValues[stock.symbol] += change * 100 // Accumulate percentage change
      dataPoint[stock.symbol] = Number.parseFloat(stockValues[stock.symbol].toFixed(2))
    })

    data.push(dataPoint)
  }

  return data
}

// Generate sector data
function generateSectorData(stocks: any[]) {
  // Map stocks to sectors (in a real app, this would come from the API)
  const sectors = [
    { name: "Technology", value: 45 },
    { name: "Consumer Cyclical", value: 20 },
    { name: "Healthcare", value: 15 },
    { name: "Financial Services", value: 10 },
    { name: "Communication", value: 5 },
    { name: "Energy", value: 3 },
    { name: "Utilities", value: 2 },
  ]

  return sectors
}
