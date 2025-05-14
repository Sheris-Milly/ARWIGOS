/**
 * Chat Routes
 * This module provides endpoints for interacting with the multi-agent system.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser, devAuthentication } from '../middleware/auth.js';
import { buildUserAgents } from '../services/agents.js';
import { supabase } from '../services/supabase.js';
import { getAgentDefinition, generateConversationTitle } from '../models/agents.js';
import { validateRequest, validateResponse, chatInputSchema, chatOutputSchema } from '../models/dto.js';

const router = express.Router();

/**
 * Get chat history for a conversation
 */
async function getChatHistory(conversationId) {
  if (!conversationId) return [];
  
  try {
    const { data, error } = await supabase.from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (error) throw new Error(error.message);
    
    return data || [];
  } catch (e) {
    console.error(`Error getting chat history: ${e}`);
    return [];
  }
}

/**
 * Format chat history for LangChain
 */
function formatChatHistory(history) {
  if (!history || !history.length) return [];
  
  const formattedHistory = [];
  for (const message of history) {
    if (message.user_message) {
      formattedHistory.push({ type: 'human', content: message.user_message });
    }
    if (message.ai_response) {
      formattedHistory.push({ type: 'ai', content: message.ai_response });
    }
  }
  
  return formattedHistory;
}

/**
 * Main chat endpoint
 */
router.post('/', authenticateUser, validateRequest(chatInputSchema), async (req, res) => {
  try {
    const user = req.user;
    const { message, context } = req.body;
    const conversationId = req.query.conversation_id;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    
    console.log(`Received chat message: '${message}' for conversation: ${conversationId || 'new'}`);
    
    // Handle conversation creation
    let currentConversationId = conversationId;
    let isNewConversation = false;
    let conversationTitle = null;
    
    if (!currentConversationId) {
      currentConversationId = uuidv4();
      isNewConversation = true;
      conversationTitle = generateConversationTitle(message);
      
      // Create the conversation in Supabase
      const { error: convError } = await supabase.from("conversations").insert({
        id: currentConversationId,
        user_id: user.id,
        title: conversationTitle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (convError) {
        console.error("Error creating conversation:", convError);
        return res.status(500).json({ error: `Failed to create conversation: ${convError.message}` });
      }
    } else {
      // Update the conversation's updated_at
      const { error: updateError } = await supabase.from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentConversationId)
        .eq("user_id", user.id);
      
      if (updateError) {
        console.error("Error updating conversation:", updateError);
        // Continue execution even if update fails
      }
    }
    
    // Get chat history
    const rawHistory = await getChatHistory(currentConversationId);
    const history = formatChatHistory(rawHistory);
    
    // Save the user's message
    const { error: msgError } = await supabase.from("chat_messages").insert({
      id: uuidv4(),
      conversation_id: currentConversationId,
      user_id: user.id,
      user_message: message,
      ai_response: null,
      agent_name: null,
      created_at: new Date().toISOString()
    });
    
    if (msgError) {
      console.error("Error saving user message:", msgError);
      // Continue execution even if message save fails
    }
    
    try {
      // Build the agents system for this user
      const { destinations, routerChain } = buildUserAgents(user);
      
      // Route the message to the appropriate agent
      console.log("Routing message to appropriate agent...");
      let agentName;
      let nextInputs;
      
      try {
        const route = await routerChain.invoke({ input: message });
        agentName = route.destination;
        nextInputs = route.next_inputs;
        console.log(`Selected agent: ${agentName}`);
      } catch (routeError) {
        console.error("Error routing message:", routeError);
        agentName = "general"; // Default to general agent on routing error
        nextInputs = { input: message };
      }
      
      // Get the agent
      const agent = destinations[agentName] || destinations["general"];
      if (!agent) {
        throw new Error("No suitable agent available");
      }
      
      // Get agent definition
      const agentDef = getAgentDefinition(agentName);
      
      // Invoke the agent
      console.log(`Invoking agent ${agentName} with message: '${message}'`);
      const response = await agent.invoke({
        input: message,
        chat_history: history
      });
      
      // Get the response text
      const responseText = response.output || "I'm sorry, I couldn't generate a response.";
      
      // Save the AI response
      const { error: aiMsgError } = await supabase.from("chat_messages").insert({
        id: uuidv4(),
        conversation_id: currentConversationId,
        user_id: user.id,
        user_message: null,
        ai_response: responseText,
        agent_name: agentName,
        created_at: new Date().toISOString()
      });
      
      if (aiMsgError) {
        console.error("Error saving AI response:", aiMsgError);
        // Continue execution even if response save fails
      }
      
      // Format the response
      const result = {
        message: responseText,
        agent_name: agentName,
        agent_display_name: agentDef.displayName,
        agent_icon: agentDef.icon,
        agent_color: agentDef.color,
        conversation_id: currentConversationId,
        conversation_title: isNewConversation ? conversationTitle : null,
        created_at: new Date().toISOString()
      };
      
      // Validate response before sending
      const validatedResult = validateResponse(chatOutputSchema, result);
      res.json(validatedResult);
    } catch (agentError) {
      console.error("Agent error:", agentError);
      
      // Handle error gracefully with error agent
      const errorAgent = getAgentDefinition("error");
      const errorResponse = {
        message: `I encountered an error: ${agentError.message}\n\nPlease try again or try a different question.`,
        agent_name: "error",
        agent_display_name: errorAgent.displayName,
        agent_icon: errorAgent.icon,
        agent_color: errorAgent.color,
        conversation_id: currentConversationId,
        conversation_title: isNewConversation ? conversationTitle : null,
        created_at: new Date().toISOString()
      };
      
      // Save error response
      try {
        await supabase.from("chat_messages").insert({
          id: uuidv4(),
          conversation_id: currentConversationId,
          user_id: user.id,
          user_message: null,
          ai_response: errorResponse.message,
          agent_name: "error",
          created_at: new Date().toISOString()
        });
      } catch (saveError) {
        console.error("Error saving error response:", saveError);
      }
      
      res.json(errorResponse);
    }
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Development version of the chat endpoint that doesn't require real authentication
 */
router.post('/dev', devAuthentication, validateRequest(chatInputSchema), async (req, res) => {
  // Implementation is the same as the authenticated endpoint but uses devAuthentication middleware
  // ... (remaining implementation would be identical to the main endpoint)
  
  try {
    const user = req.user;
    const { message, context } = req.body;
    const conversationId = req.query.conversation_id;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    
    console.log(`Received DEV chat message: '${message}' for conversation: ${conversationId || 'new'}`);
    
    // Handle conversation creation
    let currentConversationId = conversationId;
    let isNewConversation = false;
    let conversationTitle = null;
    
    if (!currentConversationId) {
      currentConversationId = uuidv4();
      isNewConversation = true;
      conversationTitle = generateConversationTitle(message);
    }

    try {
      // Build the agents system for this user
      const { destinations, routerChain } = buildUserAgents(user);
      
      // Route the message to the appropriate agent
      console.log("Routing message to appropriate agent...");
      const route = await routerChain.invoke({ input: message });
      const agentName = route.destination;
      console.log(`Selected agent: ${agentName}`);
      
      // Get the agent
      const agent = destinations[agentName] || destinations["general"];
      if (!agent) {
        throw new Error("No suitable agent available");
      }
      
      // Get agent definition
      const agentDef = getAgentDefinition(agentName);
      
      // Invoke the agent
      console.log(`Invoking agent ${agentName} with message: '${message}'`);
      const response = await agent.invoke({
        input: message,
        chat_history: []  // In dev mode, we don't persist history
      });
      
      // Get the response text
      const responseText = response.output || "I'm sorry, I couldn't generate a response.";
      
      // Format the response
      const result = {
        message: responseText,
        agent_name: agentName,
        agent_display_name: agentDef.displayName,
        agent_icon: agentDef.icon,
        agent_color: agentDef.color,
        conversation_id: currentConversationId,
        conversation_title: isNewConversation ? conversationTitle : null,
        created_at: new Date().toISOString()
      };
      
      // Validate response before sending
      const validatedResult = validateResponse(chatOutputSchema, result);
      res.json(validatedResult);
    } catch (agentError) {
      console.error("Agent error:", agentError);
      
      // Handle error gracefully with error agent
      const errorAgent = getAgentDefinition("error");
      const errorResponse = {
        message: `I encountered an error: ${agentError.message}\n\nPlease try again or try a different question.`,
        agent_name: "error",
        agent_display_name: errorAgent.displayName,
        agent_icon: errorAgent.icon,
        agent_color: errorAgent.color,
        conversation_id: currentConversationId,
        conversation_title: isNewConversation ? conversationTitle : null,
        created_at: new Date().toISOString()
      };
      
      res.json(errorResponse);
    }
  } catch (e) {
    console.error("DEV Chat error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get conversation history
 */
router.get('/:conversationId/history', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    
    // Verify conversation ownership
    const { data: convData, error: convError } = await supabase.from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();
    
    if (convError) {
      if (convError.code === "PGRST116") {
        return res.status(404).json({ error: "Conversation not found or not owned by user" });
      }
      throw new Error(convError.message);
    }
    
    // Get history
    const { data: messages, error: msgError } = await supabase.from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (msgError) throw new Error(msgError.message);
    
    res.json({
      conversation: convData,
      messages: messages || []
    });
  } catch (e) {
    console.error("History fetch error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
