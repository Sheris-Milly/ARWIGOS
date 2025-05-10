import { createClient } from '@/lib/supabase/client';

// Simple logging function as a placeholder for a full logging module
const getLogger = (module: string) => ({
  info: (message: string, ...args: any[]) => console.log(`[INFO] [${module}]`, message, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] [${module}]`, message, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] [${module}]`, message, ...args)
});

const logger = getLogger('market-api');

// Types for our market data
interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
}

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
}

interface StockQuote {
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
}

interface TimeSeriesPoint {
  timestamp: number;
  price: number;
}

interface MarketData {
  indexes: MarketIndex[];
  gainers: StockMover[];
  losers: StockMover[];
}

interface StockData {
  quote: StockQuote;
  time_series: TimeSeriesPoint[];
}

// Types for API responses
interface IndexData {
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
  change_percentage?: string;
  [key: string]: any;
}

interface MoverData {
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
  change_percentage?: string;
  [key: string]: any;
}

interface QuoteData {
  name?: string;
  price?: string;
  change?: string;
  change_percentage?: string;
  open?: string;
  high?: string;
  low?: string;
  volume?: string;
  market_cap?: string;
  pe_ratio?: string;
  [key: string]: any;
}

interface TimeSeriesData {
  date?: string;
  close?: string;
  [key: string]: any;
}

const CACHE_TIME_HOURS = 1; // Cache market data for 1 hour

// Function to fetch market data (indexes, market movers)
export async function fetchMarketData(): Promise<MarketData> {
  try {
    // Try to get cached data first
    const supabase = createClient();
    const { data: cachedData, error: cacheError } = await supabase
      .from('market_cache')
      .select('*')
      .eq('type', 'market_data')
      .single();

    if (!cacheError && cachedData) {
      const cacheAge = new Date().getTime() - new Date(cachedData.updated_at).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);
      
      if (cacheAgeHours < CACHE_TIME_HOURS) {
        logger.info('Using cached market data');
        return cachedData.data as MarketData;
      }
    }

    // If no valid cache, fetch from API
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    
    if (!apiKey) {
      logger.warn('No RapidAPI key found, using simulated data');
      return simulateMarketData();
    }

    // Fetch market indexes (major indices)
    const indexesResponse = await fetch(
      'https://real-time-finance-data.p.rapidapi.com/market-indices',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-finance-data.p.rapidapi.com'
        },
        next: { revalidate: 60 } // Revalidate cache every minute
      }
    );

    if (!indexesResponse.ok) {
      throw new Error(`API error: ${indexesResponse.status}`);
    }

    const indexesData = await indexesResponse.json();

    // Fetch market movers (gainers and losers)
    const moversResponse = await fetch(
      'https://real-time-finance-data.p.rapidapi.com/market-movers?type=gainers',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-finance-data.p.rapidapi.com'
        },
        next: { revalidate: 60 }
      }
    );

    if (!moversResponse.ok) {
      throw new Error(`API error: ${moversResponse.status}`);
    }

    const gainersData = await moversResponse.json();

    // Fetch market losers
    const losersResponse = await fetch(
      'https://real-time-finance-data.p.rapidapi.com/market-movers?type=losers',
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-finance-data.p.rapidapi.com'
        },
        next: { revalidate: 60 }
      }
    );

    if (!losersResponse.ok) {
      throw new Error(`API error: ${losersResponse.status}`);
    }

    const losersData = await losersResponse.json();

    // Transform and combine the data
    const marketData: MarketData = {
      indexes: transformIndexes(indexesData.data),
      gainers: transformMovers(gainersData.data),
      losers: transformMovers(losersData.data)
    };

    // Save to cache
    await supabase
      .from('market_cache')
      .upsert(
        {
          type: 'market_data',
          data: marketData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'type' }
      );

    return marketData;
  } catch (error) {
    logger.error('Error fetching market data:', error);
    return simulateMarketData();
  }
}

// Function to fetch stock data for a specific symbol
export async function fetchStockData(symbol: string): Promise<StockData> {
  try {
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Try to get cached data first
    const supabase = createClient();
    const { data: cachedData, error: cacheError } = await supabase
      .from('stock_cache')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (!cacheError && cachedData) {
      const cacheAge = new Date().getTime() - new Date(cachedData.updated_at).getTime();
      const cacheAgeHours = cacheAge / (1000 * 60 * 60);
      
      if (cacheAgeHours < CACHE_TIME_HOURS) {
        logger.info(`Using cached data for ${symbol}`);
        return cachedData.data as StockData;
      }
    }

    // If no valid cache, fetch from API
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    
    if (!apiKey) {
      logger.warn('No RapidAPI key found, using simulated data');
      return simulateStockData(symbol);
    }

    // Fetch stock quote data
    const quoteResponse = await fetch(
      `https://real-time-finance-data.p.rapidapi.com/stock-quote?symbol=${symbol}&language=en`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-finance-data.p.rapidapi.com'
        },
        next: { revalidate: 60 }
      }
    );

    if (!quoteResponse.ok) {
      throw new Error(`API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();

    // Fetch historical data
    const historicalResponse = await fetch(
      `https://real-time-finance-data.p.rapidapi.com/stock-time-series?symbol=${symbol}&period=1y&language=en`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-finance-data.p.rapidapi.com'
        },
        next: { revalidate: 60 }
      }
    );

    if (!historicalResponse.ok) {
      throw new Error(`API error: ${historicalResponse.status}`);
    }

    const historicalData = await historicalResponse.json();

    // Transform and combine the data
    const stockData: StockData = {
      quote: transformQuote(quoteData.data, symbol),
      time_series: transformTimeSeries(historicalData.data)
    };

    // Save to cache
    await supabase
      .from('stock_cache')
      .upsert(
        {
          symbol,
          data: stockData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'symbol' }
      );

    return stockData;
  } catch (error) {
    logger.error(`Error fetching stock data for ${symbol}:`, error);
    return simulateStockData(symbol);
  }
}

// Helper functions to transform API responses

function transformIndexes(indexesData: IndexData[]): MarketIndex[] {
  // Transform the indexes data to our expected format
  return indexesData.map(index => ({
    symbol: index.symbol || '',
    name: index.name || '',
    price: parseFloat(index.price || '0') || 0,
    change: parseFloat(index.change || '0') || 0,
    percentChange: parseFloat(index.change_percentage || '0') || 0
  })).slice(0, 4); // Return only top 4 indices
}

function transformMovers(moversData: MoverData[]): StockMover[] {
  // Transform the movers data to our expected format
  return moversData.map(stock => ({
    symbol: stock.symbol || '',
    name: stock.name || '',
    price: parseFloat(stock.price || '0') || 0,
    change: parseFloat(stock.change || '0') || 0,
    percentChange: parseFloat(stock.change_percentage || '0') || 0
  })).slice(0, 5); // Return only top 5 movers
}

function transformQuote(quoteData: QuoteData, symbol: string): StockQuote {
  // Transform the quote data to our expected format
  const peRatio = quoteData.pe_ratio ? (isNaN(parseFloat(quoteData.pe_ratio)) ? null : parseFloat(quoteData.pe_ratio)) : null;
  return {
    symbol: symbol,
    name: quoteData.name || symbol,
    currentPrice: parseFloat(quoteData.price || '0') || 0,
    change: parseFloat(quoteData.change || '0') || 0,
    changePercent: parseFloat(quoteData.change_percentage || '0') || 0,
    open: parseFloat(quoteData.open || '0') || 0,
    high: parseFloat(quoteData.high || '0') || 0,
    low: parseFloat(quoteData.low || '0') || 0,
    volume: parseInt(quoteData.volume || '0') || 0,
    marketCap: parseFloat(quoteData.market_cap || '0') || 0,
    peRatio: peRatio
  };
}

function transformTimeSeries(timeSeriesData: TimeSeriesData[] | Record<string, TimeSeriesData>): TimeSeriesPoint[] {
  // Transform the time series data to our expected format
  if (!timeSeriesData) return [];
  
  // Handle array format
  if (Array.isArray(timeSeriesData)) {
    return timeSeriesData.map(point => ({
      timestamp: new Date(point.date || '').getTime(),
      price: parseFloat(point.close || '0') || 0
    }));
  }
  
  // Handle object format
  return Object.entries(timeSeriesData).map(([date, point]) => ({
    timestamp: new Date(date).getTime(),
    price: parseFloat(point.close || '0') || 0
  }));
}

// Simulation functions for fallback data

function simulateMarketData(): MarketData {
  const now = new Date();
  
  return {
    indexes: [
      { symbol: '^DJI', name: 'Dow Jones', price: 38567.12, change: 145.67, percentChange: 0.38 },
      { symbol: '^GSPC', name: 'S&P 500', price: 5021.84, change: 28.32, percentChange: 0.57 },
      { symbol: '^IXIC', name: 'NASDAQ', price: 15963.21, change: 184.74, percentChange: 1.17 },
      { symbol: '^RUT', name: 'Russell 2000', price: 2014.56, change: -3.84, percentChange: -0.19 }
    ],
    gainers: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 182.63, change: 7.84, percentChange: 4.48 },
      { symbol: 'MSFT', name: 'Microsoft', price: 403.78, change: 10.45, percentChange: 2.66 },
      { symbol: 'AMZN', name: 'Amazon', price: 168.59, change: 3.84, percentChange: 2.33 },
      { symbol: 'NVDA', name: 'NVIDIA', price: 721.33, change: 15.74, percentChange: 2.23 },
      { symbol: 'GOOGL', name: 'Alphabet', price: 142.65, change: 2.34, percentChange: 1.67 }
    ],
    losers: [
      { symbol: 'META', name: 'Meta Platforms', price: 472.22, change: -8.36, percentChange: -1.74 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 193.57, change: -3.25, percentChange: -1.65 },
      { symbol: 'JPM', name: 'JPMorgan Chase', price: 184.29, change: -2.15, percentChange: -1.15 },
      { symbol: 'V', name: 'Visa Inc.', price: 275.36, change: -2.89, percentChange: -1.04 },
      { symbol: 'PG', name: 'Procter & Gamble', price: 162.84, change: -1.53, percentChange: -0.93 }
    ]
  };
}

function simulateStockData(symbol: string): StockData {
  // Generate realistic-looking stock data for the given symbol
  const basePrice = getBasePrice(symbol);
  const dates = generateDates(365);
  const prices = generatePrices(dates.length, basePrice);
  
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  return {
    quote: {
      symbol: symbol,
      name: getCompanyName(symbol),
      currentPrice: currentPrice,
      change: change,
      changePercent: changePercent,
      open: currentPrice - (Math.random() * 2 - 1),
      high: currentPrice + (Math.random() * 2),
      low: currentPrice - (Math.random() * 2),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: currentPrice * (Math.floor(Math.random() * 10000000000) + 1000000000),
      peRatio: Math.floor(Math.random() * 40) + 10
    },
    time_series: dates.map((date, index) => ({
      timestamp: date.getTime(),
      price: prices[index]
    }))
  };
}

function getBasePrice(symbol: string): number {
  // Return a realistic base price for common stocks
  const prices: Record<string, number> = {
    'AAPL': 180,
    'MSFT': 400,
    'GOOGL': 140,
    'AMZN': 170,
    'META': 470,
    'NVDA': 720,
    'TSLA': 190,
    'JPM': 185,
    'V': 275,
    'PG': 160
  };
  
  return prices[symbol] || Math.floor(Math.random() * 500) + 50;
}

function getCompanyName(symbol: string): string {
  // Return company names for common stock symbols
  const names: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'TSLA': 'Tesla Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'PG': 'Procter & Gamble Co.'
  };
  
  return names[symbol] || `${symbol} Corporation`;
}

function generateDates(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }
  
  return dates;
}

function generatePrices(length: number, basePrice: number): number[] {
  const prices: number[] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < length; i++) {
    // Add some volatility
    const change = (Math.random() - 0.5) * (basePrice * 0.02);
    currentPrice = Math.max(currentPrice + change, 1); // Ensure price doesn't go below 1
    prices.push(parseFloat(currentPrice.toFixed(2)));
  }
  
  return prices;
}