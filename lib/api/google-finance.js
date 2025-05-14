/**
 * google-finance.js - A module to fetch current stock prices from Google Finance
 * 
 * This module provides a serverless API function to get real-time stock prices
 * by scraping Google Finance. It can be used as an API endpoint in Next.js.
 */

// Import Puppeteer for headless browser automation
import puppeteer from 'puppeteer';

/**
 * Gets the current price for a stock symbol from Google Finance
 * @param {string} symbol - The stock symbol to look up (e.g., 'AAPL', 'MSFT')
 * @returns {Promise<number>} The current stock price as a number
 * @throws {Error} If the symbol is invalid or no results are found
 */
export async function getCurrentPrice(symbol) {
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: 'new' // Use the new headless mode
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Determine the exchange based on the symbol (simplified approach)
    // In a real app, you'd have a more comprehensive mapping
    let exchange = 'NASDAQ';
    if (['IBM', 'JPM', 'BA', 'GS', 'JNJ', 'PG', 'KO', 'MCD'].includes(symbol.toUpperCase())) {
      exchange = 'NYSE';
    }
    
    // Navigate to Google Finance for the given symbol
    const url = `https://www.google.com/finance/quote/${symbol.toUpperCase()}:${exchange}`;
    console.log(`Fetching from: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Check if the page shows "No results found"
    const noResultsElement = await page.$('div.xJv0v');
    if (noResultsElement) {
      const noResultsText = await page.evaluate(el => el.textContent, noResultsElement);
      if (noResultsText && noResultsText.includes('No results found')) {
        throw new Error(`Invalid symbol: ${symbol} - No results found on Google Finance`);
      }
    }
    
    // Wait for the price element to be visible
    // The price is in a div with class "YMlKec fxKbKc"
    await page.waitForSelector('div.YMlKec.fxKbKc', { visible: true, timeout: 5000 });
    
    // Extract the price text
    const priceText = await page.evaluate(() => {
      const element = document.querySelector('div.YMlKec.fxKbKc');
      return element ? element.textContent : null;
    });
    
    // Validate that we got a price
    if (!priceText) {
      throw new Error(`Could not find price for symbol: ${symbol}`);
    }
    
    // Clean and parse the price text
    // Remove currency symbols, commas, and other non-numeric characters
    // Handle different locale formats (e.g., "1,234.56" or "1.234,56")
    const cleanPrice = priceText
      .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, and commas
      .replace(/,(\d{2})$/, '.$1') // If comma is followed by exactly 2 digits, replace with dot (for European format)
      .replace(/,/g, ''); // Remove remaining commas (for thousand separators)
    
    // Parse the cleaned string to a number
    const price = parseFloat(cleanPrice);
    
    // Validate the parsed price
    if (isNaN(price)) {
      throw new Error(`Failed to parse price from text: "${priceText}" for symbol: ${symbol}`);
    }
    
    return price;
  } finally {
    // Always close the browser, even if an error occurred
    await browser.close();
  }
}

/**
 * API handler function for Next.js API routes
 * This can be used to create a serverless function endpoint
 */
export async function handlePriceRequest(req, res) {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    const price = await getCurrentPrice(symbol);
    return res.status(200).json({ symbol, price });
  } catch (error) {
    console.error('Error in price API:', error);
    return res.status(500).json({ error: error.message });
  }
}

// For testing purposes
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    try {
      const symbol = process.argv[2] || 'AAPL';
      const price = await getCurrentPrice(symbol);
      console.log(`${symbol}: $${price}`);
    } catch (e) {
      console.error(e);
    }
  })();
}
