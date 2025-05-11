"use client";

import { useEffect, useState, useMemo } from "react"
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import {
  ArrowUpRight, 
  RefreshCw, 
  Download, 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Newspaper, 
  Bot, 
  AlertCircle, 
  ExternalLink 
} from "lucide-react"
import { fetchMarketData } from "@/lib/api/market" // Updated import
import { fetchLatestNews } from "@/lib/api/news"
import { fetchUserPortfolios } from "@/lib/api/portfolio"
import { formatCurrency } from "@/lib/utils"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { RecentNews } from "@/components/dashboard/recent-news"
import { FinanceAgent } from "@/components/dashboard/finance-agent"
import { TopPerformers } from "@/components/dashboard/top-performers"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PortfolioSummary } from "./portfolio-summary"; // Import PortfolioSummary
import { createBrowserClient } from "@supabase/ssr";
import { ApiKeyModal } from "@/components/auth/ApiKeyModal"; // Import the modal

export function DashboardContent() {
  const [marketData, setMarketData] = useState<any>(null)
  const [newsData, setNewsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false)
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview'); // Add this line
  const { toast } = useToast()

  // State for API Key Modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [apiKeysChecked, setApiKeysChecked] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Calculate real portfolio data
  const portfolioValue = portfolios.reduce((total, portfolio) => {
    // Sum up the actual value of all stocks in the portfolio
    if (portfolio.portfolio_stocks) {
      return total + portfolio.portfolio_stocks.reduce((portfolioTotal, stock) => {
        const shares = Number(stock.shares) || 0
        const currentPrice = stock.stock_details?.last_price || stock.average_price || 0
        return portfolioTotal + (shares * currentPrice)
      }, 0)
    }
    return total + (portfolio.total_value || 0)
  }, 0)
  
  // Calculate real portfolio gain/loss
  const portfolioGain = portfolios.reduce((total, portfolio) => {
    if (portfolio.portfolio_stocks) {
      return total + portfolio.portfolio_stocks.reduce((portfolioGain, stock) => {
        const shares = Number(stock.shares) || 0
        const purchasePrice = Number(stock.average_price) || 0
        const currentPrice = stock.stock_details?.last_price || purchasePrice || 0
        const gain = (currentPrice - purchasePrice) * shares
        return portfolioGain + gain
      }, 0)
    }
    return total
  }, 0)
  
  // Calculate portfolio change percentage
  const portfolioInvested = portfolios.reduce((total, portfolio) => {
    if (portfolio.portfolio_stocks) {
      return total + portfolio.portfolio_stocks.reduce((portfolioInvested, stock) => {
        const shares = Number(stock.shares) || 0
        const purchasePrice = Number(stock.average_price) || 0
        return portfolioInvested + (shares * purchasePrice)
      }, 0)
    }
    return total
  }, 0)
  
  const portfolioChange = portfolioInvested > 0 ? (portfolioGain / portfolioInvested) * 100 : 0
  const lastUpdated = new Date()

  // Find actual top performing stock across all portfolios
  const topPerformer = (() => {
    let best = { symbol: "", name: "", change: 0, changePercent: 0 };
    portfolios.forEach(portfolio => {
      if (portfolio.portfolio_stocks) {
        portfolio.portfolio_stocks.forEach((stock: any) => {
          const purchasePrice = Number(stock.average_price) || 0
          const currentPrice = stock.stock_details?.last_price || purchasePrice
          if (purchasePrice > 0) {
            const changePercent = ((currentPrice - purchasePrice) / purchasePrice) * 100
            if (changePercent > best.changePercent) {
              best = { 
                symbol: stock.stock_symbol, 
                name: stock.stock_details?.name || stock.stock_symbol,
                change: currentPrice - purchasePrice,
                changePercent: changePercent
              };
            }
          }
        });
      }
    });
    return best;
  })();

  // Cache formatted date to avoid hydration mismatch
  const formattedDate = useMemo(() => {
    if (!lastUpdated) return ""
    return lastUpdated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [lastUpdated])

  useEffect(() => {
    loadData()
    loadPortfolios()
    checkAndPromptForApiKeys(); // Check for API keys on component mount
  }, [])

  const checkAndPromptForApiKeys = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.error('Error fetching session or no user:', sessionError);
        // Potentially handle not being logged in, though dashboard implies logged in
        setApiKeysChecked(true);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('google_api_key, alpha_vantage_key')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found
        console.error('Error fetching user profile for API keys:', profileError);
        toast({
          title: "Error",
          description: "Could not check your API key status. Please try refreshing.",
          variant: "destructive",
        });
        setApiKeysChecked(true);
        return;
      }

      setUserProfile(profile);
      if (!profile || !profile.google_api_key || !profile.alpha_vantage_key) {
        setShowApiKeyModal(true);
      }
    } catch (error) {
      console.error('Failed to check API keys:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while checking API key status.",
        variant: "destructive",
      });
    } finally {
      setApiKeysChecked(true);
    }
  };

  const handleSaveApiKeys = async (googleApiKey: string, rapidApiKey: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('User session not found. Please log in again.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ googleApiKey, rapidApiKey }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save API keys.');
      }

      // Optionally, update local userProfile state or re-fetch
      setUserProfile((prev: any) => ({ ...prev, google_api_key: googleApiKey, alpha_vantage_key: rapidApiKey }));
      setShowApiKeyModal(false); // Close modal on success
      // Potentially reload data or re-enable features that depend on these keys
      // For example, re-run loadData() if it was skipped due to missing keys
      if(apiError) { // if there was an API error previously, try loading data again
        setApiError(false); // reset apiError state
        setShowApiErrorDialog(false); // hide error dialog
        loadData(); // reload data
      }

    } catch (error) {
      console.error('Error saving API keys:', error);
      // The modal itself will show a toast for errors, but re-throw if needed for other handling
      throw error; 
    }
  };

  const loadPortfolios = async () => {
    try {
      setPortfolioLoading(true)
      const data = await fetchUserPortfolios()
      setPortfolios(data)
    } catch (error) {
      console.error("Error loading portfolios:", error)
      toast({
        title: "Error loading portfolios",
        description: "Could not fetch your portfolio data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setPortfolioLoading(false)
    }
  }

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
          market = await fetchMarketData() // This now calls the function from lib/api/market.ts
        }
      }

      if (newsDataIsValid) {
        news = JSON.parse(cachedNewsData)
      } else {
        try {
          news = await fetchLatestNews()
          localStorage.setItem("newsData", JSON.stringify(news))
          localStorage.setItem("newsDataTimestamp", now.toString())
        } catch (error) {
          console.error("Error fetching news data:", error)
          setApiError(true)
          // Use simulated data as fallback
          news = await fetchLatestNews()
        }
      }

      setMarketData(market)
      setNewsData(news)

      // Check if API keys are missing
      // This check might be redundant if the modal forces key entry, 
      // but good for robustness or if keys can be removed elsewhere.
      if (!userProfile?.alpha_vantage_key || !userProfile?.google_api_key) {
        // Check against fetched userProfile instead of env vars for user-specific keys
        // If apiKeysChecked is false, we might not have the profile yet, so this could be a premature error.
        // Consider showing this error only if apiKeysChecked is true and keys are still missing.
        if (apiKeysChecked && (!userProfile?.alpha_vantage_key || !userProfile?.google_api_key)) {
            setApiError(true);
        }
      }

      // Show API error dialog if there's an error
      if (apiError) {
        setShowApiErrorDialog(true)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
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
    loadPortfolios()

    toast({
      title: "Refreshing data",
      description: "Fetching the latest market information...",
    })
  }

  const handleExport = () => {
    // Create a data object to export
    const exportData = {
      portfolioValue,
      portfolioChange,
      marketData,
      lastUpdated: formattedDate,
      portfolios
    }

    // Create a Blob with the data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Create a download link and trigger it
    const a = document.createElement("a")
    a.href = url
    a.download = `financial-dashboard-${formattedDate}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Your dashboard data has been exported.",
    })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="container mx-auto p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* API Error Dialog */}
      <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" /> API Key Information
            </DialogTitle>
            <DialogDescription>
              It seems one or more API keys (RapidAPI for market data, Gemini for AI features) might be missing or invalid. 
              The application is currently using simulated data. Please check your environment variables.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowApiErrorDialog(false)}>Dismiss</Button>
            {/* Optional: Add a link to documentation or settings */}
            {/* <Button variant="outline" asChild>
              <Link href="/settings/api-keys">Configure Keys <ExternalLink className="ml-2 h-4 w-4" /></Link>
            </Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Key Metrics */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {portfolioLoading ? (
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            )}
            <p className={`text-xs ${portfolioChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {portfolioLoading ? "Loading..." : `${portfolioChange >= 0 ? '+' : ''}${portfolioChange.toFixed(2)}% from last period`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Index (S&P 500)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">
                {marketData?.indexes?.find(idx => idx.symbol === '^GSPC' || idx.name.includes('S&P 500'))?.price.toFixed(2) || "N/A"}
              </div>
            )}
            <p className={`text-xs ${(marketData?.indexes?.find(idx => idx.symbol === '^GSPC' || idx.name.includes('S&P 500'))?.percentChange || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {isLoading ? "Loading..." : `${(marketData?.indexes?.find(idx => idx.symbol === '^GSPC' || idx.name.includes('S&P 500'))?.percentChange || 0) >= 0 ? '+' : ''}${(marketData?.indexes?.find(idx => idx.symbol === '^GSPC' || idx.name.includes('S&P 500'))?.percentChange || 0).toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {portfolioLoading ? (
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{topPerformer.symbol || "N/A"}</div>
            )}
            <p className={`text-xs ${topPerformer.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {portfolioLoading ? "Loading..." : `${topPerformer.changePercent >= 0 ? '+' : ''}${topPerformer.changePercent.toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Finance Agent</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">
              Ask about your finances
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Area with Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>
                    Your portfolio value over time. Last updated: {formattedDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2 h-[350px]">
                  {portfolioLoading ? (
                     <div className="h-full w-full bg-muted rounded animate-pulse"></div>
                  ) : (
                    <PortfolioChart portfolios={portfolios} />
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Portfolio Summary</CardTitle>
                  <CardDescription>Asset allocation across your portfolio.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PortfolioSummary isLoading={portfolioLoading} showDetails={true} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Market News</CardTitle>
                <CardDescription>Latest headlines impacting the financial markets.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-muted rounded animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RecentNews newsData={newsData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Finance Agent</CardTitle>
                <CardDescription>Ask questions about your portfolio, market trends, or financial concepts.</CardDescription>
              </CardHeader>
              <CardContent>
                <FinanceAgent />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Stocks</CardTitle>
                <CardDescription>Stocks with the highest gains today (Simulated Data).</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TopPerformers marketData={marketData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
