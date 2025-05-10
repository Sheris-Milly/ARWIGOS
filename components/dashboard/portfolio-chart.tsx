"use client"

import { useState, useEffect } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PortfolioChartProps {
  isLoading: boolean
  showDetails?: boolean
}

export function PortfolioChart({ isLoading, showDetails = false }: PortfolioChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [period, setPeriod] = useState("1M")
  const [isDataLoading, setIsDataLoading] = useState(true)

  useEffect(() => {
    // Generate or fetch chart data
    const generateData = () => {
      setIsDataLoading(true)

      // In a real app, this would be an API call
      // For demo purposes, we'll generate random data
      const data = []
      const now = new Date()
      const startDate = new Date()
      let dataPoints = 30

      // Set start date based on period
      switch (period) {
        case "1W":
          startDate.setDate(startDate.getDate() - 7)
          dataPoints = 7
          break
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
        case "ALL":
          startDate.setFullYear(startDate.getFullYear() - 5)
          dataPoints = 60 // Monthly data points for 5 years
          break
      }

      // Generate data points
      const interval = (now.getTime() - startDate.getTime()) / dataPoints
      let portfolioValue = 105000 // Starting value
      let benchmarkValue = 105000 // Starting value for benchmark

      for (let i = 0; i <= dataPoints; i++) {
        const date = new Date(startDate.getTime() + i * interval)

        // Generate random changes with slight upward bias
        const portfolioChange = Math.random() * 0.04 - 0.015 // -1.5% to +2.5%
        const benchmarkChange = Math.random() * 0.03 - 0.01 // -1% to +2%

        portfolioValue = portfolioValue * (1 + portfolioChange)
        benchmarkValue = benchmarkValue * (1 + benchmarkChange)

        // Format date based on period
        let formattedDate
        if (period === "ALL") {
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

      // Simulate API delay
      setTimeout(() => {
        setChartData(data)
        setIsDataLoading(false)
      }, 500)
    }

    generateData()
  }, [period])

  if (isLoading || isDataLoading) {
    return <Skeleton className="h-full w-full" />
  }

  return (
    <div className="h-full">
      {showDetails && (
        <Tabs defaultValue="1M" onValueChange={setPeriod} value={period} className="mb-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
            <TabsTrigger value="ALL">ALL</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                tickFormatter={(value) => `$${value / 1000}k`}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Value"]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
              {showDetails && (
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
