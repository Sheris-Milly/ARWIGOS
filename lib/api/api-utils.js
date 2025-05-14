/**
 * API Utilities
 * Handles API requests to the backend
 */

import { getAuthHeader, isDevMode } from '../auth/dev-auth';

// Backend API base URL
const API_BASE_URL = isDevMode() ? 'http://localhost:5000/api' : '/api';

// Use special development endpoints when in development mode
const getEndpoint = (endpoint) => {
  if (isDevMode()) {
    if (endpoint === '/chat') {
      return '/chat/dev'; // Use the development chat endpoint that doesn't require auth
    }
  }
  return endpoint;
};

/**
 * Make an authenticated API request to the backend
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} The API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Use the appropriate endpoint based on the environment
  const adjustedEndpoint = getEndpoint(endpoint);
  const url = `${API_BASE_URL}${adjustedEndpoint}`;
  
  // Add authentication header
  const headers = {
    ...options.headers,
    ...getAuthHeader(),
  };
  
  // Add content type if not specified
  if (!headers['Content-Type'] && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  // No longer using automatic simulation for chat endpoints
  // We'll use the real backend instead even in development mode
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 400) {
        const data = await response.json();
        throw new Error(data.detail || 'Bad request');
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }
    
    // Parse JSON response
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    
    // In development mode, provide fallback responses for non-chat endpoints
    if (isDevMode()) {
      console.warn('Connection to backend failed. Using simulated response as fallback.');
      
      // We already handle chat endpoints at the top of the function, so we only need to handle other endpoints here
      if (endpoint.includes('/conversations/')) {
        return {
          messages: []
        };
      }
      
      return {
        simulated: true,
        message: 'This is a simulated fallback response. The backend service is currently unavailable.',
        status: 'ok'
      };
    }
    
    // Re-throw the error in production or for other error types
    throw error;
  }
};

/**
 * Send a chat message to the advisor
 * @param {string} message - The message to send
 * @param {string|null} conversationId - Optional conversation ID
 * @param {string|null} agentType - The agent type to route the message to
 * @param {Object} additionalContext - Additional context data
 * @returns {Promise<any>} The advisor response with agent details
 */
export const sendChatMessage = async (message, conversationId = null, agentType = null, additionalContext = {}) => {
  // Format agent identifier for the backend
  const formattedAgentType = agentType === 'gpt4o' ? 'gpt4o' : (agentType || 'general');
  
  // For development mode, we'll track conversations locally
  const trackLocalConversation = (data) => {
    if (!isDevMode()) return null;
    
    // Generate a simple conversation tracking system for development
    const conversationId = data.conversation_id || `conv-${Date.now()}`;
    const title = data.title || (data.message && data.message.substring(0, 30) + '...');
    
    // Save to session storage for persistence between page refreshes
    try {
      // Get existing conversations
      const storedConversations = JSON.parse(sessionStorage.getItem('finance_advisor_conversations') || '[]');
      
      // Check if this conversation exists
      const existingIndex = storedConversations.findIndex(c => c.id === conversationId);
      
      if (existingIndex >= 0) {
        // Update existing conversation
        storedConversations[existingIndex].updated_at = new Date().toISOString();
      } else {
        // Add new conversation
        storedConversations.push({
          id: conversationId,
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      // Save back to storage
      sessionStorage.setItem('finance_advisor_conversations', JSON.stringify(storedConversations));
      
      return { id: conversationId, title };
    } catch (e) {
      console.warn('Failed to track local conversation:', e);
      return { id: conversationId, title };
    }
  }
  
  // Make the API request
  const result = await apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      agent_type: formattedAgentType,
      context: {
        ...additionalContext,
        timestamp: new Date().toISOString(),
      },
    }),
  });
  
  // Track the conversation in development mode
  if (isDevMode()) {
    const trackedConv = trackLocalConversation({
      conversation_id: result.conversationId || conversationId,
      message,
      title: result.title,
    });
    
    // Update the result with conversation ID if it was created
    if (trackedConv && !result.conversationId) {
      result.conversationId = trackedConv.id;
    }
  }
  
  return result;
};

/**
 * Get conversation history
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<any>} The conversation history
 */
export const getConversationHistory = async (conversationId) => {
  if (!conversationId) {
    return { messages: [] };
  }
  
  try {
    return await apiRequest(`/conversations/${conversationId}/messages`);
  } catch (error) {
    console.error(`Failed to fetch conversation history: ${error}`);
    
    // If in development mode, provide a simulated chat history
    if (isDevMode()) {
      // Generate a random number of messages (2-5)
      const messageCount = Math.floor(Math.random() * 4) + 2;
      const messages = [];
      
      const agents = [
        { name: 'general', display_name: 'Financial Advisor', icon: '💼', color: '#4CAF50' },
        { name: 'market_analyst', display_name: 'Market Analyst', icon: '📈', color: '#2196F3' },
        { name: 'retirement_planner', display_name: 'Retirement Planner', icon: '🏖️', color: '#FF9800' },
        { name: 'tax_advisor', display_name: 'Tax Advisor', icon: '📊', color: '#9C27B0' }
      ];
      
      for (let i = 0; i < messageCount; i++) {
        // Alternate between user and AI messages
        if (i % 2 === 0) {
          messages.push({
            type: 'user',
            message: `This is a simulated user message ${i + 1}`,
            created_at: new Date(Date.now() - (messageCount - i) * 600000).toISOString()
          });
        } else {
          // Pick a random agent for each AI response
          const agent = agents[Math.floor(Math.random() * agents.length)];
          
          messages.push({
            type: 'ai',
            message: `This is a simulated AI response ${Math.floor(i / 2) + 1}`,
            agent_name: agent.name,
            agent_display_name: agent.display_name,
            agent_icon: agent.icon,
            agent_color: agent.color,
            created_at: new Date(Date.now() - (messageCount - i) * 600000).toISOString()
          });
        }
      }
      
      return { 
        messages,
        simulated: true,
        conversationId
      };
    }
    
    throw error;
  }
};
