"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface PortfolioChartProps {
  stocks: any[]
}

// Generate a color based on index
const getColor = (index: number) => {
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

export function PortfolioChart({ stocks }: PortfolioChartProps) {
  // Transform stocks data for the pie chart
  const chartData = stocks.map((stock, index) => ({
    name: stock.symbol,
    value: stock.allocation,
    color: getColor(index),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}%`, "Allocation"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
