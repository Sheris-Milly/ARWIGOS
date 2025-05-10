"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { fetchTrendingStocks, StockData } from "@/lib/api/trending-stocks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface TopPerformersProps {
  isLoading?: boolean
  className?: string
  showHeader?: boolean
}

export function TopPerformers({ 
  isLoading = false, 
  className = "",
  showHeader = true
}: TopPerformersProps) {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const loadTrendingStocks = async () => {
    try {
      setError(null)
      setRefreshing(true)
      const data = await fetchTrendingStocks()
      setStocks(data)
    } catch (error) {
      console.error("Error loading trending stocks:", error)
      setError("Failed to load trending stocks. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTrendingStocks()
  }, [])

  // Display loading state if either parent says we're loading OR if we're fetching data
  if (isLoading || loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
        )}
        <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
        </CardContent>
      </Card>
    )
  }

  // Display error state if there's an error
  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 w-full"
            onClick={loadTrendingStocks}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Display empty state if no stocks are available
  if (stocks.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">No trending stocks available</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={loadTrendingStocks}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Top Performers</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={loadTrendingStocks}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
      )}
      <CardContent>
    <div className="space-y-3">
          {stocks.map((stock, index) => {
            const isPositive = stock.change >= 0
            
            return (
        <motion.div
          key={stock.symbol}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
        >
          <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {stock.symbol.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-xs text-zinc-400">{stock.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(stock.price)}</div>
                  <div className={`flex items-center text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? (
              <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {formatPercentage(Math.abs(stock.changePercent) / 100)}
            </div>
          </div>
        </motion.div>
            )
          })}
    </div>
      </CardContent>
    </Card>
  )
}
