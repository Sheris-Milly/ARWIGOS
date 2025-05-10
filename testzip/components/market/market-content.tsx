"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { MarketNews } from "@/components/market/market-news";
import { fetchStockData } from "@/lib/api/market";
import { fetchNewsForSymbol } from "@/lib/api/news"; // Updated import
import { useToast } from "@/components/ui/use-toast";
import StockChart from "@/components/market/stock-chart";
import { StockStats } from "@/components/market/stock-stats";
import type { StockData as ApiStockData } from "@/lib/api/market";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function MarketContent() {
  // --- State ---
  const [symbol, setSymbol] = useState<string>("AAPL");
  const [inputSymbol, setInputSymbol] = useState<string>("AAPL");
  const [period, setPeriod] = useState<string>("1D");
  const periods = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"];

  const [stockData, setStockData] = useState<ApiStockData | null>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { toast } = useToast();

  // --- Effects ---
  useEffect(() => {
    loadStockData(symbol);
  }, [symbol]);

  // --- Data Loading ---
  const loadStockData = async (currentSymbol: string) => {
    setIsRefreshing(true);
    setIsLoading(true);
    setApiError(null);

    try {
      // Fetch stock data and news data (using the updated function)
      const [stockResponse, newsArticles] = await Promise.all([
        fetchStockData(currentSymbol),
        fetchNewsForSymbol(currentSymbol), // Use the updated function
      ]);

      if (!stockResponse?.quote) {
        throw new Error(`No data for "${currentSymbol}".`);
      }

      setStockData(stockResponse);
      // Adapt to the structure returned by fetchNewsForSymbol if necessary
      // Assuming fetchNewsForSymbol returns an array of articles directly
      setNewsData(newsArticles);
    } catch (err: any) {
      console.error(err);
      const msg =
        err.message || "Failed to load data; please try a different symbol.";
      setApiError(msg);
      setStockData(null);
      setNewsData([]);
      toast({
        title: "Error Loading Data",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- Handlers ---
  const handleSearch = () => {
    const up = inputSymbol.trim().toUpperCase();
    if (up && up !== symbol) setSymbol(up);
  };
  const handleRefresh = () => loadStockData(symbol);

  // --- Derived ---
  const quote = stockData?.quote;
  const stats = quote
    ? {
        symbol: quote.symbol,
        name: quote.name,
        currentPrice: quote.price,
        change: quote.change,
        changePercent: quote.change_percent,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        volume: quote.volume,
        marketCap: quote.market_cap,
        peRatio: quote.pe_ratio,
        dividend: quote.dividend_yield,
        avgVolume: quote.avg_volume,
        high52Week: quote.year_high,
        low52Week: quote.year_low,
      }
    : undefined;

  const timeSeries = stockData?.time_series || [];

  // --- Animations ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="container mx-auto p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Market Analysis
          </h1>
          <p className="text-muted-foreground">
            Real-time stock data and financial insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pr-10"
              disabled={isRefreshing}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleSearch}
              disabled={isRefreshing}
              aria-label="Search stock"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            {isRefreshing ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </motion.div>

      {/* Error Banner */}
      {apiError && (
        <motion.div
          className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start gap-3"
          variants={itemVariants}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Data Error</h3>
            <p className="text-sm">{apiError}</p>
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={itemVariants}
      >
        {/* Left: Chart & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <Card className="h-[450px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  {isLoading ? (
                    <>
                      <Skeleton className="h-7 w-24 mb-1" />
                      <Skeleton className="h-4 w-40" />
                    </>
                  ) : stats ? (
                    <>
                      <CardTitle className="text-xl font-semibold">
                        {stats.symbol}
                      </CardTitle>
                      <CardDescription>{stats.name}</CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-xl font-semibold">
                        {symbol}
                      </CardTitle>
                      <CardDescription>No data available</CardDescription>
                    </>
                  )}
                </div>
                <Tabs
                  value={period}
                  onValueChange={setPeriod}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full sm:w-auto">
                    {periods.map((p) => (
                      <TabsTrigger
                        key={p}
                        value={p}
                        disabled={isLoading || isRefreshing}
                      >
                        {p}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Price Info */}
              {!isLoading && stats && (
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {formatCurrency(stats.currentPrice)}
                  </span>
                  <span
                    className={`text-lg font-medium ${
                      stats.change >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stats.change >= 0 ? "+" : ""}
                    {formatCurrency(stats.change)} (
                    {formatPercentage(stats.changePercent / 100)})
                  </span>
                </div>
              )}
              {isLoading && (
                <div className="mt-4 flex items-baseline gap-2">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-grow pt-0 pb-4">
              <StockChart
                symbol={symbol}
                data={timeSeries.map((pt) => ({
                  timestamp: pt.timestamp,
                  price: pt.price,
                }))}
                period={period}
                isLoading={isLoading}
                isError={!!apiError || !stats}
              />
            </CardContent>
          </Card>

          {/* Key Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
              <CardDescription>Important metrics for {symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              <StockStats data={stats} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Right: News */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Related News</CardTitle>
              <CardDescription>Latest news articles for {symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              <MarketNews news={newsData} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
