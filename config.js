/**
 * Configuration file for the Finance Advisor application
 * Contains settings for both frontend and backend connections
 */

const config = {
  // Backend API settings
  backend: {
    // Base URL for the FastAPI server
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
    
    // API endpoints
    endpoints: {
      chat: '/chat',
      health: '/health',
      userApiKeys: '/user/api-keys',
      conversations: '/conversations'
    },
    
    // Request timeout in milliseconds
    timeout: 30000
  },
  
  // Frontend settings
  frontend: {
    // Base URL for the frontend
    baseUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
  }
};

module.exports = config;
