import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to verify user is authenticated
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Authentication server error' });
  }
};

// Get all portfolios for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*, portfolio_stocks(*, stock_details:stocks(*))')
      .eq('user_id', req.user.id);
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, portfolios: data });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch portfolios' });
  }
});

// Get a specific portfolio
router.get('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Get the portfolio stocks
    const { data: portfolioStocks, error: stocksError } = await supabase
      .from('portfolio_stocks')
      .select('*, stock_details:stocks(*)')
      .eq('portfolio_id', id);
    
    if (stocksError) {
      return res.status(400).json({ success: false, message: stocksError.message });
    }
    
    // Get portfolio performance
    const { data: performance, error: perfError } = await supabase
      .from('portfolio_performance')
      .select('*')
      .eq('portfolio_id', id)
      .order('date', { ascending: false })
      .limit(30);
    
    if (perfError) {
      console.error('Performance fetch error:', perfError);
    }
    
    const portfolioWithStocks = {
      ...portfolio,
      stocks: portfolioStocks,
      performance: performance || []
    };
    
    return res.status(200).json({ success: true, portfolio: portfolioWithStocks });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
});

// Create a new portfolio
router.post('/', authenticateUser, async (req, res) => {
  const { name, description, is_public } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Portfolio name is required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        name,
        description,
        is_public: is_public || false,
        user_id: req.user.id,
        created_at: new Date()
      })
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-created', data[0]);
    }
    
    return res.status(201).json({ success: true, portfolio: data[0] });
  } catch (error) {
    console.error('Portfolio creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create portfolio' });
  }
});

// Update a portfolio
router.put('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { name, description, is_public } = req.body;
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    const { data, error } = await supabase
      .from('portfolios')
      .update({
        name,
        description,
        is_public,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-updated', data[0]);
    }
    
    return res.status(200).json({ success: true, portfolio: data[0] });
  } catch (error) {
    console.error('Portfolio update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update portfolio' });
  }
});

// Delete a portfolio
router.delete('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Delete portfolio stocks first (cascade should handle this, but doing it explicitly)
    const { error: stocksError } = await supabase
      .from('portfolio_stocks')
      .delete()
      .eq('portfolio_id', id);
    
    if (stocksError) {
      console.error('Error deleting portfolio stocks:', stocksError);
    }
    
    // Delete the portfolio
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-deleted', id);
    }
    
    return res.status(200).json({ success: true, message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Portfolio deletion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete portfolio' });
  }
});

// Add a stock to a portfolio
router.post('/:id/stocks', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { stock_id, ticker, quantity, purchase_price, purchase_date, notes } = req.body;
  
  if (!ticker || !quantity || !purchase_price) {
    return res.status(400).json({ 
      success: false, 
      message: 'Stock ticker, quantity, and purchase price are required' 
    });
  }
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Check if the stock exists or create it
    let stockId = stock_id;
    
    if (!stockId) {
      // Look up stock by ticker
      const { data: existingStock, error: stockLookupError } = await supabase
        .from('stocks')
        .select('id')
        .eq('ticker', ticker.toUpperCase())
        .single();
      
      if (existingStock) {
        stockId = existingStock.id;
      } else {
        // Create a new stock entry
        const { data: newStock, error: createStockError } = await supabase
          .from('stocks')
          .insert({
            ticker: ticker.toUpperCase(),
            name: ticker.toUpperCase(), // Can be updated later with stock details API
            created_at: new Date()
          })
          .select();
        
        if (createStockError) {
          return res.status(400).json({ success: false, message: createStockError.message });
        }
        
        stockId = newStock[0].id;
      }
    }
    
    // Add the stock to the portfolio
    const { data, error } = await supabase
      .from('portfolio_stocks')
      .insert({
        portfolio_id: id,
        stock_id: stockId,
        quantity,
        purchase_price,
        purchase_date: purchase_date || new Date(),
        notes,
        created_at: new Date()
      })
      .select('*, stock_details:stocks(*)');
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Update portfolio total value
    await updatePortfolioValue(id);
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-stock-added', { portfolioId: id, stock: data[0] });
    }
    
    return res.status(201).json({ success: true, stock: data[0] });
  } catch (error) {
    console.error('Add stock error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add stock to portfolio' });
  }
});

// Update a stock in a portfolio
router.put('/:portfolioId/stocks/:stockEntryId', authenticateUser, async (req, res) => {
  const { portfolioId, stockEntryId } = req.params;
  const { quantity, purchase_price, purchase_date, notes } = req.body;
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Update the stock entry
    const { data, error } = await supabase
      .from('portfolio_stocks')
      .update({
        quantity,
        purchase_price,
        purchase_date,
        notes,
        updated_at: new Date()
      })
      .eq('id', stockEntryId)
      .eq('portfolio_id', portfolioId)
      .select('*, stock_details:stocks(*)');
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock entry not found' });
    }
    
    // Update portfolio total value
    await updatePortfolioValue(portfolioId);
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-stock-updated', { 
        portfolioId, 
        stockEntryId, 
        stock: data[0] 
      });
    }
    
    return res.status(200).json({ success: true, stock: data[0] });
  } catch (error) {
    console.error('Update stock error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

// Remove a stock from a portfolio
router.delete('/:portfolioId/stocks/:stockEntryId', authenticateUser, async (req, res) => {
  const { portfolioId, stockEntryId } = req.params;
  
  try {
    // First check if the portfolio belongs to the user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', req.user.id)
      .single();
    
    if (portfolioError || !portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }
    
    // Delete the stock entry
    const { error } = await supabase
      .from('portfolio_stocks')
      .delete()
      .eq('id', stockEntryId)
      .eq('portfolio_id', portfolioId);
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Update portfolio total value
    await updatePortfolioValue(portfolioId);
    
    // Access Socket.IO instance to emit real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('portfolio-stock-removed', { portfolioId, stockEntryId });
    }
    
    return res.status(200).json({ success: true, message: 'Stock removed from portfolio' });
  } catch (error) {
    console.error('Remove stock error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove stock' });
  }
});

// Helper function to update portfolio value
async function updatePortfolioValue(portfolioId) {
  try {
    // Get all stocks in the portfolio
    const { data: stocks, error: stocksError } = await supabase
      .from('portfolio_stocks')
      .select('*, stock_details:stocks(*)')
      .eq('portfolio_id', portfolioId);
    
    if (stocksError || !stocks) {
      console.error('Error fetching portfolio stocks:', stocksError);
      return;
    }
    
    // Calculate total value (would typically use current price from API, using purchase price as placeholder)
    let totalValue = 0;
    stocks.forEach(stock => {
      totalValue += stock.quantity * stock.purchase_price;
    });
    
    // Update portfolio value
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        total_value: totalValue,
        updated_at: new Date()
      })
      .eq('id', portfolioId);
    
    if (updateError) {
      console.error('Error updating portfolio value:', updateError);
    }
    
    // Record portfolio performance
    const { error: perfError } = await supabase
      .from('portfolio_performance')
      .insert({
        portfolio_id: portfolioId,
        value: totalValue,
        date: new Date()
      });
    
    if (perfError) {
      console.error('Error recording portfolio performance:', perfError);
    }
  } catch (error) {
    console.error('Portfolio value update error:', error);
  }
}

export default router; 