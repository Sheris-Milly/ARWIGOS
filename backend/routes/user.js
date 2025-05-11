import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to verify user is authenticated (copied and adapted from auth.js for now)
// Consider refactoring this into a shared middleware file if used in more places.
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Authentication error details:', error);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication server error:', error);
    return res.status(500).json({ success: false, message: 'Authentication server error' });
  }
};

// Endpoint to save/update user API keys
router.post('/api-keys', authenticateUser, async (req, res) => {
  const { googleApiKey, rapidApiKey } = req.body;
  const userId = req.user.id;

  if (!googleApiKey || !rapidApiKey) {
    return res.status(400).json({ success: false, message: 'Both Google API Key and RapidAPI Key are required.' });
  }

  try {
    // Ensure the profiles table has columns: google_api_key and alpha_vantage_key
    const { data, error } = await supabase
      .from('profiles')
      .update({
        google_api_key: googleApiKey,
        alpha_vantage_key: rapidApiKey,
        updated_at: new Date(), // Optionally update timestamp
      })
      .eq('id', userId)
      .select(); // .select() can be used to get the updated row back

    if (error) {
      console.error('Error updating API keys in Supabase:', error);
      // Check for specific Supabase errors, e.g., if the column doesn't exist
      if (error.code === '42703') { // '42703' is PostgreSQL error for undefined column
         return res.status(500).json({ success: false, message: `Database error: A required column might be missing. Details: ${error.message}` });
      }
      return res.status(500).json({ success: false, message: `Failed to save API keys: ${error.message}` });
    }

    if (!data || data.length === 0) {
        // This case might happen if the user's profile doesn't exist, though it should if they are authenticated.
        // Or if the update condition didn't match any row.
        console.warn(`No profile found for user ID: ${userId} during API key update, or no rows were updated.`);
        // Attempt to insert if user exists but profile row is missing (edge case)
        // This assumes 'profiles' table has 'id' as primary key linked to auth.users.id
        const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .upsert({ 
                id: userId, 
                google_api_key: googleApiKey, 
                alpha_vantage_key: rapidApiKey,
                // You might need to fetch other required profile fields if upserting a new row
                // or ensure your table allows nulls for them / has defaults.
                updated_at: new Date()
            }, { onConflict: 'id' })
            .select();

        if (insertError) {
            console.error('Error upserting API keys in Supabase after initial update failed:', insertError);
            return res.status(500).json({ success: false, message: `Failed to save API keys (upsert): ${insertError.message}` });
        }
        if (!insertData || insertData.length === 0) {
            return res.status(404).json({ success: false, message: 'User profile not found and failed to create/update API keys.' });
        }
        return res.status(200).json({ success: true, message: 'API keys saved successfully (upserted).', data: insertData[0] });
    }

    return res.status(200).json({ success: true, message: 'API keys saved successfully.', data: data[0] });

  } catch (error) {
    console.error('Server error while saving API keys:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred while saving API keys.' });
  }
});

export default router;