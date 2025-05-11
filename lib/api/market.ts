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
  rawData?: any; // Store the raw API response
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
// Helper functions to transform Alpha Vantage API responses

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
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'XBYMG2VY49SX4K21';
    
    if (!apiKey) {
      logger.warn('No Alpha Vantage API key found, using simulated data');
      return simulateMarketData();
    }

    // Fetch top gainers and losers
    const moversResponse = await fetch(
      `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`
    );

    if (!moversResponse.ok) {
      throw new Error(`API error: ${moversResponse.status}`);
    }

    const moversData = await moversResponse.json();
    
    // Fetch major market indices using GLOBAL_QUOTE for major ETFs
    // SPY = S&P 500, DIA = Dow Jones, QQQ = NASDAQ, IWM = Russell 2000
    const majorIndices = ['SPY', 'DIA', 'QQQ', 'IWM'];
    const indexPromises = majorIndices.map(symbol => 
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
        .then(res => {
          if (!res.ok) {
            logger.warn(`Failed to fetch index data for ${symbol}: ${res.status}`);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          logger.warn(`Error fetching index data for ${symbol}:`, err);
          return null;
        })
    );
    
    const indexResults = await Promise.all(indexPromises);
    
    // Extract gainers and losers data
    const gainersData = { data: moversData.top_gainers || [] };
    const losersData = { data: moversData.top_losers || [] };

    // Transform and combine the data
    const marketData: MarketData = {
      indexes: transformAlphaVantageIndices(indexResults, majorIndices),
      gainers: transformAlphaVantageMovers(gainersData.data),
      losers: transformAlphaVantageMovers(losersData.data)
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
        console.log(`Using cached data for ${symbol}:`, cachedData.data);
        return cachedData.data as StockData;
      }
    }

    // If no valid cache, fetch from API
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'XBYMG2VY49SX4K21';
    
    if (!apiKey) {
      logger.warn('No Alpha Vantage API key found');
      throw new Error('API key is required to fetch stock data');
    }

    console.log(`Fetching data for ${symbol} from Alpha Vantage API`);
    
    // Fetch quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    console.log(`Quote URL: ${quoteUrl}`);
    
    const quoteResponse = await fetch(quoteUrl);

    if (!quoteResponse.ok) {
      throw new Error(`API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();
    console.log(`Quote data for ${symbol}:`, quoteData);
    
    // Check if API returned an error or empty data
    if (quoteData.Note || quoteData.Information || Object.keys(quoteData).length === 0) {
      console.log(`API limit reached or invalid response for ${symbol}:`, quoteData);
      // Try to get data from database as fallback
      const { data: stockDetails } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single();
      
      if (stockDetails && stockDetails.last_price) {
        console.log(`Using stock details from database for ${symbol}:`, stockDetails);
        return {
          quote: {
            symbol: symbol,
            name: stockDetails.name || symbol,
            currentPrice: stockDetails.last_price,
            change: 0,
            changePercent: 0,
            open: stockDetails.last_price,
            high: stockDetails.last_price,
            low: stockDetails.last_price,
            volume: 0,
            marketCap: 0,
            peRatio: null
          },
          time_series: []
        };
      }
      
      // Return a default object with zeros instead of throwing an error
      console.log(`No data available for ${symbol}, returning zeros`);
      return {
        quote: {
          symbol: symbol,
          name: symbol,
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          marketCap: 0,
          peRatio: null
        },
        time_series: []
      };
    }
    
    // Check if Global Quote exists and has data
    if (!quoteData['Global Quote'] || Object.keys(quoteData['Global Quote']).length === 0) {
      console.log(`No Global Quote data for ${symbol}:`, quoteData);
      // Return a default object with zeros
      return {
        quote: {
          symbol: symbol,
          name: symbol,
          currentPrice: 0,
          change: 0,
          changePercent: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          marketCap: 0,
          peRatio: null
        },
        time_series: []
      };
    }
    
    // Log the exact data we're working with
    console.log(`Global Quote data for ${symbol}:`, quoteData['Global Quote']);
    console.log(`Price from API: ${quoteData['Global Quote']['05. price']}`);
    
    
    // Fetch time series data
    const timeSeriesResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`
    );

    if (!timeSeriesResponse.ok) {
      throw new Error(`API error: ${timeSeriesResponse.status}`);
    }

    const timeSeriesData = await timeSeriesResponse.json();

    // Transform the data
    const stockData: StockData = {
      quote: transformAlphaVantageQuote(quoteData['Global Quote'] || {}, symbol),
      time_series: transformAlphaVantageTimeSeries(timeSeriesData['Time Series (Daily)'] || {}),
      rawData: quoteData // Store the raw API response
    };
    
    console.log(`Transformed stock data for ${symbol}:`, stockData);

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
  } catch (error: any) {
    // Log the error but don't throw it
    logger.warn(`API error for ${symbol}: ${error?.message || 'Unknown error'}`);
    console.log(`Using fallback data for ${symbol} due to API error`);
    
    // Try to get data from database as fallback
    try {
      const supabase = createClient();
      const { data: stockDetails } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single();
      
      if (stockDetails && stockDetails.last_price) {
        console.log(`Using stock details from database for ${symbol}:`, stockDetails);
        return {
          quote: {
            symbol: symbol,
            name: stockDetails.name || symbol,
            currentPrice: stockDetails.last_price,
            change: 0,
            changePercent: 0,
            open: stockDetails.last_price,
            high: stockDetails.last_price,
            low: stockDetails.last_price,
            volume: 0,
            marketCap: 0,
            peRatio: null
          },
          time_series: []
        };
      }
    } catch (dbError) {
      console.log(`Database fallback failed for ${symbol}:`, dbError);
    }
    
    // Return an empty stock data object with zeros
    return {
      quote: {
        symbol: symbol,
        name: symbol,
        currentPrice: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        marketCap: 0,
        peRatio: null
      },
      time_series: []
    };
  }
}
// Helper functions to transform Alpha Vantage API responses
function transformAlphaVantageIndices(indexData: any[], symbols: string[]): MarketIndex[] {
  return indexData.map((data, index) => {
    const quote = data['Global Quote'];
    if (!quote) return null;
    
    return {
      symbol: symbols[index],
      name: getIndexName(symbols[index]),
      price: parseFloat(quote['05. price'] || '0'),
      change: parseFloat(quote['09. change'] || '0'),
      percentChange: parseFloat(quote['10. change percent']?.replace('%', '') || '0')
    };
  }).filter(Boolean);
}

function transformAlphaVantageMovers(moversData: any[]): StockMover[] {
  return moversData.map(mover => ({
    symbol: mover.ticker || '',
    name: mover.name || mover.ticker || '',
    price: parseFloat(mover.price || '0'),
    change: parseFloat(mover.change_amount || '0'),
    percentChange: parseFloat(mover.change_percentage?.replace('%', '') || '0')
  })).filter(mover => mover.symbol);
}

// Helper function to get index name from symbol
function getIndexName(symbol: string): string {
  const indexMap = {
    'SPY': 'S&P 500',
    'DIA': 'Dow Jones',
    'QQQ': 'NASDAQ',
    'IWM': 'Russell 2000'
  };
  return indexMap[symbol] || symbol;
}
// Helper functions to transform API responses



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
function transformAlphaVantageQuote(quoteData: any, symbol: string): StockQuote {
  // Log the exact data we're transforming to help with debugging
  console.log(`Transforming quote data for ${symbol}:`, quoteData);
  
  // Extract the price and make sure it's a number
  const price = quoteData['05. price'] ? parseFloat(quoteData['05. price']) : 0;
  console.log(`Extracted price for ${symbol}: ${price}`);
  
  return {
    symbol: symbol,
    name: getCompanyName(symbol), // Use helper function to get name
    currentPrice: price,
    change: parseFloat(quoteData['09. change'] || '0'),
    changePercent: parseFloat(quoteData['10. change percent']?.replace('%', '') || '0'),
    open: parseFloat(quoteData['02. open'] || '0'),
    high: parseFloat(quoteData['03. high'] || '0'),
    low: parseFloat(quoteData['04. low'] || '0'),
    volume: parseInt(quoteData['06. volume'] || '0', 10),
    marketCap: 0, // Not provided by Alpha Vantage GLOBAL_QUOTE
    peRatio: null // Not provided by Alpha Vantage GLOBAL_QUOTE
  };
}

function transformAlphaVantageTimeSeries(timeSeriesData: any): TimeSeriesPoint[] {
  return Object.entries(timeSeriesData).map(([date, data]: [string, any]) => ({
    timestamp: new Date(date).getTime(),
    price: parseFloat(data['4. close'] || '0')
  })).sort((a, b) => a.timestamp - b.timestamp);
}
function simulateStockData(symbol: string): StockData {
  // Use consistent prices for stocks
  const basePrice = getBasePrice(symbol);
  
  // Generate consistent time series data
  const dates = generateDates(365);
  
  // Use a deterministic approach to generate prices instead of random
  // This ensures the same stock always gets the same price
  const prices = generateConsistentPrices(dates.length, basePrice, symbol);
  
  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2];
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  // Log the simulated price for debugging
  console.log(`Using simulated price for ${symbol}: ${currentPrice} (base: ${basePrice})`);
  
  return {
    quote: {
      symbol: symbol,
      name: getCompanyName(symbol),
      currentPrice: currentPrice,
      change: change,
      changePercent: changePercent,
      open: currentPrice * 0.99, // Consistent open price
      high: currentPrice * 1.01, // Consistent high
      low: currentPrice * 0.98,  // Consistent low
      volume: 1000000 + (symbol.charCodeAt(0) * 10000), // Deterministic volume based on symbol
      marketCap: currentPrice * 1000000000, // Simple market cap calculation
      peRatio: 15 + (symbol.length * 2) // Deterministic PE ratio based on symbol length
    },
    time_series: dates.map((date, index) => ({
      timestamp: date.getTime(),
      price: prices[index]
    }))
  };
}

function generateConsistentPrices(count: number, basePrice: number, symbol: string): number[] {
  // Create a deterministic seed based on the symbol
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i);
  }
  
  const prices: number[] = [];
  let price = basePrice;
  
  // Generate a consistent price series based on the symbol
  for (let i = 0; i < count; i++) {
    // Use a deterministic formula based on the symbol and position
    const change = Math.sin(i * 0.1 + seed * 0.01) * 0.02; // Small fluctuation based on position and symbol
    price = price * (1 + change);
    prices.push(parseFloat(price.toFixed(2)));
  }
  
  return prices;
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
  
  // For unknown symbols, generate a consistent price based on the symbol characters
  if (!prices[symbol]) {
    let baseValue = 0;
    for (let i = 0; i < symbol.length; i++) {
      baseValue += symbol.charCodeAt(i);
    }
    return 50 + (baseValue % 450); // Range from 50 to 500
  }
  
  return prices[symbol];
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