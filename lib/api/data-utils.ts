/**
 * Utility functions to fetch various types of financial data
 * This file provides wrapper functions around the individual API modules
 * to standardize interfaces and provide fallbacks
 */

import { fetchLatestNews, fetchStockNews as fetchNewsForSymbol } from './news';
import { fetchMarketData as fetchRawMarketData } from './market';

/**
 * Fetches stock market news with a default symbol if none provided
 * @returns Stock news data
 */
export async function fetchStockNews(): Promise<any> {
  try {
    // Default to major market indices for news when no specific symbol is provided
    const defaultSymbols = ['SPY', 'QQQ', 'DIA'];
    const randomIndex = Math.floor(Math.random() * defaultSymbols.length);
    const defaultSymbol = defaultSymbols[randomIndex];
    
    return await fetchNewsForSymbol(defaultSymbol);
  } catch (error) {
    console.error('Error fetching stock news:', error);
    return { data: [] };
  }
}

/**
 * Fetches market data safely with error handling
 * @returns Market data or empty object
 */
export async function fetchMarketData(): Promise<any> {
  try {
    return await fetchRawMarketData();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return {};
  }
}
