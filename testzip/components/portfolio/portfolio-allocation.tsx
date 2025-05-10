"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AllocationProps {
  stocks: any[]
  onUpdateAllocation: (symbol: string, allocation: number) => void
}

export function PortfolioAllocation({ stocks, onUpdateAllocation }: AllocationProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [targetAllocations, setTargetAllocations] = useState(() => {
    // Initialize target allocations based on current allocations
    const allocations: Record<string, number> = {}
    stocks.forEach((stock) => {
      allocations[stock.symbol] = stock.allocation
    })
    return allocations
  })

  // Calculate total allocation to ensure it adds up to 100%
  const totalTargetAllocation = Object.values(targetAllocations).reduce((sum, value) => sum + value, 0)

  // Prepare data for the charts
  const currentData = stocks.map((stock, index) => ({
    name: stock.symbol,
    value: stock.allocation,
    color: getColor(index),
  }))

  const targetData = stocks.map((stock, index) => ({
    name: stock.symbol,
    value: targetAllocations[stock.symbol] || 0,
    color: getColor(index),
  }))

  const handleAllocationChange = (symbol: string, value: number) => {
    // Update the target allocation for this symbol
    setTargetAllocations((prev) => ({
      ...prev,
      [symbol]: value,
    }))
  }

  const applyTargetAllocations = () => {
    // Apply the target allocations to the stocks
    stocks.forEach((stock) => {
      if (targetAllocations[stock.symbol] !== undefined) {
        onUpdateAllocation(stock.symbol, targetAllocations[stock.symbol])
      }
    })

    // Switch back to current tab
    setActiveTab("current")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>Analyze and optimize your investment allocation</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="current">Current Allocation</TabsTrigger>
            <TabsTrigger value="target">Target Allocation</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {currentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Allocation"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {stocks.map((stock, index) => (
                <div key={stock.symbol} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(index) }} />
                  <span className="w-16">{stock.symbol}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${stock.allocation}%`,
                        backgroundColor: getColor(index),
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm">{stock.allocation}%</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="target" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {targetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Allocation"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {stocks.map((stock, index) => (
                <div key={stock.symbol} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`allocation-${stock.symbol}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(index) }} />
                        {stock.symbol}
                      </div>
                    </Label>
                    <span className="text-sm">{targetAllocations[stock.symbol] || 0}%</span>
                  </div>
                  <Slider
                    id={`allocation-${stock.symbol}`}
                    min={0}
                    max={100}
                    step={1}
                    value={[targetAllocations[stock.symbol] || 0]}
                    onValueChange={(value) => handleAllocationChange(stock.symbol, value[0])}
                  />
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  Total Allocation:
                  <span className={totalTargetAllocation === 100 ? "text-green-600" : "text-red-600"}>
                    {" "}
                    {totalTargetAllocation}%
                  </span>
                </div>
                <Button onClick={applyTargetAllocations} disabled={totalTargetAllocation !== 100}>
                  Apply Changes
                </Button>
              </div>

              {totalTargetAllocation !== 100 && (
                <p className="text-sm text-red-600">
                  Total allocation must equal 100%. Current total: {totalTargetAllocation}%
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
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
