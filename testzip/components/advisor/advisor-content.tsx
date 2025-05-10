"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { fetchMarketData } from "@/lib/api/market"
import { fetchStockNews } from "@/lib/api/news"
import { EnhancedFinanceAgent } from "@/components/advisor/enhanced-finance-agent"
import { Bot, Lightbulb, MessageSquare, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
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

      // Check if we have cached market data and if it's still valid
      const cachedMarketData = localStorage.getItem("marketData")
      const cachedMarketTimestamp = localStorage.getItem("marketDataTimestamp")
      const cachedNewsData = localStorage.getItem("newsData")
      const cachedNewsTimestamp = localStorage.getItem("newsDataTimestamp")

      const now = new Date().getTime()
      const marketDataIsValid =
        cachedMarketData && cachedMarketTimestamp && now - Number.parseInt(cachedMarketTimestamp) < 15 * 60 * 1000 // 15 minutes

      const newsDataIsValid =
        cachedNewsData && cachedNewsTimestamp && now - Number.parseInt(cachedNewsTimestamp) < 24 * 60 * 60 * 1000 // 24 hours

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
          console.error("Error fetching market data:", error)
          setApiError(true)
          // Use simulated data as fallback
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
          console.error("Error fetching news data:", error)
          setApiError(true)
          // Use simulated data as fallback
          news = await fetchStockNews("SPY:NYSE")
        }
      }

      setMarketData(market)
      setNewsData(news)

      // Check if API keys are missing
      if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setApiError(true)
      }

      // Show API error dialog if there's an error
      if (apiError) {
        setShowApiErrorDialog(true)
      }
    } catch (error) {
      console.error("Error loading advisor data:", error)
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
    // Clear cache to force fresh data
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
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Financial Advisor</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
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
              Due to API connection issues, you are currently viewing simulated data. The data shown is for
              demonstration purposes only and does not reflect real-time market conditions.
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
        <Card className="overflow-hidden border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Financial Advisor
            </CardTitle>
            <CardDescription>Get personalized financial advice and insights</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="chat" className="w-full">
              <div className="border-b">
                <div className="px-4">
                  <TabsList className="h-12">
                    <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat with Advisor</span>
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <Lightbulb className="h-4 w-4" />
                      <span>About the Advisor</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="chat" className="p-0 m-0">
                <EnhancedFinanceAgent marketData={marketData} newsData={newsData} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="about" className="p-6 m-0">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">How It Works</h3>
                      <p className="text-muted-foreground">
                        Our AI Financial Advisor uses advanced natural language processing to provide personalized
                        financial guidance. It analyzes market trends, offers investment advice, and helps with
                        financial planning.
                      </p>

                      <div className="mt-4 grid gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-medium">Real-time data analysis</p>
                            <p className="text-sm text-muted-foreground">
                              The advisor processes current market data and financial news to provide up-to-date
                              insights.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-medium">Personalized recommendations</p>
                            <p className="text-sm text-muted-foreground">
                              Based on your questions and conversation history, the advisor tailors its advice to your
                              specific needs.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-medium">Continuous learning</p>
                            <p className="text-sm text-muted-foreground">
                              The AI improves over time as it learns from interactions and financial trends.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">Capabilities</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>Market analysis and investment recommendations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>Portfolio diversification strategies</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>Retirement and financial planning</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>Tax optimization suggestions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>Risk assessment and management</span>
                        </li>
                      </ul>

                      <div className="mt-4">
                        <p className="text-sm">
                          The advisor is powered by Gemini 2.0 Flash API and has access to real-time market data and
                          financial news to provide up-to-date insights.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg mt-4 border border-muted-foreground/20">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> While our AI advisor provides valuable financial insights, it should not
                      replace professional financial advice. Always consult with a qualified financial advisor for
                      important financial decisions.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
