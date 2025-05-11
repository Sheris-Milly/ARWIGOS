"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchStockData } from "@/lib/api/market"
import { fetchUserPortfolios, addStockToPortfolio } from "@/lib/api/portfolio"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStock?: (newStock: any) => void
  portfolios: any[] // Add portfolios prop
}

export function AddStockDialog({ 
  open, 
  onOpenChange, 
  onAddStock, 
  portfolios: initialPortfolios // Receive portfolios as prop
}: AddStockDialogProps) {
  const [symbol, setSymbol] = useState("")
  const [shares, setShares] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [portfolioId, setPortfolioId] = useState("")
  const [portfolios, setPortfolios] = useState<any[]>(initialPortfolios || []) // Initialize with prop
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Update portfolios state when prop changes and set default portfolio
  useEffect(() => {
    setPortfolios(initialPortfolios || [])
    if (initialPortfolios && initialPortfolios.length > 0 && !portfolioId) {
      setPortfolioId(initialPortfolios[0].id)
    }
  }, [initialPortfolios, portfolioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symbol || !shares || !purchasePrice || !portfolioId) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Fetch current stock data to validate symbol
      const stockData = await fetchStockData(symbol)

      if (!stockData || !stockData.quote) {
        throw new Error("Could not fetch stock data")
      }

      const sharesNum = Number.parseFloat(shares)
      const purchasePriceNum = Number.parseFloat(purchasePrice)

      // Add stock to portfolio
      const result = await addStockToPortfolio(
        portfolioId,
        symbol.toUpperCase(),
        sharesNum,
        purchasePriceNum,
        new Date().toISOString() // Using current date as purchase date
      )

      // Show success message
      toast({
        title: "Stock added",
        description: `Successfully added ${sharesNum} shares of ${symbol.toUpperCase()} to your portfolio.`,
      })
      
      // Call the callback if provided
      if (onAddStock) {
        onAddStock({
          symbol: symbol.toUpperCase(),
          shares: sharesNum,
          purchasePrice: purchasePriceNum,
          portfolioId
        })
      }
      
      onOpenChange(false)

      // Reset form
      setSymbol("")
      setShares("")
      setPurchasePrice("")
    } catch (error: any) {
      console.error("Error adding stock:", error)
      setError(error.message || "Could not add stock. Please check the symbol and try again.")
      
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createPortfolioOption = () => {
    // This would typically open another dialog to create a portfolio
    toast({
      title: "Coming Soon",
      description: "Portfolio creation feature is coming soon!",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock to Portfolio</DialogTitle>
          <DialogDescription>Enter the details of the stock you want to add to your portfolio.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="portfolio">Select Portfolio</Label>
              {portfolios.length > 0 ? (
                <Select value={portfolioId} onValueChange={setPortfolioId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">No portfolios available. Please create one first.</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input id="symbol" placeholder="AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={isLoading || portfolios.length === 0} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                placeholder="10"
                min="0.01"
                step="0.01"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                disabled={isLoading || portfolios.length === 0}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchasePrice">Purchase Price per Share</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="150.00"
                min="0.01"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                disabled={isLoading || portfolios.length === 0}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || portfolios.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
