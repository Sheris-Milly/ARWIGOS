/**
 * API utilities for the advisor functionality
 */

import config from '../../config';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || config.backend.baseUrl;

/**
 * Get the authorization token from storage
 * @returns {string|null} The authorization token or null if not found
 */
export const getAuthToken = () => {
  // Try localStorage with different key formats
  const possibleKeys = [
    'supabase.auth.token',
    'sb-auth-token',
    'sb:token',
    'supabase.auth.data',
    'sb-access-token',
    'sb-refresh-token'
  ];
  
  let token = null;
  
  // Check localStorage
  for (const key of possibleKeys) {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      token = storedValue;
      break;
    }
  }
  
  // Check sessionStorage if not found in localStorage
  if (!token) {
    for (const key of possibleKeys) {
      const storedValue = sessionStorage.getItem(key);
      if (storedValue) {
        token = storedValue;
        break;
      }
    }
  }
  
  // Development mode fallback
  if (!token && process.env.NODE_ENV === 'development') {
    console.warn('Using development mode fallback authentication');
    token = 'dev-mode-token';
  }
  
  if (!token) {
    return null;
  }
  
  // Parse the token if needed
  let accessToken = '';
  try {
    // Try parsing as JSON
    const parsedToken = JSON.parse(token);
    accessToken = parsedToken.access_token || parsedToken.token || parsedToken.currentSession?.access_token || '';
  } catch {
    // If not JSON, use the token directly
    accessToken = token;
  }
  
  if (!accessToken && process.env.NODE_ENV === 'development') {
    // Use the dev mode token
    accessToken = 'dev-mode-token';
  }
  
  return accessToken;
};

/**
 * Send a chat message to the advisor
 * @param {string} message - The user's message
 * @param {string|null} conversationId - Optional conversation ID for continuing a conversation
 * @param {object} context - Additional context for the chat
 * @returns {Promise<object>} - The response from the advisor
 */
export const sendChatMessage = async (message, conversationId = null, context = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication token not found. Please log in or refresh the page.");
  }
  
  try {
    const response = await fetch(`${BACKEND}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        context
      }),
    });
    
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.detail && errorData.detail.includes("API key")) {
          throw new Error("API key error: " + errorData.detail + ". Please update your API keys in your profile settings.");
        }
        throw new Error(errorData.detail || "Bad request");
      } else if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `API Error: ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * Fetch conversation history
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} - The conversation history
 */
export const fetchConversationHistory = async (conversationId) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication token not found. Please log in or refresh the page.");
  }
  
  try {
    const response = await fetch(`${BACKEND}/conversations/${conversationId}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      return { messages: [] };
    }
    
    if (!response.ok) {
      throw new Error(`Error fetching history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    throw error;
  }
};

/**
 * Check if required API keys are configured
 * @returns {Promise<boolean>} - True if both Gemini and Alpha Vantage keys are configured
 */
export const checkApiKeys = async () => {
  try {
    const response = await fetch(`${BACKEND}/dev/health`);
    const data = await response.json();
    return data.gemini_api_key_configured && data.alpha_vantage_key_configured;
  } catch (error) {
    console.error("Error checking API keys:", error);
    return false;
  }
};

/**
 * Check if the currently authenticated user has API keys configured
 * @returns {Promise<boolean>} - Whether the user has API keys configured
 */
export const userHasApiKeys = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication token not found. Please log in or refresh the page.");
  }
  
  try {
    const response = await fetch(`${config.backend.baseUrl}${config.backend.endpoints.userApiKeys}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error checking API keys:", error);
    return false;
  }
};
