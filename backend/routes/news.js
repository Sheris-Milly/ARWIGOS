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

// Get latest general financial news
router.get('/latest', authenticateUser, async (req, res) => {
  const { limit = 20 } = req.query;
  
  try {
    // Check cache first
    const { data: cachedNews, error: cacheError } = await supabase
      .from('latest_news')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 30 minutes old), use it
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (cachedNews && cachedNews.length > 0 && new Date(cachedNews[0].timestamp) > thirtyMinutesAgo) {
      return res.status(200).json({ 
        success: true, 
        news: cachedNews[0].news_data.slice(0, parseInt(limit)), 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v2/markets/news',
      params: {
        type: 'LATEST'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data || !response.data.data.main) {
      return res.status(404).json({ success: false, message: 'News data not found' });
    }
    
    const newsData = response.data.data.main;
    
    // Format the news data
    const formattedNews = newsData.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.description || item.summary,
      publisher: item.publisher,
      published_at: item.published_at,
      url: item.link,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
      tickers: item.tickers || []
    }));
    
    // Cache the news data
    const { error: insertError } = await supabase
      .from('latest_news')
      .insert({
        news_data: formattedNews,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching news data:', insertError);
    }
    
    return res.status(200).json({ 
      success: true, 
      news: formattedNews.slice(0, parseInt(limit)), 
      source: 'api' 
    });
  } catch (error) {
    console.error('News fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
});

// Get news for a specific stock
router.get('/stock/:ticker', authenticateUser, async (req, res) => {
  const { ticker } = req.params;
  const { limit = 10 } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ success: false, message: 'Stock ticker is required' });
  }
  
  try {
    // Check cache first
    const cacheKey = ticker.toUpperCase();
    const { data: cachedNews, error: cacheError } = await supabase
      .from('stock_news')
      .select('*')
      .eq('ticker', cacheKey)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 2 hours old), use it
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (cachedNews && cachedNews.length > 0 && new Date(cachedNews[0].timestamp) > twoHoursAgo) {
      return res.status(200).json({ 
        success: true, 
        news: cachedNews[0].news_data.slice(0, parseInt(limit)), 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v2/markets/news',
      params: {
        tickers: ticker,
        type: 'ALL'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data || !response.data.data.main) {
      return res.status(404).json({ success: false, message: 'News data not found' });
    }
    
    const newsData = response.data.data.main;
    
    // Format the news data
    const formattedNews = newsData.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.description || item.summary,
      publisher: item.publisher,
      published_at: item.published_at,
      url: item.link,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
      tickers: item.tickers || []
    }));
    
    // Cache the news data
    const { error: insertError } = await supabase
      .from('stock_news')
      .insert({
        ticker: cacheKey,
        news_data: formattedNews,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching stock news data:', insertError);
    }
    
    return res.status(200).json({ 
      success: true, 
      news: formattedNews.slice(0, parseInt(limit)), 
      source: 'api' 
    });
  } catch (error) {
    console.error('Stock news fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stock news' });
  }
});

// Get trending news
router.get('/trending', authenticateUser, async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    // Check cache first
    const { data: cachedNews, error: cacheError } = await supabase
      .from('trending_news')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    // If we have recent data (less than 1 hour old), use it
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (cachedNews && cachedNews.length > 0 && new Date(cachedNews[0].timestamp) > oneHourAgo) {
      return res.status(200).json({ 
        success: true, 
        news: cachedNews[0].news_data.slice(0, parseInt(limit)), 
        source: 'cache' 
      });
    }
    
    // Otherwise, fetch fresh data from API
    const options = {
      method: 'GET',
      url: 'https://yahoo-finance15.p.rapidapi.com/api/v2/markets/news',
      params: {
        type: 'TRENDING'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.data || !response.data.data.main) {
      return res.status(404).json({ success: false, message: 'Trending news not found' });
    }
    
    const newsData = response.data.data.main;
    
    // Format the news data
    const formattedNews = newsData.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.description || item.summary,
      publisher: item.publisher,
      published_at: item.published_at,
      url: item.link,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
      tickers: item.tickers || []
    }));
    
    // Cache the news data
    const { error: insertError } = await supabase
      .from('trending_news')
      .insert({
        news_data: formattedNews,
        timestamp: new Date()
      });
    
    if (insertError) {
      console.error('Error caching trending news data:', insertError);
    }
    
    return res.status(200).json({ 
      success: true, 
      news: formattedNews.slice(0, parseInt(limit)), 
      source: 'api' 
    });
  } catch (error) {
    console.error('Trending news fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trending news' });
  }
});

// Save a news article to user's bookmarks
router.post('/bookmark', authenticateUser, async (req, res) => {
  const { news_id, title, url, ticker, note } = req.body;
  
  if (!news_id || !title) {
    return res.status(400).json({ success: false, message: 'News ID and title are required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('news_bookmarks')
      .insert({
        user_id: req.user.id,
        news_id,
        title,
        url,
        ticker,
        note,
        created_at: new Date()
      })
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(201).json({ success: true, bookmark: data[0] });
  } catch (error) {
    console.error('Bookmark creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save bookmark' });
  }
});

// Get user's news bookmarks
router.get('/bookmarks', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('news_bookmarks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, bookmarks: data });
  } catch (error) {
    console.error('Bookmarks fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
  }
});

// Delete a bookmark
router.delete('/bookmarks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verify the bookmark belongs to the user
    const { data: bookmark, error: fetchError } = await supabase
      .from('news_bookmarks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (fetchError || !bookmark) {
      return res.status(404).json({ success: false, message: 'Bookmark not found' });
    }
    
    const { error } = await supabase
      .from('news_bookmarks')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete bookmark' });
  }
});

export default router; 