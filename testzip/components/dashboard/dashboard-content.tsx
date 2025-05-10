"use client"

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
import { Input } from "@/components/ui/input" // Added Input component
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // Added Supabase client

export function DashboardContent() {
  const supabase = createClientComponentClient(); // Initialize Supabase client
  const [marketData, setMarketData] = useState<any>(null)
  const [newsData, setNewsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState(false) // For environment API key errors
  const [showApiErrorDialog, setShowApiErrorDialog] = useState(false) // For environment API key errors
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast()

  // Handler for saving user-specific API keys
  const handleSaveUserApiKeys = async (googleApiKey: string, rapidApiKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Authentication Error", description: "User not found. Please log in again.", variant: "destructive" });
      throw new Error("User not found. Please log in again.");
    }

    if (!googleApiKey || !rapidApiKey) {
      toast({ title: "Missing Information", description: "Please enter both API keys.", variant: "warning" });
      throw new Error("Please enter both API keys.");
    }

    const updates = {
      google_api_key: googleApiKey,
      rapid_api_key: rapidApiKey,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error("Error updating API keys:", error);
      toast({ title: "Save Error", description: `Could not save API keys: ${error.message}`, variant: "destructive" });
      throw error; // Re-throw to allow ApiKeyModal to handle its loading state
    } else {
      toast({ title: "Success", description: "API keys saved successfully." });
      setUserGoogleApiKey(googleApiKey);
      setUserRapidApiKey(rapidApiKey);
      setUserProfile((prev: any) => ({ ...prev, google_api_key: googleApiKey, rapid_api_key: rapidApiKey, updated_at: updates.updated_at }));
      setShowUserApiKeyModal(false);

      // If there was an API error previously (e.g. due to missing env keys, but now user keys are set),
      // try reloading data.
      if(apiError) {
        setApiError(false);
        setShowApiErrorDialog(false);
        loadData(); // Reload data as keys are now available
      }
    }
  };

  // State for user-specific API keys
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserApiKeyModal, setShowUserApiKeyModal] = useState(false);
  const [userGoogleApiKey, setUserGoogleApiKey] = useState("");
  const [userRapidApiKey, setUserRapidApiKey] = useState("");

  // Portfolio data calculations
  const portfolioValue = portfolios.reduce((total, portfolio) => total + (portfolio.total_value || 0), 0)
  const portfolioChange = portfolios.length > 0 ? 
    portfolios.reduce((total, p) => {
      // For now, we're using a placeholder for change calculation
      // In a real app, you would track historical values and calculate actual change
      const change = p.total_value * 0.025; // Example 2.5% change
      return total + change;
    }, 0) / portfolioValue * 100 : 0
  const lastUpdated = new Date()

  // Find top performing stock across all portfolios
  const topPerformer = (() => {
    let best = { symbol: "", change: 0 };
    portfolios.forEach(portfolio => {
      if (portfolio.portfolio_stocks) {
        portfolio.portfolio_stocks.forEach((stock: any) => {
          // This is a placeholder - in a real app, you'd calculate actual daily change
          // Using random values for demo purposes
          const change = Math.random() * 5;
          if (change > best.change) {
            best = { symbol: stock.stock_symbol, change };
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
  }, [])

  // useEffect to fetch user profile and check for their API keys
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('google_api_key, rapid_api_key')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          toast({ title: "Error fetching profile", description: "Could not fetch your profile data. Some features might be limited.", variant: "destructive" });
          return;
        }

        if (profile) {
          setUserProfile(profile);
          setUserGoogleApiKey(profile.google_api_key || "");
          setUserRapidApiKey(profile.rapid_api_key || "");
          // Show modal if either user-specific key is missing
          if (!profile.google_api_key || !profile.rapid_api_key) {
            setShowUserApiKeyModal(true);
          }
        } else {
          // Profile doesn't exist (e.g., new user), prompt for keys
          setShowUserApiKeyModal(true);
        }
      }
    };

    fetchUserProfile();
  }, [supabase, toast]);

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
      setApiError(false) // Reset for environment key check

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
      if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setApiError(true)
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

      {/* API Error Dialog for MISSING ENVIRONMENT variables */}
      <Dialog open={showApiErrorDialog} onOpenChange={setShowApiErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" /> Application API Key Issue
            </DialogTitle>
            <DialogDescription>
              The application's backend API keys (RapidAPI for market data, Gemini for AI features) seem to be missing or invalid in the environment configuration. 
              The application might be using simulated data or have limited functionality. This is a system configuration issue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowApiErrorDialog(false)}>Dismiss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User API Key Input Dialog for MISSING USER-SPECIFIC keys */}
      <Dialog open={showUserApiKeyModal} onOpenChange={(isOpen) => {
        if (!isOpen && (!userProfile?.google_api_key || !userProfile?.rapid_api_key)) {
          // If user closes modal without saving, and keys are still missing, 
          // you might want to remind them or handle it, but for now, just allow closing.
        }
        setShowUserApiKeyModal(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Your Personal API Keys</DialogTitle>
            <DialogDescription>
              To enable all personalized features, please provide your API keys. 
              These are stored securely in your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="userGoogleApiKey" className="text-right col-span-1 text-sm">
                Gemini Key
              </label>
              <Input
                id="userGoogleApiKey"
                placeholder="Your Google Gemini API Key"
                value={userGoogleApiKey}
                onChange={(e) => setUserGoogleApiKey(e.target.value)}
                classNa<ctrl61>me="col-span-3"
                type="password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="userRapidApiKey" className="text-right col-span-1 text-sm">
                RapidAPI Key
              </label>
              <Input
                id="userRapidApiKey"
                placeholder="Your RapidAPI Key"
                value={userRapidApiKey}
                onChange={(e) => setUserRapidApiKey(e.target.value)}
                className="col-span-3"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserApiKeyModal(false)}>Later</Button>
            <Button onClick={handleSaveUserApiKeys}>Save API Keys</Button>
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
              <div className="text-2xl font-bold">{marketData?.marketSummaryResponse?.result?.[0]?.regularMarketPrice?.fmt || "N/A"}</div>
            )}
            <p className={`text-xs ${marketData?.marketSummaryResponse?.result?.[0]?.regularMarketChangePercent?.raw >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {isLoading ? "Loading..." : `${marketData?.marketSummaryResponse?.result?.[0]?.regularMarketChangePercent?.fmt || "N/A"}`}
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
            <p className={`text-xs ${topPerformer.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {portfolioLoading ? "Loading..." : `${topPerformer.change > 0 ? '+' : ''}${topPerformer.change.toFixed(2)}% (Demo)`}
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
            <TabsTrigger value="news">Market News</TabsTrigger>
            <TabsTrigger value="agent">Finance Agent</TabsTrigger>
            <TabsTrigger value="performers">Top Performers</TabsTrigger>
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
              <div className="text-2xl font-bold">{marketData?.marketSummaryResponse?.result?.[0]?.regularMarketPrice?.fmt || "N/A"}</div>
            )}
            <p className={`text-xs ${marketData?.marketSummaryResponse?.result?.[0]?.regularMarketChangePercent?.raw >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {isLoading ? "Loading..." : `${marketData?.marketSummaryResponse?.result?.[0]?.regularMarketChangePercent?.fmt || "N/A"}`}
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
            <p className={`text-xs ${topPerformer.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {portfolioLoading ? "Loading..." : `${topPerformer.change > 0 ? '+' : ''}${topPerformer.change.toFixed(2)}% (Demo)`}
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
            <TabsTrigger value="news">Market News</TabsTrigger>
            <TabsTrigger value="agent">Finance Agent</TabsTrigger>
            <TabsTrigger value="performers">Top Performers</TabsTrigger>
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
