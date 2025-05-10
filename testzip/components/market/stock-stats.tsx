"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage, formatNumberWithCommas } from "@/lib/utils";

export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  dividend: number | null;
  avgVolume: number;
  high52Week: number;
  low52Week: number;
}

export interface StockStatsProps {
  data: StockData | null;
  isLoading: boolean;
}

export function StockStats({ data, isLoading }: StockStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[120px]" />
              </div>
            ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Statistics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please select a stock to view its statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span>
            {data.name} ({data.symbol})
          </span>
          <span className="flex items-center gap-2 text-xl font-bold">
            {formatCurrency(data.currentPrice, "USD")}
            <span
              className={`text-sm ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(data.change, "USD")} (
              {formatPercentage(data.changePercent / 100)})
            </span>
          </span>
        </CardTitle>
        <CardDescription>Key Statistics</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Open */}
        <div>
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.open, "USD")}
          </p>
        </div>

        {/* High */}
        <div>
          <p className="text-sm text-muted-foreground">High</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.high, "USD")}
          </p>
        </div>

        {/* Low */}
        <div>
          <p className="text-sm text-muted-foreground">Low</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.low, "USD")}
          </p>
        </div>

        {/* Volume */}
        <div>
          <p className="text-sm text-muted-foreground">Volume</p>
          <p className="text-sm font-medium">
            {formatNumberWithCommas(data.volume)}
          </p>
        </div>

        {/* Market Cap */}
        <div>
          <p className="text-sm text-muted-foreground">Market Cap</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.marketCap, "USD", true)}
          </p>
        </div>

        {/* P/E Ratio */}
        <div>
          <p className="text-sm text-muted-foreground">P/E Ratio</p>
          <p className="text-sm font-medium">
            {typeof data.peRatio === "number"
              ? data.peRatio.toFixed(2)
              : "N/A"}
          </p>
        </div>

        {/* Dividend Yield */}
        <div>
          <p className="text-sm text-muted-foreground">Dividend Yield</p>
          <p className="text-sm font-medium">
            {typeof data.dividend === "number"
              ? formatPercentage(data.dividend / 100)
              : "N/A"}
          </p>
        </div>

        {/* Avg. Volume */}
        <div>
          <p className="text-sm text-muted-foreground">Avg. Volume</p>
          <p className="text-sm font-medium">
            {formatNumberWithCommas(data.avgVolume)}
          </p>
        </div>

        {/* 52W High */}
        <div>
          <p className="text-sm text-muted-foreground">52W High</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.high52Week, "USD")}
          </p>
        </div>

        {/* 52W Low */}
        <div>
          <p className="text-sm text-muted-foreground">52W Low</p>
          <p className="text-sm font-medium">
            {formatCurrency(data.low52Week, "USD")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
