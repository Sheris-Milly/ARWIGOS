"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle } from "lucide-react"
import { fetchUserPortfolios } from "@/lib/api/portfolio"
import { AddStockDialog } from "@/components/portfolio/add-stock-dialog"

interface PortfolioSummaryProps {
  isLoading?: boolean
  showDetails?: boolean
}

export function PortfolioSummary({ isLoading: parentLoading = false, showDetails = false }: PortfolioSummaryProps) {
  // State to hold portfolio data
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [portfolios, setPortfolios] = useState<any[]>([])

  // Colors for the pie chart
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"]
  
  // Fetch portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch real data from Supabase
        const portfolios = await fetchUserPortfolios()
        setPortfolios(portfolios)
        
        // Calculate total portfolio value
        let totalPortfolioValue = 0
        portfolios.forEach((p: any) => {
          totalPortfolioValue += p.total_value || 0
        })
        setTotalValue(totalPortfolioValue)
        
        // Process data for pie chart
        if (portfolios.length > 0) {
          const portfolioStocks: any[] = []
          let allocatedValue = 0
          
          // Process first portfolio's stocks
          const firstPortfolio = portfolios[0]
          const stocks = firstPortfolio.portfolio_stocks || []
          
          // Calculate allocation for each stock
          stocks.forEach((stock: any, index: number) => {
            const stockValue = (stock.shares || 0) * (stock.average_price || 0)
            allocatedValue += stockValue
            
            portfolioStocks.push({
              name: stock.stock_symbol,
              value: stockValue,
              color: colors[index % colors.length]
            })
          })
          
          // If there's unallocated value, add it as "Other"
          if (totalPortfolioValue > allocatedValue && allocatedValue > 0) {
            portfolioStocks.push({
              name: "Other",
              value: totalPortfolioValue - allocatedValue,
              color: "#9ca3af" // Gray color for "Other"
            })
          }
          
          setPortfolio(portfolioStocks)
        } else {
          // Example data if no portfolios exist
          setPortfolio([
            { name: "Sample", value: 100, color: "#10b981" },
            { name: "Create a portfolio to see real data", value: 0, color: "#3b82f6" }
          ])
        }
      } catch (error) {
        console.error("Error loading portfolio data:", error)
        // Set example data on error
        setPortfolio([
          { name: "Sample", value: 100, color: "#10b981" },
          { name: "Error loading data", value: 0, color: "#ef4444" }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPortfolioData()
  }, [])
  
  // Combined loading state
  const combinedLoading = parentLoading || isLoading

  if (combinedLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="aspect-[4/3] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={portfolio}
              cx="50%"
              cy="50%"
              innerRadius={showDetails ? 60 : 50}
              outerRadius={showDetails ? 80 : 70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {portfolio.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)} 
              labelFormatter={(name) => `${name}`}
            />
            {showDetails && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium">Total Value</h4>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <AddStockDialog open={dialogOpen} onOpenChange={setDialogOpen} portfolios={portfolios} />
    </div>
  )
}
