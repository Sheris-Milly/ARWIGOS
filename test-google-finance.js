// Test script for Google Finance price scraping
const SYMBOL = 'AAPL'; // Example stock symbol

async function testGoogleFinanceScraping() {
  try {
    console.log(`Testing Google Finance scraping for ${SYMBOL}...`);
    
    // Determine the exchange based on the symbol (simplified approach)
    let exchange = 'NASDAQ';
    if (['IBM', 'JPM', 'BA', 'GS', 'JNJ', 'PG', 'KO', 'MCD'].includes(SYMBOL)) {
      exchange = 'NYSE';
    }
    
    // Construct the Google Finance URL
    const url = `https://www.google.com/finance/quote/${SYMBOL}:${exchange}`;
    console.log(`Google Finance URL: ${url}`);
    
    // Fetch the HTML content
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Finance page: ${response.status}`);
    }
    
    // Get the HTML content
    const html = await response.text();
    
    // Extract the price using regex
    // Looking for the price in a div with class "YMlKec fxKbKc"
    const priceRegex = /<div class="YMlKec fxKbKc">([\d,.]+)&nbsp;\$<\/div>/;
    const match = html.match(priceRegex);
    
    if (match && match[1]) {
      // Parse the price, handling different number formats
      let priceStr = match[1].replace(/\./g, '_').replace(/,/g, '.').replace(/_/g, '');
      const price = parseFloat(priceStr);
      
      if (!isNaN(price)) {
        console.log(`Successfully extracted price for ${SYMBOL}: ${price}`);
        return { price, source: 'Google Finance', priceStr: match[1] };
      }
    }
    
    console.warn(`Could not extract price from Google Finance for ${SYMBOL}`);
    // Log a portion of the HTML to help debug
    console.log('HTML snippet:', html.substring(0, 500) + '...');
    return null;
  } catch (error) {
    console.error(`Error fetching price from Google Finance for ${SYMBOL}:`, error);
    return null;
  }
}

// Run the test
testGoogleFinanceScraping().then(result => {
  console.log(`Test complete. Result:`, result);
});
