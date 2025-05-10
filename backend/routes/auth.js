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

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  
  try {
    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name
        }
      }
    });
    
    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }
    
    // Create user profile record in profiles table
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          first_name,
          last_name,
          created_at: new Date()
        });
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: authData.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Log out user
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Get current user profile
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, profile: data });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reset email' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  const { first_name, last_name, phone, avatar_url } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        phone,
        avatar_url,
        updated_at: new Date()
      })
      .eq('id', req.user.id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    return res.status(200).json({ success: true, message: 'Profile updated', profile: data[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

export default router; 