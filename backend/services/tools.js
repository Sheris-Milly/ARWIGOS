/**
 * Financial Tools Implementation
 * This module provides tools for financial analysis and information retrieval.
 */

import axios from 'axios';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs';
import path from 'path';
import { supabase } from './supabase.js';
import { settings } from '../config/settings.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import ChartJSImage from 'chart.js-image';

// Set up logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  debug: (message) => console.log(`[DEBUG] ${message}`)
};

/**
 * Fetch financial news for a given query
 */
export async function searchFinancialNews(query, apiKey = null) {
  const key = apiKey || settings.DEFAULT_ALPHA_VANTAGE_KEY;
  const host = settings.ALPHA_VANTAGE_HOST;

  let url;
  if (query.toUpperCase() === query && /^[A-Z]+$/.test(query) && query.length <= 5) {
    url = `https://${host}/query?function=NEWS_SENTIMENT&tickers=${query}&apikey=${key}`;
  } else {
    url = `https://${host}/query?function=NEWS_SENTIMENT&apikey=${key}`;
  }

  try {
    const res = await axios.get(url);
    const data = res.data;
    const feed = data.feed || [];
    
    if (!feed.length) {
      return `No articles found for '${query}'.`;
    }
    
    return feed.slice(0, 5).map(a => ({
      title: a.title,
      url: a.url,
      source: a.source,
      published_at: a.time_published
    }));
  } catch (e) {
    logger.error(`News fetch error for '${query}': ${e}`);
    return `Error fetching news: ${e.message}`;
  }
}

/**
 * Get current stock price for a given symbol
 */
export async function getStockPrice(symbol) {
  try {
    const result = await yahooFinance.quote(symbol);
    const price = result.regularMarketPrice;
    return price ? `${symbol}: $${price.toFixed(2)}` : `Price not available for ${symbol}.`;
  } catch (e) {
    logger.error(`Price fetch error for '${symbol}': ${e}`);
    return `Error fetching price for ${symbol}.`;
  }
}

/**
 * Analyze the user's portfolio
 */
export async function analyzePortfolio(userId) {
  try {
    const { data: rows, error } = await supabase.from("portfolio")
      .select("symbol,quantity,purchase_date")
      .eq("user_id", userId);
    
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return "You have no holdings in your portfolio.";
    }
    
    let totalVal = 0.0;
    const details = [];
    
    // Process each holding
    for (const r of rows) {
      const sym = r.symbol;
      const qty = r.quantity;
      
      // Get current price from Yahoo Finance
      const quote = await yahooFinance.quote(sym);
      const price = quote.regularMarketPrice;
      
      const val = price * qty;
      totalVal += val;
      details.push({ sym, qty, price, val });
    }
    
    // Format output
    const lines = details.map(d => 
      `${d.sym}: ${d.qty} shares @ $${d.price.toFixed(2)} = $${d.val.toFixed(2)}`
    );
    
    const alloc = details.map(d => 
      `${d.sym}: ${(d.val / totalVal * 100).toFixed(1)}%`
    );
    
    return (
      `Total Portfolio Value: $${totalVal.toFixed(2)}\n\n` +
      "Holdings:\n" + lines.join("\n") + "\n\n" +
      "Allocation:\n" + alloc.join("\n")
    );
  } catch (e) {
    logger.error(`Error analyzing portfolio: ${e}`);
    return `Error analyzing portfolio: ${e.message}`;
  }
}

/**
 * Create a personalized financial plan
 */
export async function createFinancialPlan(userId, userLlm = null) {
  try {
    const { data: profile, error } = await supabase.from("user_profiles")
      .select("age,goals,risk_tolerance")
      .eq("user_id", userId)
      .single();
    
    if (error) throw new Error(error.message);
    if (!profile) {
      return "Please set up your profile (age, goals, risk tolerance) first.";
    }
    
    const prompt = (
      `Create a personalized financial plan for a client aged ${profile.age}, ` +
      `goals: '${profile.goals}', risk tolerance: '${profile.risk_tolerance}'. ` +
      "Provide actionable steps and a timeline."
    );
    
    try {
      if (!userLlm) {
        const { data: userData, error: userError } = await supabase.from("profiles")
          .select("google_api_key")
          .eq("id", userId)
          .single();
        
        if (userError) throw new Error(userError.message);
        
        const apiKey = userData.google_api_key;
        if (!apiKey) {
          return "Google API key is required to generate a financial plan. Please update your profile.";
        }
        
        userLlm = new ChatGoogleGenerativeAI({
          modelName: settings.GEMINI_MODEL,
          apiKey: apiKey,
          temperature: 0.2
        });
      }
      
      const result = await userLlm.invoke(prompt);
      return result.content;
    } catch (e) {
      throw e;
    }
  } catch (e) {
    logger.error(`Financial plan error: ${e}`);
    return `Error generating financial plan: ${e.message}`;
  }
}

/**
 * Assess portfolio risk
 */
export async function assessRisk(userId) {
  try {
    const { data: rows, error } = await supabase.from("portfolio")
      .select("symbol,quantity")
      .eq("user_id", userId);
    
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return "No portfolio data to assess risk.";
    }
    
    // Fetch historical data and calculate volatility
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const allReturns = [];
    let totalValue = 0;
    
    for (const r of rows) {
      const hist = await yahooFinance.historical(r.symbol, {
        period1: oneYearAgo.toISOString().split('T')[0],
        interval: '1d'
      });
      
      if (hist.length > 0) {
        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < hist.length; i++) {
          const dailyReturn = (hist[i].close - hist[i-1].close) / hist[i-1].close;
          returns.push(dailyReturn * r.quantity);
        }
        allReturns.push(returns);
        
        // Get latest value for portfolio weighting
        const latestPrice = hist[hist.length - 1].close;
        totalValue += latestPrice * r.quantity;
      }
    }
    
    // Calculate weighted portfolio returns
    const portfolioReturns = [];
    const maxLength = Math.max(...allReturns.map(r => r.length));
    
    for (let day = 0; day < maxLength; day++) {
      let dayReturn = 0;
      for (const returns of allReturns) {
        if (day < returns.length) {
          dayReturn += returns[day];
        }
      }
      portfolioReturns.push(dayReturn);
    }
    
    // Calculate volatility
    const mean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const squaredDiffs = portfolioReturns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / squaredDiffs.length;
    const dailyVol = Math.sqrt(variance);
    const annualizedVol = dailyVol * Math.sqrt(252); // Trading days in a year
    
    // Determine risk level
    const riskLevel = annualizedVol < 0.10 ? "low" : annualizedVol < 0.20 ? "medium" : "high";
    
    return `Annualized volatility: ${(annualizedVol * 100).toFixed(2)}%. Risk profile: ${riskLevel}.`;
  } catch (e) {
    logger.error(`Risk assessment error: ${e}`);
    return `Error assessing risk: ${e.message}`;
  }
}

/**
 * Generate a performance chart for the portfolio
 */
export async function generatePerformanceChart(userId) {
  try {
    const { data: rows, error } = await supabase.from("portfolio")
      .select("symbol,quantity")
      .eq("user_id", userId);
    
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      return "No portfolio data to chart.";
    }
    
    // Fetch historical data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const historyBySymbol = {};
    
    for (const r of rows) {
      const hist = await yahooFinance.historical(r.symbol, {
        period1: oneYearAgo.toISOString().split('T')[0],
        interval: '1d'
      });
      
      historyBySymbol[r.symbol] = hist.map(day => ({
        date: day.date,
        value: day.close * r.quantity
      }));
    }
    
    // Aggregate data by date
    const portfolioByDate = {};
    
    for (const [symbol, history] of Object.entries(historyBySymbol)) {
      for (const day of history) {
        const dateStr = day.date.toISOString().split('T')[0];
        if (!portfolioByDate[dateStr]) {
          portfolioByDate[dateStr] = 0;
        }
        portfolioByDate[dateStr] += day.value;
      }
    }
    
    // Sort dates and prepare chart data
    const sortedDates = Object.keys(portfolioByDate).sort();
    const values = sortedDates.map(date => portfolioByDate[date]);
    
    // Create directory if it doesn't exist
    const staticDir = path.join(process.cwd(), 'static');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    // Generate chart
    const filename = `portfolio_perf_${userId}.png`;
    const filePath = path.join(staticDir, filename);
    
    // Using ChartJSImage to generate the chart
    const chart = ChartJSImage()
      .chart({
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [{
            label: 'Portfolio Value',
            data: values,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          title: {
            display: true,
            text: 'Portfolio Value Over Last Year'
          },
          scales: {
            xAxes: [{
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Date'
              },
              ticks: {
                maxTicksLimit: 12 // Show approximately one month per tick
              }
            }],
            yAxes: [{
              display: true,
              scaleLabel: {
                display: true,
                labelString: 'Value ($)'
              }
            }]
          }
        }
      })
      .backgroundColor('white')
      .width(800)
      .height(400);
    
    await chart.toFile(filePath);
    
    return `${settings.BACKEND_URL}/static/${filename}`;
  } catch (e) {
    logger.error(`Chart generation error: ${e}`);
    return `Error generating chart: ${e.message}`;
  }
}
