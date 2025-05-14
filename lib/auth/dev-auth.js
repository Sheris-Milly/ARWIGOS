/**
 * Development mode authentication utilities
 * This file provides helper functions for authentication in development mode
 */

/**
 * Get a development mode authentication token
 * This is used for testing purposes only
 * @returns {string} The development mode authentication token
 */
export const getDevModeToken = () => {
  return 'dev-mode-token';
};

/**
 * Check if the application is running in development mode
 * @returns {boolean} True if in development mode, false otherwise
 */
export const isDevMode = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Get an authentication token for the current environment
 * In development mode, this will return a development token
 * In production, this will attempt to get a token from storage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  // Always use development mode token when in development
  if (isDevMode()) {
    console.warn('Using development mode authentication');
    return getDevModeToken();
  }
  
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
  
  return token;
};

/**
 * Parse an authentication token
 * @param {string} token - The authentication token to parse
 * @returns {string} The parsed token
 */
export const parseAuthToken = (token) => {
  // If in development mode, always return the dev token
  if (isDevMode()) {
    return getDevModeToken();
  }
  
  if (!token) return null;
  
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
  
  return accessToken || null;
};

/**
 * Get the authorization header for API requests
 * @returns {Object} The authorization header
 */
export const getAuthHeader = () => {
  // In development mode, always use the dev token
  if (isDevMode()) {
    return {
      'Authorization': `Bearer ${getDevModeToken()}`
    };
  }
  
  const token = getAuthToken();
  const parsedToken = parseAuthToken(token);
  
  if (!parsedToken) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${parsedToken}`
  };
};
