"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { PortfolioTable } from "@/components/portfolio/portfolio-table"
import { PortfolioChart } from "@/components/portfolio/portfolio-chart"
import { PortfolioStats } from "@/components/portfolio/portfolio-stats"
import { PortfolioAllocation } from "@/components/portfolio/portfolio-allocation"
import { PortfolioPerformance } from "@/components/portfolio/portfolio-performance"
import { AddStockDialog } from "@/components/portfolio/add-stock-dialog"
import { CreatePortfolioDialog } from "@/components/portfolio/create-portfolio-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchUserPortfolios, removeStockFromPortfolio, createDefaultPortfolio } from "@/lib/api/portfolio"
import { fetchStockData } from "@/lib/api/market" // Updated import path
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function PortfolioContent() {
  const [stocks, setStocks] = useState<any[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createPortfolioDialogOpen, setCreatePortfolioDialogOpen] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      setIsLoading(true)
      
      // Check if user has any portfolio, create default if not
      try {
        await createDefaultPortfolio()
      } catch (error) {
        console.warn("Couldn't create default portfolio, might already exist:", error)
      }
      
      const userPortfolios = await fetchUserPortfolios()
      setPortfolios(userPortfolios)
      
      // If portfolios exist, process the stocks
      if (userPortfolios && userPortfolios.length > 0) {
        const processedStocks = await processPortfolioStocks(userPortfolios)
        setStocks(processedStocks)
      } else {
        // No portfolios found, use empty array
        setStocks([])
      }
    } catch (error) {
      console.error("Error loading portfolios:", error)
      setApiError(true)
      setShowApiErrorDialog(true)
      // Use empty array as fallback
      setStocks([])
    } finally {
      setIsLoading(false)
    }
  }

  // Process portfolio stocks with current prices and calculations
  const processPortfolioStocks = async (portfolioList: any[]) => {
    console.log('Processing portfolio stocks:', portfolioList)
    const allStocks: any[] = []
    
    // Go through each portfolio and extract stocks
    for (const portfolio of portfolioList) {
      if (portfolio.portfolio_stocks && portfolio.portfolio_stocks.length > 0) {
        for (const stockPosition of portfolio.portfolio_stocks) {
          try {
            // Get current stock data from API
            console.log(`Fetching data for ${stockPosition.stock_symbol}...`);
            const stockData = await fetchStockData(stockPosition.stock_symbol);
            console.log(`API data received for ${stockPosition.stock_symbol}:`, stockData);
            
            // Get current price with fallbacks
            let currentPrice = 0;
            let priceSource = 'default';
            
            // First try API response
            if (stockData?.quote?.currentPrice && !isNaN(stockData.quote.currentPrice)) {
              currentPrice = Number(stockData.quote.currentPrice);
              priceSource = 'API';
              console.log(`Using API price for ${stockPosition.stock_symbol}: ${currentPrice}`);
            } 
            // Then try stock_details from database
            else if (stockPosition.stock_details?.last_price && !isNaN(stockPosition.stock_details.last_price)) {
              currentPrice = Number(stockPosition.stock_details.last_price);
              priceSource = 'database';
              console.log(`Using database price for ${stockPosition.stock_symbol}: ${currentPrice}`);
            }
            // Last resort, use purchase price
            else if (stockPosition.average_price && !isNaN(stockPosition.average_price)) {
              currentPrice = Number(stockPosition.average_price);
              priceSource = 'purchase price';
              console.log(`Using purchase price for ${stockPosition.stock_symbol}: ${currentPrice}`);
            }
            
            console.log(`Final price for ${stockPosition.stock_symbol}: ${currentPrice} (source: ${priceSource})`);
            
            // Force the price to come from the API if it exists in the response
            // Access the raw data directly since the StockQuote type doesn't have '05. price' property
            if (stockData && stockData.rawData && stockData.rawData['Global Quote'] && 
                stockData.rawData['Global Quote']['05. price'] && 
                !isNaN(parseFloat(stockData.rawData['Global Quote']['05. price']))) {
              currentPrice = parseFloat(stockData.rawData['Global Quote']['05. price']);
              console.log(`Overriding with direct API price field for ${stockPosition.stock_symbol}: ${currentPrice}`);
            }
            
            // Use the purchase price provided by the user
            const shares = stockPosition.shares
            const purchasePrice = stockPosition.average_price
            
            // Calculate values
            const value = shares * currentPrice
            const gain = (currentPrice - purchasePrice) * shares
            const gainPercent = purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0
            
            allStocks.push({
              symbol: stockPosition.stock_symbol,
              name: stockPosition.stock_details?.name || stockPosition.stock_symbol,
              shares: Number(shares),
              purchasePrice: Number(purchasePrice),
              currentPrice: Number(currentPrice),
              value: Number(value),
              gain: Number(gain),
              gainPercent: Number(gainPercent),
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              purchaseDate: stockPosition.purchase_date,
              allocation: 0 // Will calculate after all stocks are processed
            })
          } catch (error) {
            console.error(`Error processing stock ${stockPosition.stock_symbol}:`, error)
          }
        }
      }
    }
    
    // Calculate allocations
    const totalValue = allStocks.reduce((sum, stock) => sum + stock.value, 0)
    return allStocks.map(stock => ({
      ...stock,
      allocation: totalValue > 0 ? Math.round((stock.value / totalValue) * 100) : 0
    }))
  }

  const addStock = async (newStock: any) => {
    try {
      setIsLoading(true)
      // The addStockToPortfolio function is already handling the database update
      // We just need to refresh our data
      await loadPortfolios()

    toast({
      title: "Stock added",
        description: `${newStock.symbol.toUpperCase()} has been added to your portfolio.`,
      })
    } catch (error) {
      console.error("Error adding stock:", error)
      toast({
        title: "Error",
        description: "Failed to add stock to your portfolio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeStock = async (symbol: string, portfolioId: string) => {
    try {
      setIsLoading(true)
      
      // Remove stock from database
      await removeStockFromPortfolio(portfolioId, symbol)
      
      // Refresh data
      await loadPortfolios()

    toast({
      title: "Stock removed",
      description: `${symbol} has been removed from your portfolio.`,
    })
    } catch (error) {
      console.error("Error removing stock:", error)
      toast({
        title: "Error",
        description: "Failed to remove stock from your portfolio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateAllocation = (symbol: string, allocation: number) => {
    // This would need to be implemented with Supabase
    toast({
      title: "Coming Soon",
      description: "Allocation updates will be available in a future update.",
    })
  }

  const handleRefresh = () => {
    loadPortfolios()
    toast({
      title: "Refreshing data",
      description: "Fetching the latest portfolio information...",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio Analysis</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setCreatePortfolioDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Portfolio
          </Button>
          <Button onClick={() => setDialogOpen(true)} disabled={portfolios.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
        </div>
      </div>

      {/* API Error Dialog */}
      <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow-500 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-alert-triangle"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
              Simulation Mode Active
            </DialogTitle>
            <DialogDescription>
              Due to API connection issues, you are currently viewing simulated data. The data shown is for
              demonstration purposes only and does not reflect real-time market conditions.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/20 text-sm">
            <p className="font-medium text-yellow-500 mb-2">To resolve this issue:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Ensure you have valid API keys configured in your environment variables</li>
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowApiErrorDialog(false)}>Continue in Simulation Mode</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          {stocks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">No stocks in your portfolio</h3>
                <p className="text-muted-foreground mb-4">Add your first stock to start tracking your investments.</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Stock
                </Button>
              </CardContent>
            </Card>
          ) : (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <PortfolioStats stocks={stocks} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Allocation</CardTitle>
              <CardDescription>Current distribution of your investments</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <PortfolioChart stocks={stocks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
              <CardDescription>Detailed view of your investments</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioTable stocks={stocks} onRemove={removeStock} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <PortfolioAllocation stocks={stocks} onUpdateAllocation={updateAllocation} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PortfolioPerformance stocks={stocks} />
        </TabsContent>
      </Tabs>
          )}
        </>
      )}

      <AddStockDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onAddStock={addStock} 
        portfolios={portfolios}
      />
      <CreatePortfolioDialog 
        open={createPortfolioDialogOpen} 
        onOpenChange={setCreatePortfolioDialogOpen} 
        onPortfolioCreated={loadPortfolios}
      />
    </div>
  )
}
