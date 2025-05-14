/**
 * getPriceSimple.js - A simpler script to fetch current stock prices from Google Finance
 * 
 * This version uses fetch instead of Puppeteer for better deployment compatibility
 */

/**
 * Gets the current price for a stock symbol from Google Finance
 * @param {string} symbol - The stock symbol to look up (e.g., 'AAPL', 'MSFT')
 * @returns {Promise<number>} The current stock price as a number
 * @throws {Error} If the symbol is invalid or no results are found
 */
async function getCurrentPrice(symbol) {
  try {
    console.log(`Fetching price for ${symbol} from Google Finance...`);
    
    // Construct the URL for Google Finance
    const url = `https://www.google.com/finance/quote/${symbol}`;
    console.log(`URL: ${url}`);
    
    // Fetch the HTML content
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Finance: ${response.status}`);
    }
    
    // Get the HTML content as text
    const html = await response.text();
    console.log(`Received HTML content (${html.length} characters)`);
    
    // Save the HTML to a file for inspection (helpful for debugging)
    const fs = require('fs');
    fs.writeFileSync('google-finance.html', html);
    console.log('Saved HTML to google-finance.html for inspection');
    
    // Log a small portion of the HTML to see what we're working with
    console.log('HTML snippet:', html.substring(0, 500) + '...');
    
    // Try multiple approaches to extract the price
    
    // Approach 1: Look for price in a table (search results page)
    if (html.includes('Essayez avec :') || html.includes('Try with:')) {
      console.log('Found search results page, extracting first result price...');
      
      // Look for prices in the format of numbers followed by currency symbols
      const priceRegex = /(\d+[\.,]\d+)\s*[$€£¥]/g;
      const matches = html.match(priceRegex);
      
      if (matches && matches.length > 0) {
        console.log(`Found prices in search results: ${matches.join(', ')}`);
        
        // Take the first price
        const firstPrice = matches[0];
        console.log(`Using first price: ${firstPrice}`);
        
        // Clean and parse the price
        const cleanPrice = firstPrice
          .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, and commas
          .replace(/,/g, '.'); // Replace commas with dots for parsing
        
        const price = parseFloat(cleanPrice);
        
        if (!isNaN(price)) {
          console.log(`Successfully parsed price: ${price}`);
          return price;
        }
      }
    }
    
    // Approach 2: Look for the YMlKec fxKbKc class (direct stock page)
    console.log('Trying to extract price from direct stock page...');
    const priceRegex1 = /<div class="YMlKec fxKbKc">([^<]+)<\/div>/;
    const match1 = html.match(priceRegex1);
    
    if (match1 && match1[1]) {
      console.log(`Found price element with YMlKec fxKbKc class: ${match1[1]}`);
      
      // Clean and parse the price
      const cleanPrice = match1[1]
        .replace(/\s/g, '') // Remove whitespace
        .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, and commas
        .replace(/,/g, '.'); // Replace commas with dots for parsing
      
      const price = parseFloat(cleanPrice);
      
      if (!isNaN(price)) {
        console.log(`Successfully parsed price: ${price}`);
        return price;
      }
    }
    
    // Approach 3: Look for any number followed by a currency symbol
    console.log('Trying to extract any price with currency symbol...');
    const priceRegex2 = /(\d+[\.,]\d+)\s*[$€£¥]/;
    const match2 = html.match(priceRegex2);
    
    if (match2 && match2[1]) {
      console.log(`Found price with currency symbol: ${match2[1]}`);
      
      // Clean and parse the price
      const cleanPrice = match2[1]
        .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, and commas
        .replace(/,/g, '.'); // Replace commas with dots for parsing
      
      const price = parseFloat(cleanPrice);
      
      if (!isNaN(price)) {
        console.log(`Successfully parsed price: ${price}`);
        return price;
      }
    }
    
    // Approach 4: Look for meta tags with price information
    console.log('Trying to extract price from meta tags...');
    const metaRegex = /<meta[^>]*content="([\d\.,]+)"[^>]*>/g;
    const metaMatches = html.matchAll(metaRegex);
    
    for (const match of metaMatches) {
      if (match && match[1]) {
        const content = match[1];
        if (/^\d+[\.,]\d+$/.test(content)) {
          console.log(`Found potential price in meta tag: ${content}`);
          
          // Clean and parse the price
          const cleanPrice = content
            .replace(/[^\d.,]/g, '') // Remove everything except digits, dots, and commas
            .replace(/,/g, '.'); // Replace commas with dots for parsing
          
          const price = parseFloat(cleanPrice);
          
          if (!isNaN(price)) {
            console.log(`Successfully parsed price from meta tag: ${price}`);
            return price;
          }
        }
      }
    }
    
    // If we've tried all approaches and still can't find a price
    throw new Error(`Could not extract price from page for ${symbol}`);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

// Export the function
module.exports = { getCurrentPrice };

// Self-invoking example
(async () => {
  try {
    const symbol = process.argv[2] || 'AAPL';
    console.log(`Starting price fetch for ${symbol}...`);
    const price = await getCurrentPrice(symbol);
    console.log(`${symbol} current price: $${price}`);
  } catch (e) {
    console.error('Error fetching price:');
    console.error(e);
  }
})();
