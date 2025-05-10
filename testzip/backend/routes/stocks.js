import express from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to verify user is authenticated
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Authentication server error' });
  }
};

// Get stock quote
router.get('/quote/:ticker', authenticateUser, async (req, res) => {
  const { ticker } = req.params;
  
  if (!ticker) {
    return res.status(400).json({ success: false, message: 'Stock ticker is required' });
  }
  
  try {
    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('stock_quotes')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 15 minutes old), use it
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (cachedData && cachedData.length > 0 && new Date(cachedData[0].timestamp) > fifteenMinutesAgo) {
      return res.status(200).json({ success: true, quote: cachedData[0], source: 'cache' });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes',
      params: { ticker },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data || !response.data.data[0]) {
      return res.status(404).json({ success: false, message: 'Stock data not found' });
    }
    
    const stockData = response.data.data[0];
    
    // Store the fresh data in cache
    const { error: insertError } = await supabase
      .from('stock_quotes')
      .insert({
        ticker: ticker.toUpperCase(),
        price: stockData.price,
        change: stockData.change,
        change_percent: stockData.changesPercentage,
        volume: stockData.volume,
        market_cap: stockData.marketCap,
        timestamp: new Date(),
        raw_data: stockData
      });
    
    if (insertError) {
      console.error('Error caching stock data:', insertError);
    }
    
    // Update stock details if they exist
    const { data: existingStock } = await supabase
      .from('stocks')
      .select('id')
      .eq('ticker', ticker.toUpperCase())
      .single();
    
    if (existingStock) {
      const { error: updateError } = await supabase
        .from('stocks')
        .update({
          name: stockData.name || stockData.companyName,
          current_price: stockData.price,
          price_updated_at: new Date(),
          updated_at: new Date()
        })
        .eq('id', existingStock.id);
      
      if (updateError) {
        console.error('Error updating stock data:', updateError);
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      quote: {
        ticker: ticker.toUpperCase(),
        price: stockData.price,
        change: stockData.change,
        change_percent: stockData.changesPercentage,
        volume: stockData.volume,
        market_cap: stockData.marketCap,
        name: stockData.name || stockData.companyName,
        timestamp: new Date(),
        raw_data: stockData
      },
      source: 'api'
    });
  } catch (error) {
    console.error('Stock quote fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stock quote' });
  }
});

// Search stocks by keyword
router.get('/search', authenticateUser, async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
  
  try {
    // First check if we have this search cached
    const { data: cachedResults, error: cacheError } = await supabase
      .from('stock_searches')
      .select('results')
      .eq('query', query.toLowerCase())
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 1 day old), use it
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (cachedResults && cachedResults.length > 0 && new Date(cachedResults[0].timestamp) > oneDayAgo) {
      return res.status(200).json({ 
        success: true, 
        results: cachedResults[0].results, 
        source: 'cache' 
      });
    }
    
    // Use the search endpoint from RapidAPI to find stocks
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/search',
      params: { query },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data) {
      return res.status(404).json({ success: false, message: 'No results found' });
    }
    
    const searchResults = response.data.data;
    
    // Format the results
    const formattedResults = searchResults.map(item => ({
      ticker: item.symbol,
      name: item.longName || item.shortName,
      exchange: item.exchange,
      type: item.quoteType
    }));
    
    // Cache the search results
    const { error: insertError } = await supabase
      .from('stock_searches')
      .insert({
        query: query.toLowerCase(),
        results: formattedResults,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching search results:', insertError);
    }
    
    return res.status(200).json({ success: true, results: formattedResults, source: 'api' });
  } catch (error) {
    console.error('Stock search error:', error);
    return res.status(500).json({ success: false, message: 'Failed to search stocks' });
  }
});

// Get historical data for a stock
router.get('/history/:ticker', authenticateUser, async (req, res) => {
  const { ticker } = req.params;
  const { period = '1y', interval = '1d' } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ success: false, message: 'Stock ticker is required' });
  }
  
  try {
    // Check cache first
    const cacheKey = `${ticker.toUpperCase()}_${period}_${interval}`;
    const { data: cachedData, error: cacheError } = await supabase
      .from('stock_history')
      .select('*')
      .eq('cache_key', cacheKey)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 1 day old), use it
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (cachedData && cachedData.length > 0 && new Date(cachedData[0].timestamp) > oneDayAgo) {
      return res.status(200).json({ 
        success: true, 
        history: cachedData[0].history_data, 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/history',
      params: { 
        ticker,
        period,
        interval
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data) {
      return res.status(404).json({ success: false, message: 'Historical data not found' });
    }
    
    const historyData = response.data.data;
    
    // Format the data for charts
    const formattedHistory = Object.keys(historyData).map(date => ({
      date,
      close: historyData[date].close,
      open: historyData[date].open,
      high: historyData[date].high,
      low: historyData[date].low,
      volume: historyData[date].volume
    }));
    
    // Cache the history data
    const { error: insertError } = await supabase
      .from('stock_history')
      .insert({
        ticker: ticker.toUpperCase(),
        cache_key: cacheKey,
        period,
        interval,
        history_data: formattedHistory,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching history data:', insertError);
    }
    
    return res.status(200).json({ success: true, history: formattedHistory, source: 'api' });
  } catch (error) {
    console.error('Stock history fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stock history' });
  }
});

// Get popular stocks (most active, gainers, losers)
router.get('/popular/:type', authenticateUser, async (req, res) => {
  const { type } = req.params; // 'active', 'gainers', 'losers'
  
  if (!['active', 'gainers', 'losers'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Type must be one of: active, gainers, losers' 
    });
  }
  
  try {
    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('popular_stocks')
      .select('*')
      .eq('type', type)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 15 minutes old), use it
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (cachedData && cachedData.length > 0 && new Date(cachedData[0].timestamp) > fifteenMinutesAgo) {
      return res.status(200).json({ 
        success: true, 
        stocks: cachedData[0].stocks, 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/${type}`,
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    
    const stocksData = response.data.data;
    
    // Format the stock list
    const formattedStocks = stocksData.map(stock => ({
      ticker: stock.symbol,
      name: stock.name || stock.companyName,
      price: stock.price,
      change: stock.change,
      change_percent: stock.changesPercentage,
      volume: stock.volume,
      market_cap: stock.marketCap
    }));
    
    // Cache the data
    const { error: insertError } = await supabase
      .from('popular_stocks')
      .insert({
        type,
        stocks: formattedStocks,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching popular stocks:', insertError);
    }
    
    return res.status(200).json({ success: true, stocks: formattedStocks, source: 'api' });
  } catch (error) {
    console.error('Popular stocks fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch popular stocks' });
  }
});

// Get company profile
router.get('/profile/:ticker', authenticateUser, async (req, res) => {
  const { ticker } = req.params;
  
  if (!ticker) {
    return res.status(400).json({ success: false, message: 'Stock ticker is required' });
  }
  
  try {
    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 7 days old), use it
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (cachedData && cachedData.length > 0 && new Date(cachedData[0].timestamp) > sevenDaysAgo) {
      return res.status(200).json({ 
        success: true, 
        profile: cachedData[0].profile_data, 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/profile',
      params: { ticker },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }
    
    const profileData = response.data.data;
    
    // Format the profile data
    const formattedProfile = {
      ticker: ticker.toUpperCase(),
      name: profileData.longName || profileData.shortName,
      description: profileData.description,
      sector: profileData.sector,
      industry: profileData.industry,
      website: profileData.website,
      employees: profileData.fullTimeEmployees,
      address: profileData.address,
      city: profileData.city,
      state: profileData.state,
      country: profileData.country,
      zip: profileData.zip,
      officers: profileData.companyOfficers || []
    };
    
    // Cache the profile data
    const { error: insertError } = await supabase
      .from('company_profiles')
      .insert({
        ticker: ticker.toUpperCase(),
        profile_data: formattedProfile,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching company profile:', insertError);
    }
    
    return res.status(200).json({ success: true, profile: formattedProfile, source: 'api' });
  } catch (error) {
    console.error('Company profile fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch company profile' });
  }
});

export default router; 