/**
 * Authentication Middleware
 * This module provides authentication and user handling for the API.
 */

import { supabase } from '../services/supabase.js';
import { settings } from '../config/settings.js';

// User class with API keys
export class UserWithKeys {
  constructor(userId, email, googleApiKey, alphaVantageKey) {
    this.id = userId;
    this.email = email;
    this.googleApiKey = googleApiKey;
    this.alphaVantageKey = alphaVantageKey;
  }
}

/**
 * Middleware to authenticate user and attach user info to request
 */
export async function authenticateUser(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    
    if (!authorization) {
      return res.status(401).json({ error: "Authorization header is required" });
    }
    
    // Extract token
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: "Invalid authorization format" });
    }
    
    const token = parts[1];
    
    // Verify with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    // Get user
    const user = data.user;
    
    // Get user's API keys from the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('google_api_key, alpha_vantage_key')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ error: "Error fetching user profile" });
    }
    
    // Create user object with keys
    const userWithKeys = new UserWithKeys(
      user.id,
      user.email,
      profileData?.google_api_key || settings.DEFAULT_GOOGLE_API_KEY,
      profileData?.alpha_vantage_key || settings.DEFAULT_ALPHA_VANTAGE_KEY
    );
    
    // Attach to request
    req.user = userWithKeys;
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ error: "Server error during authentication" });
  }
}

/**
 * Development-only middleware that skips real authentication
 * and attaches a development user to the request
 */
export function devAuthentication(req, res, next) {
  // Make sure we have valid API keys for development mode
  const googleApiKey = settings.DEFAULT_GOOGLE_API_KEY || process.env.DEFAULT_GOOGLE_API_KEY;
  const alphaVantageKey = settings.DEFAULT_ALPHA_VANTAGE_KEY || process.env.DEFAULT_ALPHA_VANTAGE_KEY;
  
  console.log('Dev authentication - using API keys:', {
    googleKeyAvailable: Boolean(googleApiKey),
    alphaVantageKeyAvailable: Boolean(alphaVantageKey)
  });
  
  req.user = new UserWithKeys(
    'dev-user-id',
    'dev@example.com',
    googleApiKey,
    alphaVantageKey
  );
  
  next();
}

export default { authenticateUser, devAuthentication, UserWithKeys };
