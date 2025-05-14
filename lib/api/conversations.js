/**
 * Conversation Management API
 * Handles operations related to conversations such as listing, deleting, and clearing
 */

import { getAuthHeader, isDevMode } from '../auth/dev-auth';

// Backend API base URL
const API_BASE_URL = isDevMode() ? 'http://localhost:5000/api' : '/api';

/**
 * List all conversations for the current user
 * @param {number} limit - Maximum number of conversations to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} List of conversations
 */
export const listConversations = async (limit = 20, offset = 0) => {
  // In development mode, use session storage
  if (isDevMode()) {
    try {
      // Get conversations from session storage
      const storedConversations = JSON.parse(sessionStorage.getItem('finance_advisor_conversations') || '[]');
      
      // Sort by most recent update
      const sortedConversations = storedConversations.sort((a, b) => {
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      
      // Apply limit and offset
      return sortedConversations.slice(offset, offset + limit);
    } catch (e) {
      console.error('Error retrieving conversations from session storage:', e);
      return [];
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/conversations?limit=${limit}&offset=${offset}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    
    // In development mode, return mock data
    if (isDevMode()) {
      return mockConversations();
    }
    
    throw error;
  }
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - ID of the conversation to delete
 * @returns {Promise<Object>} Success status
 */
export const deleteConversation = async (conversationId) => {
  // In development mode, delete from session storage
  if (isDevMode()) {
    try {
      // Get conversations from session storage
      const storedConversations = JSON.parse(sessionStorage.getItem('finance_advisor_conversations') || '[]');
      
      // Remove the conversation
      const updatedConversations = storedConversations.filter(conv => conv.id !== conversationId);
      
      // Save back to storage
      sessionStorage.setItem('finance_advisor_conversations', JSON.stringify(updatedConversations));
      
      console.log(`Development mode: Deleted conversation ${conversationId}`);
      return { status: 'success', message: 'Conversation deleted successfully', id: conversationId };
    } catch (e) {
      console.error('Error deleting conversation from session storage:', e);
      return { status: 'error', message: 'Failed to delete conversation', id: conversationId };
    }
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to delete conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Clear all messages in a conversation
 * @param {string} conversationId - ID of the conversation to clear
 * @returns {Promise<Object>} Success status
 */
/**
 * Add a new conversation or message to local development conversations
 * @param {Object} data - Conversation data
 */
export const addLocalConversation = (data) => {
  if (!isDevMode()) return;
  
  // If this has a conversation_id, it's a message for an existing conversation
  if (data.conversation_id) {
    const existingConv = localConversations.find(c => c.id === data.conversation_id);
    if (existingConv) {
      // Update timestamp
      existingConv.updated_at = new Date().toISOString();
      return existingConv;
    }
  } else {
    // Create a new conversation
    const newConv = {
      id: `conv-${Date.now()}`,
      title: data.title || data.message.substring(0, 30) + '...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localConversations.push(newConv);
    return newConv;
  }
};

export const clearConversation = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to clear conversation ${conversationId}:`, error);
    
    // In development mode, return success
    if (isDevMode()) {
      return { status: 'success', message: 'Conversation cleared (dev mode)' };
    }
    
    throw error;
  }
};

/**
 * Update a conversation's title
 * @param {string} conversationId - ID of the conversation to update
 * @param {string} title - New title for the conversation
 * @returns {Promise<Object>} Success status
 */
export const updateConversationTitle = async (conversationId, title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/title?title=${encodeURIComponent(title)}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to update conversation title ${conversationId}:`, error);
    
    // In development mode, return success
    if (isDevMode()) {
      return { status: 'success', message: 'Conversation title updated (dev mode)' };
    }
    
    throw error;
  }
};

/**
 * Generate mock conversations for development mode
 * @returns {Array} Mock conversations
 */
const mockConversations = () => {
  return [
    {
      id: 'mock-conv-1',
      title: 'Investment Strategy Discussion',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
      last_message: 'Based on your risk tolerance, I recommend a balanced portfolio with 60% stocks and 40% bonds.',
      agent_name: 'financial_advisor'
    },
    {
      id: 'mock-conv-2',
      title: 'Market Analysis for Tech Stocks',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
      last_message: 'The tech sector has shown strong growth with a 15% increase over the last quarter.',
      agent_name: 'market_analyst'
    },
    {
      id: 'mock-conv-3',
      title: 'Retirement Planning',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      last_message: 'With your current savings rate, you are on track to reach your retirement goal by age 62.',
      agent_name: 'retirement_planner'
    }
  ];
};
