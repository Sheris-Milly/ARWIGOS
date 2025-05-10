import { fetchStockData } from "./stocks"

/**
 * Fetches historical stock price data for the given symbol and period
 * @param symbol The stock symbol to fetch data for
 * @param period The time period for the chart data (1D, 5D, 1M, 3M, 6M, 1Y, 5Y)
 */
export async function fetchStockChartData(symbol: string, period: string) {
  try {
    // Map our periods to the API's expected format
    const apiPeriod = period.replace(/(\d+)([A-Z])/, '$1$2').toUpperCase();
    
    // Real-Time Finance API endpoint for stock time series
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    
    if (!apiKey) {
      console.warn("RapidAPI key is missing - using simulated data");
      return simulateChartData(period);
    }

    try {
      // Use the new Real-Time Finance API
      const url = `https://real-time-finance-data.p.rapidapi.com/stock-time-series?symbol=${symbol}&period=${apiPeriod}&language=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, using simulated data instead`);
        return simulateChartData(period);
      }

      const data = await response.json();
      
      if (!data || data.status !== "OK" || !data.data || !data.data.time_series) {
        console.warn("No chart data available, using simulated data instead");
        return simulateChartData(period);
      }

      // Transform the time_series data to our expected format
      const timeSeries = Object.entries(data.data.time_series).map(([timestamp, dataPoint]: [string, any]) => ({
        timestamp: new Date(timestamp).getTime(),
        open: dataPoint.price - (dataPoint.change || 0),
        high: dataPoint.price * 1.005, // Approximate high based on available data
        low: dataPoint.price * 0.995,  // Approximate low based on available data
        close: dataPoint.price,
        volume: dataPoint.volume || 0
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