// Test script for Yahoo Finance API
const SYMBOL = 'AAPL'; // Example stock symbol

async function testYahooFinanceAPI() {
  try {
    console.log(`Testing Yahoo Finance API for ${SYMBOL}...`);
    
    // Use the Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${SYMBOL}`;
    console.log(`Yahoo Finance API URL: ${url}`);
    
    // Fetch the data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Yahoo Finance data: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log(`Yahoo Finance response received for ${SYMBOL}`);
    
    // Extract the current price from the response
    if (data && data.chart && data.chart.result && data.chart.result[0] && 
        data.chart.result[0].meta && data.chart.result[0].meta.regularMarketPrice) {
      
      const price = data.chart.result[0].meta.regularMarketPrice;
      console.log(`Successfully extracted price for ${SYMBOL}: ${price}`);
      return { price, source: 'Yahoo Finance API', timestamp: new Date().toISOString() };
    }
    
    console.warn(`Could not extract price from Yahoo Finance for ${SYMBOL}`);
    console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    return null;
  } catch (error) {
    console.error(`Error fetching price from Yahoo Finance for ${SYMBOL}:`, error);
    return null;
  }
}

// Run the test
testYahooFinanceAPI().then(result => {
  console.log(`Test complete. Result:`, result);
});
