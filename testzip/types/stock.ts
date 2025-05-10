/**
 * Types for stock data
 */

/**
 * Represents stock price and metadata
 */
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividend: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

/**
 * Historical stock price point
 */
export interface StockPricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * Historical stock price data
 */
export interface StockChartData {
  symbol: string;
  prices: StockPricePoint[];
}

/**
 * News article about a stock or market
 */
export interface StockNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  thumbnail?: string;
  description?: string;
} 