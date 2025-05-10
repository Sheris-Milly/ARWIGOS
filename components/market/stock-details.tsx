"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { fetchStockData } from "@/lib/api/yahoo-finance"

interface StockDetailsProps {
  symbol: string
  period: string
  data: any
  isLoading: boolean
}

export function StockDetails({ symbol, period, data, isLoading }: StockDetailsProps) {
  const [financials, setFinancials] = useState<any>(null)
  const [financialsLoading, setFinancialsLoading] = useState(true)

  useEffect(() => {
    const loadFinancials = async () => {
      try {
        setFinancialsLoading(true)

        // Check if we have cached data
        const cacheKey = `financials_${symbol}`
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)

        const now = new Date().getTime()
        const cacheDuration = 24 * 60 * 60 * 1000 // 24 hours

        let financialsData

        if (cachedData && cachedTimestamp && now - Number.parseInt(cachedTimestamp) < cacheDuration) {
          financialsData = JSON.parse(cachedData)
        } else {
          // In a real app, this would be a separate API call
          // For demo purposes, we'll simulate it
          financialsData = await simulateFinancialsData(symbol)

          localStorage.setItem(cacheKey, JSON.stringify(financialsData))
          localStorage.setItem(`${cacheKey}_timestamp`, now.toString())
        }

        setFinancials(financialsData)
      } catch (error) {
        console.error("Error loading financials:", error)
      } finally {
        setFinancialsLoading(false)
      }
    }

    loadFinancials()
  }, [symbol])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  if (!data || !data.data) {
    return <div className="text-center py-4">No stock data available</div>
  }

  const { price, change, change_percent, day_high, day_low, volume, previous_close, time_series } = data.data

  const isPositive = change >= 0

  // Format the data for the chart
  const chartData =
    time_series?.map((point: any) => {
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
    }) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Historical price data for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{formatCurrency(price)}</div>
              <div className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                <span>{formatCurrency(Math.abs(change))}</span>
                <span className="ml-1">({formatPercentage(Math.abs(change_percent / 100))})</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{period} Chart</div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#16a34a" : "#dc2626"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>Trading volume over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `${value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}K`}`
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    value >= 1000000 ? `${(value / 1000000).toFixed(2)}M` : `${(value / 1000).toFixed(0)}K`,
                    "Volume",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Statistics</CardTitle>
            <CardDescription>Financial metrics for {symbol}</CardDescription>
          </CardHeader>
          <CardContent>
            {financialsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : financials ? (
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Market Cap</TableCell>
                    <TableCell>{formatCurrency(financials.marketCap)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">P/E Ratio</TableCell>
                    <TableCell>{financials.peRatio.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">EPS (TTM)</TableCell>
                    <TableCell>{formatCurrency(financials.eps)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Dividend Yield</TableCell>
                    <TableCell>{formatPercentage(financials.dividendYield / 100)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">52-Week High</TableCell>
                    <TableCell>{formatCurrency(financials.yearHigh)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">52-Week Low</TableCell>
                    <TableCell>{formatCurrency(financials.yearLow)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Beta</TableCell>
                    <TableCell>{financials.beta.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Average Volume</TableCell>
                    <TableCell>{(financials.avgVolume / 1000000).toFixed(2)}M</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">No financial data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function to simulate financials data
async function simulateFinancialsData(symbol: string) {
  // In a real app, this would be an API call
  // For demo purposes, we'll generate random data

  // Get base price from stock data
  const stockData = await fetchStockData(symbol)
  const price = stockData?.data?.price || 100

  return {
    marketCap: price * (Math.random() * 900000000 + 100000000),
    peRatio: Math.random() * 30 + 10,
    eps: price / (Math.random() * 15 + 5),
    dividendYield: Math.random() * 3,
    yearHigh: price * (1 + Math.random() * 0.3),
    yearLow: price * (1 - Math.random() * 0.3),
    beta: Math.random() * 1.5 + 0.5,
    avgVolume: Math.random() * 9000000 + 1000000,
  }
}
