"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, DollarSign, Percent } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

interface PortfolioStatsProps {
  stocks: any[]
}

export function PortfolioStats({ stocks }: PortfolioStatsProps) {
  // Calculate portfolio statistics
  const totalValue = stocks.reduce((sum, stock) => sum + stock.value, 0)
  const totalGain = stocks.reduce((sum, stock) => sum + stock.gain, 0)
  const totalInvested = totalValue - totalGain
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  // Count stocks with positive and negative gains
  const gainers = stocks.filter((stock) => stock.gain > 0).length
  const losers = stocks.filter((stock) => stock.gain < 0).length

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">{stocks.length} stocks in portfolio</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          {totalGain >= 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalGain)}
          </div>
          <p className="text-xs text-muted-foreground">{formatPercentage(totalGainPercent / 100)} from cost basis</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {gainers} ↑ {losers} ↓
          </div>
          <p className="text-xs text-muted-foreground">
            {gainers} gainers, {losers} losers
          </p>
        </CardContent>
      </Card>
    </>
  )
}
