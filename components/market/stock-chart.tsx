"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StockChartProps {
  data: Array<{
    timestamp: string | number
    price: number
  }>
  symbol: string
  period: string
  isLoading: boolean
}

export default function StockChart({ data, symbol, period, isLoading }: StockChartProps) {
  // Format timestamp based on period
  const formatXAxis = (timestamp: string | number) => {
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp)
      
      switch (period) {
        case '1D':
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        case '5D':
          return date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
        case '1M':
        case '3M':
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        case '6M':
        case '1Y':
          return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        case '5Y':
          return date.toLocaleDateString([], { month: 'short', year: '2-digit' })
        default:
          return date.toLocaleDateString()
      }
    }
    return timestamp
  }

  // Calculate min and max for YAxis
  const priceMin = data.length ? Math.min(...data.map(item => item.price)) * 0.99 : 0
  const priceMax = data.length ? Math.max(...data.map(item => item.price)) * 1.01 : 100

  // Format price for tooltip
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-background border border-border rounded p-2 shadow-md">
          <p className="font-medium">{formatXAxis(label)}</p>
          <p className="text-primary font-bold">{formatPrice(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  // Find the starting and ending prices to determine chart line color
  const startPrice = data.length ? data[0].price : 0
  const endPrice = data.length ? data[data.length - 1].price : 0
  const chartColor = endPrice >= startPrice ? '#22C55E' : '#EF4444'

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis} 
            tick={{ fontSize: 12 }} 
            tickMargin={10}
            minTickGap={20}
            domain={['dataMin', 'dataMax']}
          />
          <YAxis 
            domain={[priceMin, priceMax]} 
            tickFormatter={price => formatPrice(price)} 
            tick={{ fontSize: 12 }} 
            orientation="right"
            width={80}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={chartColor} 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 5, fill: chartColor, strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 