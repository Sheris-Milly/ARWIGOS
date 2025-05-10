import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchStockData } from '@/lib/api/stocks'
import { fetchStockChartData } from '@/lib/api/stock-chart'
import StockChart from './stock-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface StockDetailProps {
  symbol: string
}

export default function StockDetail({ symbol }: StockDetailProps) {
  const [stockData, setStockData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [period, setPeriod] = useState('1M')

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true)
      try {
        const data = await fetchStockData(symbol)
        setStockData(data)
      } catch (error) {
        console.error('Error fetching stock data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchStock()
    }
  }, [symbol])

  useEffect(() => {
    const fetchChart = async () => {
      setChartLoading(true)
      try {
        const data = await fetchStockChartData(symbol, period)
        setChartData(data)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setChartLoading(false)
      }
    }

    if (symbol) {
      fetchChart()
    }
  }, [symbol, period])

  const periodOptions = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{stockData?.symbol}</CardTitle>
                <CardDescription className="text-lg">{stockData?.name}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stockData?.price || 0)}</div>
                <div className={`text-sm font-medium ${stockData?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stockData?.change >= 0 ? '+' : ''}{stockData?.change.toFixed(2)} ({stockData?.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="1M" onValueChange={setPeriod}>
          <TabsList className="w-full justify-start mb-4">
            {periodOptions.map((p) => (
              <TabsTrigger key={p} value={p}>{p}</TabsTrigger>
            ))}
          </TabsList>
          {periodOptions.map((p) => (
            <TabsContent key={p} value={p} className="h-[300px]">
              <StockChart 
                data={chartData} 
                symbol={symbol} 
                period={p} 
                isLoading={chartLoading} 
              />
            </TabsContent>
          ))}
        </Tabs>

        <Separator />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="font-medium">{formatCurrency(stockData?.open || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previous Close</p>
              <p className="font-medium">{formatCurrency(stockData?.previousClose || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day High</p>
              <p className="font-medium">{formatCurrency(stockData?.dayHigh || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Day Low</p>
              <p className="font-medium">{formatCurrency(stockData?.dayLow || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">52-Week High</p>
              <p className="font-medium">{formatCurrency(stockData?.yearHigh || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">52-Week Low</p>
              <p className="font-medium">{formatCurrency(stockData?.yearLow || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="font-medium">{formatNumber(stockData?.volume || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Volume</p>
              <p className="font-medium">{formatNumber(stockData?.avgVolume || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="font-medium">{formatCurrency(stockData?.marketCap || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P/E Ratio</p>
              <p className="font-medium">{stockData?.pe?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dividend Yield</p>
              <p className="font-medium">{stockData?.dividendYield ? (stockData.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">EPS</p>
              <p className="font-medium">{stockData?.eps?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 