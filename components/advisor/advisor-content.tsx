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
  const [apiKeysMissing, setApiKeysMissing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setApiError(false)
      setApiKeysMissing(false)
      
      // Get the Supabase auth token - check all possible storage locations
      let token = null;
      
      // Try localStorage with different key formats
      const possibleKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'sb:token',
        'supabase.auth.data',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      for (const key of possibleKeys) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          token = storedValue;
          break;
        }
      }
      
      // Try sessionStorage if not found in localStorage
      if (!token) {
        for (const key of possibleKeys) {
          const storedValue = sessionStorage.getItem(key);
          if (storedValue) {
            token = storedValue;
            break;
          }
        }
      }
      
      // Development mode fallback - use a dummy token if in development
      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('Using development mode fallback authentication');
        token = 'dev-mode-token';
      }
      
      // Check if user has API keys configured
      if (token) {
        try {
          let accessToken = '';
          try {
            // Try parsing as JSON
            const parsedToken = JSON.parse(token);
            accessToken = parsedToken.access_token || parsedToken.token || parsedToken.currentSession?.access_token || '';
          } catch {
            // If not JSON, use the token directly
            accessToken = token;
          }
          
          if (!accessToken && process.env.NODE_ENV === 'development') {
            // Use the dev mode token
            accessToken = 'dev-mode-token';
          }

          // Check API keys by making a health check request to the FastAPI backend
          const response = await fetch('/backend/fastapi_server/health', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          
          if (response.ok) {
            // API is available, now check if user has API keys
            const userResponse = await fetch('/backend/fastapi_server/user/api-keys', {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (!userResponse.ok && userResponse.status === 400) {
              // API keys are missing
              setApiKeysMissing(true);
              setShowApiErrorDialog(true);
            }
          } else {
            // API is not available
            setApiError(true);
            setShowApiErrorDialog(true);
          }
        } catch (error) {
          console.error("Error checking API keys:", error);
          setApiError(true);
        }
      }
      
      // Load cached market data
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
      
      // Try to load market data
      if (marketDataIsValid) {
        market = JSON.parse(cachedMarketData)
      } else {
        try {
          market = await fetchMarketData()
          localStorage.setItem("marketData", JSON.stringify(market))
          localStorage.setItem("marketDataTimestamp", now.toString())
        } catch (error) {
          console.error("Error fetching market data:", error)
          setApiError(true)
          // Use fallback data
          market = await fetchMarketData()
        }
      }
      
      // Try to load news data
      if (newsDataIsValid) {
        news = JSON.parse(cachedNewsData)
      } else {
        try {
          news = await fetchStockNews("SPY:NYSE")
          localStorage.setItem("newsData", JSON.stringify(news))
          localStorage.setItem("newsDataTimestamp", now.toString())
        } catch (error) {
          console.error("Error fetching news data:", error)
          setApiError(true)
          // Use fallback data
          news = await fetchStockNews("SPY:NYSE")
        }
      }
      
      setMarketData(market)
      setNewsData(news)
      
      // Show error dialog if needed
      if (apiError || apiKeysMissing) {
        setShowApiErrorDialog(true)
      }
    } catch (error) {
      console.error("Error in loadData:", error)
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
              {apiKeysMissing ? "API Keys Required" : "Simulation Mode Active"}
            </DialogTitle>
            <DialogDescription>
              {apiKeysMissing 
                ? "The AI Advisor requires your personal API keys to function properly. Please update your profile with your Google and RapidAPI keys."
                : "Due to API connection issues, you are currently viewing simulated data. The data shown is for demonstration purposes only and does not reflect real-time market conditions."}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/20 text-sm">
            <p className="font-medium text-yellow-500 mb-2">To resolve this issue:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              {apiKeysMissing ? (
                <>
                  <li>Go to your Profile page and update your API keys</li>
                  <li>You need both a Google API key (for Gemini) and a RapidAPI key</li>
                  <li>Get a Google API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a></li>
                  <li>Get a RapidAPI key from <a href="https://rapidapi.com/finance-data-api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">RapidAPI Marketplace</a></li>
                </>
              ) : (
                <>
                  <li>Ensure you have valid API keys configured in your profile settings</li>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the data using the refresh button</li>
                </>
              )}
            </ul>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {apiKeysMissing && (
              <Button 
                onClick={() => window.location.href = '/profile'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Profile Settings
              </Button>
            )}
            <Button onClick={() => setShowApiErrorDialog(false)}>
              {apiKeysMissing ? "I'll Do This Later" : "Continue in Simulation Mode"}
            </Button>
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
