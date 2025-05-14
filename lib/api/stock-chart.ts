import { fetchStockData } from "./stocks"

export async function fetchStockChartData(symbol: string, period: string) {
  try {
    // Map our periods to the Alpha Vantage API's expected format
    let alphaVantageFunction = 'TIME_SERIES_DAILY';
    let outputsize = 'compact';
    let interval = null;
    
    // Convert our app's period format to Alpha Vantage parameters
    switch(period) {
      case '1D':
        alphaVantageFunction = 'TIME_SERIES_INTRADAY';
        interval = '5min';
        break;
      case '5D':
        alphaVantageFunction = 'TIME_SERIES_INTRADAY';
        interval = '30min';
        outputsize = 'full';
        break;
      case '1M':
        alphaVantageFunction = 'TIME_SERIES_DAILY';
        outputsize = 'compact'; // Last 100 data points
        break;
      case '3M':
      case '6M':
        alphaVantageFunction = 'TIME_SERIES_DAILY';
        outputsize = 'full'; // Full data
        break;
      case '1Y':
        alphaVantageFunction = 'TIME_SERIES_DAILY';
        outputsize = 'full';
        break;
      case '5Y':
        alphaVantageFunction = 'TIME_SERIES_WEEKLY';
        break;
      default:
        alphaVantageFunction = 'TIME_SERIES_DAILY';
        outputsize = 'compact';
    }
    
    // Alpha Vantage API endpoint for stock time series
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'XBYMG2VY49SX4K21'; // Use the provided key for testing
    
    if (!apiKey) {
      console.warn("Alpha Vantage API key is missing - using simulated data");
      return simulateChartData(period);
    }

    try {
      // Build the URL based on the function type
      let url = `https://www.alphavantage.co/query?function=${alphaVantageFunction}&symbol=${symbol}&apikey=${apiKey}`;
      
      // Add interval parameter only for intraday data
      if (interval) {
        url += `&interval=${interval}`;
      }
      
      // Add outputsize parameter
      url += `&outputsize=${outputsize}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, using simulated data instead`);
        return simulateChartData(period);
      }

      const data = await response.json();
      
      // Check for error messages from Alpha Vantage
      if (data['Error Message'] || data['Information']) {
        console.warn("Alpha Vantage API error or information message:", data['Error Message'] || data['Information']);
        return simulateChartData(period);
      }
      
      // Determine which time series key to use based on the function
      let timeSeriesKey = '';
      if (alphaVantageFunction === 'TIME_SERIES_INTRADAY') {
        timeSeriesKey = `Time Series (${interval})`;
      } else if (alphaVantageFunction === 'TIME_SERIES_DAILY') {
        timeSeriesKey = 'Time Series (Daily)';
      } else if (alphaVantageFunction === 'TIME_SERIES_WEEKLY') {
        timeSeriesKey = 'Weekly Time Series';
      }
      
      if (!data[timeSeriesKey]) {
        console.warn("No chart data available, using simulated data instead");
        return simulateChartData(period);
      }

      // Transform the time_series data to our expected format
      const timeSeries = Object.entries(data[timeSeriesKey]).map(([timestamp, dataPoint]: [string, any]) => ({
        timestamp: new Date(timestamp).getTime(),
        open: parseFloat(dataPoint['1. open']),
        high: parseFloat(dataPoint['2. high']),
        low: parseFloat(dataPoint['3. low']),
        close: parseFloat(dataPoint['4. close']),
        volume: parseInt(dataPoint['5. volume'], 10)
      })).sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
      
      return timeSeries;
    } catch (error) {
      console.error("Error in API request:", error);
      return simulateChartData(period);
    }
  } catch (error) {
    console.error("Error fetching stock chart data:", error);
    return simulateChartData(period);
  }
}

function simulateChartData(period: string) {
  const today = new Date()
  const data = []
  
  // Generate different number of data points based on period
  let days = 30
  let interval = 24 * 60 * 60 * 1000 // 1 day in ms
  
  switch(period) {
    case "1D":
      days = 1
      interval = 5 * 60 * 1000 // 5 minutes
      break
    case "5D":
      days = 5
      interval = 15 * 60 * 1000 // 15 minutes
      break
    case "1M":
      days = 30
      break
    case "3M":
      days = 90
      break
    case "6M":
      days = 180
      break
    case "1Y":
      days = 365
      break
    case "5Y":
      days = 365 * 5
      interval = 7 * 24 * 60 * 60 * 1000 // 1 week
      break
  }
  
  // Set a base price and generate random price movements
  let basePrice = 150 + Math.random() * 50
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today.getTime() - (days - i) * interval)
    const movement = (Math.random() - 0.5) * 5
    basePrice += movement
    
    if (basePrice < 50) basePrice = 50
    
    data.push({
      timestamp: date.toISOString(),
      open: basePrice - Math.random() * 2,
      high: basePrice + Math.random() * 3,
      low: basePrice - Math.random() * 3,
      close: basePrice,
      volume: Math.floor(Math.random() * 10000000)
    })
  }
  
  return data
} 