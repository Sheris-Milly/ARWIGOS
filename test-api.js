// Test script for Alpha Vantage API
const API_KEY = 'F51BZWN92UCOXFO8';
const SYMBOL = 'IBM'; // Example stock symbol

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
    
    // Check if the response contains the Global Quote data
    if (data && data['Global Quote'] && data['Global Quote']['05. price']) {
      const price = parseFloat(data['Global Quote']['05. price']);
      console.log(`Current price for ${SYMBOL}: ${price}`);
      return price;
    } else {
      console.warn(`No price data found for ${SYMBOL} in API response`);
      return 0;
    }
  } catch (error) {
    console.error('Error testing Alpha Vantage API:', error);
    return 0;
  }
}

// Run the test
testAlphaVantageAPI().then(price => {
  console.log(`Test complete. Price: ${price}`);
});
