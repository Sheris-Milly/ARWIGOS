import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const settings = {
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  DEFAULT_GOOGLE_API_KEY: process.env.DEFAULT_GOOGLE_API_KEY || "AIzaSyBn78kZVluHdkJ8inKVp7enOQatqCKERt0",
  DEFAULT_ALPHA_VANTAGE_KEY: process.env.DEFAULT_ALPHA_VANTAGE_KEY || "XBYMG2VY49SX4K21",
  ALPHA_VANTAGE_HOST: process.env.ALPHA_VANTAGE_HOST || "www.alphavantage.co",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash"
};

export default settings;
