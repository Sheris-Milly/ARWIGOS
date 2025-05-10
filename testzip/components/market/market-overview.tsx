"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface MarketOverviewProps {
  data: any
  isLoading: boolean
}

export function MarketOverview({ data, isLoading }: MarketOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (!data || !data.data) {
    return <div className="text-center py-4">No market data available</div>
  }

  const { price, change, change_percent, day_high, day_low, volume, previous_close } = data.data

  const isPositive = change >= 0
  const formattedVolume =
    volume >= 1000000 ? `${(volume / 1000000).toFixed(2)}M` : volume >= 1000 ? `${(volume / 1000).toFixed(2)}K` : volume

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Price</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(price)}</div>
          <div className={`flex items-center mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            <span>{formatCurrency(Math.abs(change))}</span>
            <span className="ml-1">({formatPercentage(Math.abs(change_percent / 100))})</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Previous Close</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(previous_close)}</div>
          <div className="text-sm text-muted-foreground mt-1">Last trading day</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Day Range</div>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(day_low)} - {formatCurrency(day_high)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Today's min/max</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Volume</div>
          <div className="text-2xl font-bold mt-1">{formattedVolume}</div>
          <div className="text-sm text-muted-foreground mt-1">Shares traded today</div>
        </CardContent>
      </Card>
    </div>
  )
}
