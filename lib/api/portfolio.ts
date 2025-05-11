import { createBrowserClient } from "@supabase/ssr";
// Import the function to get stock details (which includes fetching price and updating DB)
import { fetchStockData } from './market'; // Updated import path

/**
 * Fetches user portfolios from Supabase
 * @returns Promise with the user's portfolios
 */
export async function fetchUserPortfolios() {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error("Failed to retrieve user session.");
    }

    if (!sessionData?.session?.user?.id) {
      console.warn("No authenticated user found");
      throw new Error("User not authenticated");
    }
    
    // Then fetch portfolios
    const { data, error } = await supabase
      .from('portfolios')
      .select('*, portfolio_stocks(*, stock_details:stocks(*))')
      .eq('user_id', sessionData.session.user.id);
    
    if (error) {
      console.error("Error fetching portfolios data:", error);
      throw new Error(`Failed to fetch portfolios: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}

/**
 * Creates a new portfolio
 * @param name Portfolio name
 * @param description Portfolio description
 * @returns Promise with created portfolio data
 */
export async function createPortfolio(name: string, description: string = "") {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Check for errors during session fetching
    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error("Failed to retrieve user session.");
    }
    
    // Ensure there is an active session and a user ID
    if (!sessionData.session?.user?.id) {
      console.warn("Attempted to create portfolio without an authenticated user. Session data:", sessionData);
      throw new Error("User not authenticated");
    }
    
    // Create the portfolio
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: sessionData.session.user.id,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating portfolio in DB:", error);
      throw new Error(`Failed to create portfolio: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error creating portfolio:", error);
    // Ensure the error is re-thrown
    throw error;
  }
}

/**
 * Adds a stock to a portfolio
 * @param portfolioId Portfolio ID
 * @param symbol Stock symbol
 * @param shares Number of shares
 * @param purchasePrice Purchase price per share
 * @param purchaseDate Purchase date
 * @returns Promise with added stock data
 */
export async function addStockToPortfolio(
  portfolioId: string,
  symbol: string,
  shares: number,
  purchasePrice: number,
  purchaseDate: string
) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Get or update stock details (including fetching latest price)
    // This replaces the manual check and insert logic
    const stockData = await fetchStockData(symbol);

    if (!stockData || !stockData.quote || !stockData.quote.symbol) {
        // Handle case where fetchStockData failed to return valid data
        console.error(`Failed to get or create stock details for symbol: ${symbol}`);
        throw new Error(`Could not retrieve valid stock information for ${symbol}.`);
    }

    // Ensure the stock exists in the 'stocks' table before inserting into 'portfolio_stocks'
    const supabaseStock = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: existingStock, error: stockError } = await supabaseStock
      .from('stocks')
      .select('symbol')
      .eq('symbol', stockData.quote.symbol)
      .single();
    if (stockError && stockError.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error checking stocks table:', stockError);
      throw new Error('Failed to check stocks table.');
    }
    if (!existingStock) {
      // Insert the stock if it does not exist
      const { error: insertError } = await supabaseStock
        .from('stocks')
        .insert({
          symbol: stockData.quote.symbol,
          name: stockData.quote.name || stockData.quote.symbol,
          exchange: null,
          sector: null, // Alpha Vantage doesn't provide sector info in the quote
          industry: null, // Alpha Vantage doesn't provide industry info in the quote
          last_price: stockData.quote.currentPrice || 0,
          price_change: stockData.quote.change || 0,
          price_change_percent: stockData.quote.changePercent || 0,
          last_updated: new Date().toISOString()
        });
      if (insertError) {
        console.error('Error inserting stock into stocks table:', insertError);
        throw new Error('Failed to insert stock into stocks table.');
      }
    }
    // No need to get stock ID since we use the symbol directly
      
    // 2. Add the stock holding to the portfolio_stocks table
    const { data, error } = await supabase
      .from('portfolio_stocks')
      .insert({
        portfolio_id: portfolioId,
        stock_symbol: stockData.quote.symbol, // Use the symbol directly
        shares: shares,
        average_price: purchasePrice, // Store the actual purchase price for this lot
        purchase_date: purchaseDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, stock_details:stocks(*)') // Select related stock details as well
      .single();

    if (error) {
      console.error("Error adding stock to portfolio_stocks:", error);
      // Check for unique constraint violation (e.g., stock already exists in portfolio)
      if (error.code === '23505') { // Adjust code based on your DB error for unique constraints
          throw new Error(`Stock ${stockData.quote.symbol} already exists in this portfolio.`);
      }
      throw new Error(`Failed to add stock to portfolio: ${error.message}`);
    }

    // 3. Update portfolio's total value using latest prices
    // This function now reads the latest prices from the 'stocks' table
    await updatePortfolioValue(portfolioId);

    return data;
  } catch (error) {
    console.error(`Error adding stock ${symbol} to portfolio ${portfolioId}:`, error);
    // Ensure the error is re-thrown so the UI can handle it
    throw error;
  }
}

/**
 * Updates a portfolio's total value based on its stocks
 * @param portfolioId Portfolio ID
 */
async function updatePortfolioValue(portfolioId: string) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get all stock holdings in the portfolio with related stock details
    const { data: portfolioStocksData, error: portfolioStocksError } = await supabase
      .from('portfolio_stocks')
      .select('stock_symbol, shares, stock_details:stocks(*)') // Select necessary fields
      .eq('portfolio_id', portfolioId);
    
    if (portfolioStocksError) {
      console.error("Error fetching stocks for portfolio value update:", portfolioStocksError);
      throw new Error(`Failed to fetch portfolio stocks: ${portfolioStocksError.message}`);
    }

    // Handle empty portfolio
    if (!portfolioStocksData || portfolioStocksData.length === 0) {
      console.warn(`No stocks found for portfolio ${portfolioId} during value update. Setting value to 0.`);
      // Update portfolio value to 0
      await supabase
        .from('portfolios')
        .update({
          total_value: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId);

      // Portfolio performance tracking is not implemented in the current schema
      console.log(`Portfolio ${portfolioId} is empty, value set to 0`);
      return; // Exit function after handling empty portfolio
    }
    
    // Get the unique stock symbols from the portfolio holdings
    const symbols = [...new Set(portfolioStocksData.map(ps => ps.stock_symbol))];

    // Fetch the latest price for these symbols from the 'stocks' table
    const { data, error: stockDetailsError } = await supabase
        .from('stocks')
        .select('symbol, last_price') // Using last_price from the database schema
        .in('symbol', symbols);

    if (stockDetailsError) {
      console.error("Error fetching stock details for value update:", stockDetailsError);
      // Decide how to handle: throw error, or calculate with available data?
      // For now, let's throw, as value would be inaccurate.
      throw new Error(`Failed to fetch stock details: ${stockDetailsError.message}`);
    }

    // Use data or an empty array if data is null
    const stockDetailsData = data || [];
    
    if (stockDetailsData.length === 0) {
        console.warn(`Could not fetch stock details for symbols: ${symbols.join(', ')}`);
        // Handle case where stock details might be missing for some symbols
        // Maybe calculate value with available prices and log a warning?
        // For now, proceed, but value might be incomplete.
    }

    // Create a map for quick price lookup { symbol: last_price }
    const priceMap = new Map(stockDetailsData.map(sd => [sd.symbol, sd.last_price]));

    // Calculate total value using current prices
    let totalValue = 0;
    portfolioStocksData.forEach(stock => {
      // Use nullish coalescing: if price not found in map or is null/undefined, default to 0
      const currentPrice = priceMap.get(stock.stock_symbol) ?? 0; 
      if (currentPrice === 0) {
          console.warn(`Price not found for symbol ${stock.stock_symbol}. Using 0 for calculation.`);
      }
      totalValue += stock.shares * currentPrice;
    });
    
    // Update portfolio value in the 'portfolios' table
    const { error: updatePortfolioError } = await supabase
      .from('portfolios')
      .update({
        total_value: totalValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    if (updatePortfolioError) {
        console.error("Error updating portfolio total value:", updatePortfolioError);
        // Decide if we should throw here or just log
        throw new Error(`Failed to update portfolio value: ${updatePortfolioError.message}`);
    }
    
    // Portfolio performance tracking is not implemented in the current schema
    // We'll just log the current portfolio value for debugging purposes
    console.log(`Updated portfolio ${portfolioId} value to ${totalValue}`);
    
  } catch (error) {
    // Log the caught error from any point in the try block
    console.error("Error during updatePortfolioValue execution:", error);
    // Re-throwing might be appropriate depending on how calling functions handle errors
    // throw error; 
  }
}

/**
 * Deletes a stock from a portfolio
 * @param portfolioId Portfolio ID
 * @param stockSymbol Stock symbol
 * @returns Promise indicating success
 */
export async function removeStockFromPortfolio(portfolioId: string, stockSymbol: string) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Delete the stock from the portfolio using the stock_symbol directly
    const { error } = await supabase
      .from('portfolio_stocks')
      .delete()
      .eq('portfolio_id', portfolioId)
      .eq('stock_symbol', stockSymbol);
    
    if (error) {
      console.error("Error removing stock from portfolio_stocks:", error);
      throw new Error(`Failed to remove stock from portfolio: ${error.message}`);
    }

    // Update portfolio value
    await updatePortfolioValue(portfolioId);
    
    return true;
  } catch (error) {
    console.error("Error removing stock from portfolio:", error);
    throw error;
  }
}

/**
 * Creates a new portfolio for the user
 * @param name Portfolio name
 * @returns Promise with created portfolio data
 */
export async function createDefaultPortfolio() {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn("Session error:", sessionError);
      return null; // Return null instead of throwing to prevent app crashes
    }
    
    if (!sessionData?.session?.user?.id) {
      console.warn("No authenticated user found");
      return null; // Return null instead of throwing to prevent app crashes
    }
    
    // Check if user already has portfolios
    const { data: existingPortfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', sessionData.session.user.id)
      .limit(1);
      
    if (portfolioError) {
      console.warn("Error checking existing portfolios:", portfolioError);
      return null;
    }
      
    if (existingPortfolios && existingPortfolios.length > 0) {
      return existingPortfolios[0];
    }
    
    // Create a default portfolio
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: sessionData.session.user.id,
        name: 'My Portfolio',
        description: 'Default portfolio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_value: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting default portfolio:", error);
      return null; // Return null instead of throwing
    }
    
    return data;
  } catch (error) {
    console.error("Error creating default portfolio:", error);
    return null; // Return null instead of throwing to prevent app crashes
  }
}