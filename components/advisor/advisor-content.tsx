"use client"

import { useState, useEffect } from "react"
import { EnhancedFinanceAgent } from "@/components/advisor/enhanced-finance-agent"
import { Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { fetchMarketData } from "@/lib/api/market"
import { fetchStockNews } from "@/lib/api/news"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function AdvisorContent() {
  const [marketData, setMarketData] = useState<any>(null)
  const [newsData, setNewsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setApiError(false)
      const cachedMarketData = localStorage.getItem("marketData")
      const cachedMarketTimestamp = localStorage.getItem("marketDataTimestamp")
      const cachedNewsData = localStorage.getItem("newsData")
      const cachedNewsTimestamp = localStorage.getItem("newsDataTimestamp")
      const now = new Date().getTime()
      const marketDataIsValid =
        cachedMarketData && cachedMarketTimestamp && now - Number.parseInt(cachedMarketTimestamp) < 15 * 60 * 1000
      const newsDataIsValid =
        cachedNewsData && cachedNewsTimestamp && now - Number.parseInt(cachedNewsTimestamp) < 24 * 60 * 60 * 1000
      let market
      let news
      if (marketDataIsValid) {
        market = JSON.parse(cachedMarketData)
      } else {
        try {
          market = await fetchMarketData()
          localStorage.setItem("marketData", JSON.stringify(market))
          localStorage.setItem("marketDataTimestamp", now.toString())
        } catch (error) {
          setApiError(true)
          market = await fetchMarketData()
        }
      }
      if (newsDataIsValid) {
        news = JSON.parse(cachedNewsData)
      } else {
        try {
          news = await fetchStockNews("SPY:NYSE")
          localStorage.setItem("newsData", JSON.stringify(news))
          localStorage.setItem("newsDataTimestamp", now.toString())
        } catch (error) {
          setApiError(true)
          news = await fetchStockNews("SPY:NYSE")
        }
      }
      setMarketData(market)
      setNewsData(news)
      if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setApiError(true)
      }
      if (apiError) {
        setShowApiErrorDialog(true)
      }
    } catch (error) {
      setApiError(true)
      setShowApiErrorDialog(true)
      toast({
        title: "Error loading data",
        description: "Could not fetch the latest market data. Using simulated data instead.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    localStorage.removeItem("marketData")
    localStorage.removeItem("marketDataTimestamp")
    localStorage.removeItem("newsData")
    localStorage.removeItem("newsDataTimestamp")
    loadData()
    toast({
      title: "Refreshing data",
      description: "Fetching the latest market information...",
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto py-8 px-2 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-3">
          <Bot className="h-9 w-9 text-primary" />
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 text-transparent bg-clip-text">AI Financial Advisor</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 border-primary/30"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

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
              Due to API connection issues, you are currently viewing simulated data. The data shown is for demonstration purposes only and does not reflect real-time market conditions.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/20 text-sm">
            <p className="font-medium text-yellow-500 mb-2">To resolve this issue:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Ensure you have valid API keys configured in your environment variables</li>
              <li>Check your internet connection</li>
              <li>Try refreshing the data using the refresh button</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowApiErrorDialog(false)}>Continue in Simulation Mode</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="rounded-3xl shadow-xl border border-primary/10 bg-gradient-to-br from-white via-blue-50 to-primary/5 dark:from-background dark:via-primary/10 dark:to-background p-0">
          <EnhancedFinanceAgent marketData={marketData} newsData={newsData} isLoading={isLoading} />
        </div>
      </motion.div>
    </div>
  )
}
