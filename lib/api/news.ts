// This file handles financial news API integration
import { createClient } from "@/lib/supabase/client";

// Create Supabase client
const supabaseClient = createClient();

// API Configuration
const API_HOST = 'real-time-finance-data.p.rapidapi.com';
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || ''; // Use environment variable

// Define interfaces for API response
interface NewsApiResponse {
  status: string;
  request_id: string;
  data: {
    symbol: string;
    type: string;
    news: NewsItem[];
  };
}

interface NewsItem {
  article_title: string;
  article_url: string;
  article_photo_url: string;
  source: string;
  post_time_utc: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
  symbol: string;
}

/**
 * Fetches news articles for a given stock symbol
 */
export async function fetchNewsForSymbol(symbol: string): Promise<NewsArticle[]> {
  const url = `https://real-time-finance-data.p.rapidapi.com/stock-news?symbol=${symbol}&language=en`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: NewsApiResponse = await response.json();
    
    if (data.status !== "OK" || !data.data?.news) {
      throw new Error('Invalid API response format');
    }

    return data.data.news.map(item => ({
      id: item.article_url, // Using URL as unique ID
      title: item.article_title,
      description: item.article_title, // Using title as description since API doesn't provide one
      url: item.article_url,
      imageUrl: item.article_photo_url,
      source: item.source,
      publishedAt: item.post_time_utc,
      symbol: symbol
    }));

  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetches news articles relevant to the user's portfolio
 */
export async function fetchNewsForPortfolio(): Promise<NewsArticle[]> {
  const CACHE_KEY = 'portfolio_news';
  const CACHE_DURATION = 30; // minutes

  try {
    // Check cache first
    const { data: cachedData } = await supabaseClient
      .from('stock_cache')
      .select('*')
      .eq('type', CACHE_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (cachedData?.[0]) {
      const cacheAge = (Date.now() - new Date(cachedData[0].created_at).getTime()) / (1000 * 60);
      if (cacheAge < CACHE_DURATION) {
        return JSON.parse(cachedData[0].data);
      }
    }

    // Get portfolio symbols (using example symbols for now)
    const portfolioSymbols = ['AAPL', 'MSFT', 'GOOGL'];
    
    // Fetch news for all symbols in parallel
    const newsPromises = portfolioSymbols.map(symbol => fetchNewsForSymbol(symbol));
    const newsResults = await Promise.all(newsPromises);
    
    // Combine and deduplicate news articles
    const uniqueArticles = new Map<string, NewsArticle>();
    newsResults.flat().forEach(article => {
      if (!uniqueArticles.has(article.url)) {
        uniqueArticles.set(article.url, article);
      }
    });

    // Convert to array and sort by date
    const articles = Array.from(uniqueArticles.values())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10); // Limit to 10 most recent articles

    // Cache the results
    if (articles.length > 0) {
      await supabaseClient.from('stock_cache').upsert({
        type: CACHE_KEY,
        data: JSON.stringify(articles),
        created_at: new Date().toISOString()
      }, { onConflict: 'type' });
    }

    return articles;

  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    return [];
  }
}

/**
 * Fetches the latest general financial news
 * @returns Promise with the latest news
 */
export async function fetchLatestNews() {
  try {
    // Try to get cached data from Supabase first
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('news_cache')
      .select('*')
      .eq('type', 'latest_news')
      .order('created_at', { ascending: false })
      .limit(1);

    // Check if we have valid cached data less than 1 hour old
    if (cachedData && cachedData.length > 0) {
      const cacheTime = new Date(cachedData[0].created_at);
      const now = new Date();
      const cacheAge = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60); // in hours
      
      if (cacheAge < 1) { // Less than 1 hour old
        console.log('Using cached latest news data');
        return JSON.parse(cachedData[0].data);
      }
    }
    
    // Check if we're missing API key - go straight to simulated data
    if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY) {
      console.log('Using simulated news data - API key missing');
      return { articles: simulateLatestNews() };
    }
    
    // Use Real-Time Finance API for general financial news
    const url = 'https://real-time-finance-data.p.rapidapi.com/market-trends';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`News API request failed with status ${response.status}`);
      return { articles: simulateLatestNews() };
    }

    const data = await response.json();
    
    if (!data || data.status !== "OK" || !data.data || !data.data.news || !Array.isArray(data.data.news)) {
      console.error('Invalid response format from news API');
      return { articles: simulateLatestNews() };
    }

    // Transform the data to match our expected format
    const articles = data.data.news.map((item: any) => ({
      title: item.article_title || 'Financial News',
      description: item.article_summary || item.article_title || '',
      url: item.article_url || '#',
      source: { name: item.source || 'Financial News' },
      publishedAt: item.post_time_utc || new Date().toISOString(),
      urlToImage: item.article_photo_url || null
    }));

    const result = { articles };
    
    // Save to cache in Supabase
    await supabaseClient.from('news_cache').insert({
      type: 'latest_news',
      data: JSON.stringify(result),
      created_at: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching latest news:', error);
    return { articles: simulateLatestNews() };
  }
}

/**
 * Fetches news related to a specific stock
 * @param symbol Stock symbol (e.g., AAPL, MSFT)
 * @returns Promise with stock news
 */
export async function fetchStockNews(symbol: string) {
  try {
    // Try to get cached data from Supabase first
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('stock_cache')
      .select('*')
      .eq('type', `news_${symbol}`)
      .order('created_at', { ascending: false })
      .limit(1);

    // Check if we have valid cached data less than 1 hour old
    if (cachedData && cachedData.length > 0) {
      const cacheTime = new Date(cachedData[0].created_at);
      const now = new Date();
      const cacheAge = (now.getTime() - cacheTime.getTime()) / (1000 * 60); // in minutes
      
      if (cacheAge < 60) { // Less than 1 hour old
        console.log(`Using cached news data for ${symbol}`);
        return JSON.parse(cachedData[0].data);
      }
    }
    
    // Check if we're missing API key - go straight to simulated data
    if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY) {
      console.log(`Using simulated news data for ${symbol} - API key missing`);
      return { data: simulateStockNews(symbol, 5) };
    }
    
    // Use Real-Time Finance API for stock-specific news
    const url = `https://real-time-finance-data.p.rapidapi.com/stock-news?symbol=${symbol}&language=en`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "",
        'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.error(`Stock news API request failed with status ${response.status}`);
        return { data: simulateStockNews(symbol, 5) };
      }
      
      const data = await response.json();
      
      if (!data || data.status !== "OK" || !data.data || !data.data.news) {
        return { data: simulateStockNews(symbol, 5) };
      }
      
      // Format the response to match our expected structure
      const formattedNews = data.data.news.map((item: any) => ({
        uuid: `news-${Math.random().toString(36).substring(2, 15)}`,
        title: item.article_title || `${symbol} News`,
        link: item.article_url || '#',
        source: item.source || 'Financial News',
        published_at: item.post_time_utc || new Date().toISOString(),
        summary: item.article_title || `Latest news about ${symbol}`,
        image_url: item.article_photo_url || null,
        tickers: [symbol]
      }));
      
      const result = { data: formattedNews.slice(0, 5) };
      
      // Save to cache in Supabase
      await supabaseClient.from('stock_cache').insert({
        type: `news_${symbol}`,
        data: JSON.stringify(result),
        created_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error("Error in Stock News API request:", error);
      return { data: simulateStockNews(symbol, 5) };
    }
  } catch (error) {
    console.error("Error fetching stock news:", error);
    return { data: simulateStockNews(symbol, 5) };
  }
}

/**
 * Fetches trending news topics
 * @returns Promise with trending news
 */
export async function fetchTrendingNews() {
  try {
    // Try to get cached data from Supabase first
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('news_cache')
      .select('*')
      .eq('type', 'trending_news')
      .order('created_at', { ascending: false })
      .limit(1);

    // Check if we have valid cached data less than 3 hours old
    if (cachedData && cachedData.length > 0) {
      const cacheTime = new Date(cachedData[0].created_at);
      const now = new Date();
      const cacheAge = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60); // in hours
      
      if (cacheAge < 3) { // Less than 3 hours old
        console.log('Using cached trending news data');
        return JSON.parse(cachedData[0].data);
      }
    }

    // Check if we're missing API key - go straight to simulated data
    if (!process.env.NEXT_PUBLIC_RAPIDAPI_KEY) {
      console.log('Using simulated trending news data - API key missing');
      return { topics: simulateTrendingTopics() };
    }

    // Use Real-Time Finance API for trending topics
    const url = 'https://real-time-finance-data.p.rapidapi.com/market-trends';
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Trending news API request failed with status ${response.status}`);
      return { topics: simulateTrendingTopics() };
    }

    const data = await response.json();
    
    if (!data || data.status !== "OK" || !data.data || !data.data.trending_topics || !Array.isArray(data.data.trending_topics)) {
      console.error('Invalid response format from trending news API');
      return { topics: simulateTrendingTopics() };
    }

    // Transform the data to match our expected format
    const topics = data.data.trending_topics.map((item: any) => ({
      title: item.topic || 'Financial Topic',
      query: item.topic || '',
      articles: item.related_news.map((news: any) => ({
        title: news.article_title || 'Financial News',
        url: news.article_url || '#',
        source: news.source || 'Financial News'
      }))
    }));

    const result = { topics };
    
    // Save to cache in Supabase
    await supabaseClient.from('news_cache').insert({
      type: 'trending_news',
      data: JSON.stringify(result),
      created_at: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return { topics: simulateTrendingTopics() };
  }
}

// Helper function to simulate latest news
function simulateLatestNews() {
  const titles = [
    'Markets React to Federal Reserve Interest Rate Decision',
    'Tech Stocks Rally on Strong Earnings Reports',
    'Global Markets Mixed as Investors Await Economic Data',
    'Banking Sector Faces New Regulatory Challenges',
    'Energy Prices Surge Amid Supply Chain Disruptions',
    'Retail Sales Data Shows Shifting Consumer Spending Patterns',
    'Housing Market Shows Signs of Cooling After Record Highs',
    'Cryptocurrency Market Volatility Continues to Challenge Investors'
  ];

  const sources = ['Bloomberg', 'Reuters', 'Wall Street Journal', 'CNBC', 'Financial Times'];
  const articles = [];

  // Generate 8 simulated articles
  for (let i = 0; i < 8; i++) {
    const randomDate = new Date();
    randomDate.setHours(randomDate.getHours() - Math.floor(Math.random() * 24)); // Random time in the last 24 hours

    articles.push({
      title: titles[i],
      description: 'Financial news and market updates from around the global economy.',
      url: '#',
      source: { name: sources[Math.floor(Math.random() * sources.length)] },
      publishedAt: randomDate.toISOString(),
      urlToImage: `https://placehold.co/600x400?text=Financial+News`
    });
  }

  return articles;
}

// Helper function to simulate trending topics
function simulateTrendingTopics() {
  const trendingTopics = [
    {
      title: 'Federal Reserve',
      query: 'federal reserve interest rates',
      articles: [
        { title: 'Fed Signals Potential Rate Cut in Coming Months', url: '#', source: 'Bloomberg' },
        { title: 'Markets React to Federal Reserve Comments on Inflation', url: '#', source: 'CNBC' },
        { title: 'What the Latest Fed Decision Means for Your Money', url: '#', source: 'Wall Street Journal' }
      ]
    },
    {
      title: 'Tech Earnings',
      query: 'technology company earnings',
      articles: [
        { title: 'Major Tech Companies Report Strong Q2 Earnings', url: '#', source: 'Reuters' },
        { title: 'Tech Giants Beat Analyst Expectations', url: '#', source: 'Financial Times' },
        { title: 'What\'s Next for Tech Stocks After Earnings Season', url: '#', source: 'CNBC' }
      ]
    },
    {
      title: 'Inflation Data',
      query: 'inflation economic data',
      articles: [
        { title: 'Consumer Price Index Shows Inflation Cooling', url: '#', source: 'Wall Street Journal' },
        { title: 'Analysts React to Latest Inflation Numbers', url: '#', source: 'Bloomberg' },
        { title: 'How Inflation is Affecting Different Market Sectors', url: '#', source: 'Reuters' }
      ]
    },
    {
      title: 'Oil Prices',
      query: 'oil price crude',
      articles: [
        { title: 'Crude Oil Prices Surge on Supply Constraints', url: '#', source: 'CNBC' },
        { title: 'Energy Sector Responds to Changing Oil Dynamics', url: '#', source: 'Financial Times' },
        { title: 'What Rising Oil Prices Mean for the Economy', url: '#', source: 'Bloomberg' }
      ]
    },
    {
      title: 'Cryptocurrency',
      query: 'cryptocurrency bitcoin ethereum',
      articles: [
        { title: 'Bitcoin Rallies Above Key Resistance Level', url: '#', source: 'Reuters' },
        { title: 'Institutional Investors Increasing Crypto Exposure', url: '#', source: 'Wall Street Journal' },
        { title: 'Regulatory Developments in Cryptocurrency Markets', url: '#', source: 'Bloomberg' }
      ]
    }
  ];

  return trendingTopics;
}

// Helper function to simulate stock news data
function simulateStockNews(ticker: string, count: number) {
  const stockSymbol = ticker.toUpperCase()
  const stockName = getStockName(stockSymbol)

  // Generate news based on the stock
  const news = []
  const now = new Date()

  // Common news sources
  const sources = [
    "Bloomberg",
    "CNBC",
    "Reuters",
    "Wall Street Journal",
    "Financial Times",
    "MarketWatch",
    "Barron's",
    "Investor's Business Daily",
  ]

  // Generate news headlines based on the stock
  const headlines = [
    {
      title: `${stockName} Reports Strong Quarterly Earnings, Beats Expectations`,
      photo: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `Analysts Raise Price Target for ${stockName} Following Product Launch`,
      photo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `${stockName} Announces New Strategic Partnership to Expand Market Reach`,
      photo: "https://images.unsplash.com/photo-1560472355-536de3962603?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `${stockName} CEO Discusses Future Growth Strategies in Exclusive Interview`,
      photo: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `${stockName} Faces Regulatory Scrutiny Over Recent Business Practices`,
      photo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `Investors React to ${stockName}'s Latest Product Announcement`,
      photo: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `${stockName} Stock Surges Following Positive Industry Trends`,
      photo: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=300&auto=format&fit=crop",
    },
    {
      title: `Market Analysis: Is ${stockName} Overvalued in Current Market Conditions?`,
      photo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=300&auto=format&fit=crop",
    },
  ]

  // Generate news items
  for (let i = 0; i < count; i++) {
    const randomTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in the last week
    const randomSource = sources[Math.floor(Math.random() * sources.length)]

    news.push({
      uuid: `news-${Math.random().toString(36).substring(2, 15)}`,
      title: headlines[i % headlines.length].title,
      link: `https://example.com/news/${stockSymbol.toLowerCase()}-${i}`,
      source: randomSource,
      published_at: randomTime.toISOString(),
      summary: headlines[i % headlines.length].title || `Latest news about ${stockSymbol}`,
      image_url: headlines[i % headlines.length].photo,
      tickers: [stockSymbol]
    })
  }

  return news
}

// Helper function to get a stock name for a symbol
function getStockName(symbol: string): string {
  const names: { [key: string]: string } = {
    AAPL: "Apple",
    MSFT: "Microsoft",
    AMZN: "Amazon",
    GOOGL: "Google",
    TSLA: "Tesla",
    META: "Meta",
    NFLX: "Netflix",
    NVDA: "NVIDIA",
    SPY: "S&P 500",
    QQQ: "Nasdaq",
    DIA: "Dow Jones",
  }

  return names[symbol] || symbol
}