// Test script for Alpha Vantage API with mock data fallback
const API_KEY = 'F51BZWN92UCOXFO8';
const SYMBOL = 'IBM'; // Example stock symbol

// Helper function to generate realistic mock stock prices
function getMockStockPrice(symbol) {
  // Base prices for common stocks to make the mock data more realistic
  const basePrices = {
    'AAPL': 180.25,
    'MSFT': 420.75,
    'GOOGL': 175.50,
    'AMZN': 185.30,
    'META': 480.15,
    'TSLA': 175.80,
    'NVDA': 950.20,
    'IBM': 249.20, // Using the example from the API response
    'JPM': 195.40,
    'V': 275.60,
    'WMT': 65.30,
    'JNJ': 152.75,
    'PG': 168.90,
    'UNH': 520.45,
    'HD': 345.80,
    'BAC': 38.25,
    'PFE': 28.15,
    'INTC': 30.50,
    'VZ': 42.75,
    'KO': 62.40,
    'DIS': 105.30,
    'NFLX': 630.80,
    'CSCO': 48.60,
    'PEP': 175.90,
    'ADBE': 480.25,
    'CRM': 275.40,
    'CMCSA': 38.75,
    'COST': 820.50,
    'ABT': 105.30,
    'TMO': 580.75
  };
  
  // If we have a base price for this symbol, use it with a small random variation
  if (basePrices[symbol]) {
    const basePrice = basePrices[symbol];
    // Add a random variation of up to ±2%
    const variation = (Math.random() * 4 - 2) / 100;
    return parseFloat((basePrice * (1 + variation)).toFixed(2));
  }
  
  // For unknown symbols, generate a random price between $10 and $500
  return parseFloat((10 + Math.random() * 490).toFixed(2));
}

async function testAlphaVantageAPI() {
  try {
    console.log('Testing Alpha Vantage API...');
    
    // Construct the URL for the Global Quote endpoint
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${SYMBOL}&apikey=${API_KEY}`;
    console.log(`API URL: ${url}`);
    
    // Fetch the data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data, null, 2));
    
    // Check if we hit rate limits or have an error message
    if (data.Information || data.Note) {
      console.warn('API limit reached or error:', data);
      // Return mock data with source information
      const mockPrice = getMockStockPrice(SYMBOL);
      console.log(`Using mock price for ${SYMBOL}: ${mockPrice}`);
      return { price: mockPrice, source: 'mock (API limit)', rawData: data };
    }
    
    // Check if the response contains the Global Quote data
    if (data && data['Global Quote'] && data['Global Quote']['05. price']) {
      const price = parseFloat(data['Global Quote']['05. price']);
      console.log(`Current price for ${SYMBOL}: ${price}`);
      return { price, source: 'Alpha Vantage API', rawData: data };
    } else {
      console.warn(`No price data found for ${SYMBOL} in API response`);
      // Return mock data with source information
      const mockPrice = getMockStockPrice(SYMBOL);
      console.log(`Using mock price for ${SYMBOL}: ${mockPrice}`);
      return { price: mockPrice, source: 'mock (no data)', rawData: data };
    }
  } catch (error) {
    console.error('Error testing Alpha Vantage API:', error);
    // Return mock data with source information
    const mockPrice = getMockStockPrice(SYMBOL);
    console.log(`Using mock price for ${SYMBOL}: ${mockPrice}`);
    return { price: mockPrice, source: 'mock (error)', rawData: { error: String(error) } };
  }
}

// Run the test
testAlphaVantageAPI().then(result => {
  console.log(`Test complete. Result:`, result);
});
