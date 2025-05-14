/**
 * Advisor Proxy Component
 * This component handles the connection between the frontend and backend for the advisor functionality
 */

import { sendChatMessage, fetchConversationHistory, checkApiKeys } from '@/lib/api/advisor';

/**
 * Send a message to the advisor
 * @param {string} message - The user's message
 * @param {string|null} conversationId - Optional conversation ID for continuing a conversation
 * @param {object} context - Additional context for the chat
 * @returns {Promise<object>} - The response from the advisor
 */
export const sendMessage = async (message, conversationId = null, context = {}) => {
  try {
    // Add timestamp to context
    const contextWithTimestamp = {
      ...context,
      timestamp: new Date().toISOString()
    };
    
    // Send the message to the advisor
    const response = await sendChatMessage(message, conversationId, contextWithTimestamp);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error sending message to advisor:', error);
    
    // If we're in development mode and the error is related to connection,
    // return a simulated response
    if (process.env.NODE_ENV === 'development' && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('Network Error') ||
         error.message.includes('could not be reached'))) {
      
      console.warn('Using simulated response in development mode');
      
      return {
        success: true,
        simulated: true,
        data: {
          message: `I'm currently running in simulation mode. The backend could not be reached. Your message was: "${message}". In a real environment, I would provide financial advice based on your query and the available market data.`,
          agent_name: 'financial_advisor',
          conversation_id: conversationId || 'sim-' + Date.now(),
          created_at: new Date().toISOString()
        }
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get conversation history
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} - The conversation history
 */
export const getConversationHistory = async (conversationId) => {
  try {
    if (!conversationId) {
      return {
        success: true,
        data: { messages: [] }
      };
    }
    
    const history = await fetchConversationHistory(conversationId);
    
    return {
      success: true,
      data: history
    };
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if the user has API keys configured
 * @returns {Promise<boolean>} - Whether the user has API keys configured
 */
export const hasApiKeysConfigured = async () => {
  try {
    return await checkApiKeys();
  } catch (error) {
    console.error('Error checking API keys:', error);
    return false;
  }
};
