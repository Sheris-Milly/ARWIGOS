/**
 * Conversation management routes for the advisory system
 * This module provides endpoints for managing conversations.
 */

import express from 'express';
import { authenticateUser, devAuthentication } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

const router = express.Router();

/**
 * Get the list of user's conversations
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get conversations from Supabase
    const { data: conversations, error } = await supabase.from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit)
      .offset(offset);
    
    if (error) throw new Error(error.message);
    
    // Get the last message for each conversation
    for (const conv of conversations) {
      try {
        const { data: lastMsgData, error: lastMsgError } = await supabase.from("chat_messages")
          .select("ai_response, agent_name")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (lastMsgError) throw new Error(lastMsgError.message);
        
        if (lastMsgData && lastMsgData.length > 0) {
          const lastMsg = lastMsgData[0].ai_response || "";
          conv.last_message = lastMsg.length > 100 ? lastMsg.substring(0, 100) + "..." : lastMsg;
          conv.agent_name = lastMsgData[0].agent_name;
        } else {
          conv.last_message = null;
          conv.agent_name = null;
        }
      } catch (e) {
        console.error(`Failed to get last message for conversation ${conv.id}:`, e);
        conv.last_message = null;
        conv.agent_name = null;
      }
    }
    
    res.json({ conversations });
  } catch (e) {
    console.error("Failed to list conversations:", e);
    res.status(500).json({ error: `Failed to list conversations: ${e.message}` });
  }
});

/**
 * Get a specific conversation
 */
router.get('/:conversationId', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    
    // Verify conversation belongs to the user
    const { data, error } = await supabase.from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Conversation not found" });
      }
      throw new Error(error.message);
    }
    
    // Get the last message
    const { data: lastMsgData } = await supabase.from("chat_messages")
      .select("ai_response, agent_name")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (lastMsgData && lastMsgData.length > 0) {
      data.last_message = lastMsgData[0].ai_response;
      data.agent_name = lastMsgData[0].agent_name;
    }
    
    res.json(data);
  } catch (e) {
    console.error("Failed to get conversation:", e);
    res.status(500).json({ error: `Failed to get conversation: ${e.message}` });
  }
});

/**
 * Delete a conversation and its messages
 */
router.delete('/:conversationId', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    
    // Verify conversation belongs to the user
    const { data, error } = await supabase.from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id);
    
    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Conversation not found or not owned by user" });
    }
    
    // Delete messages first (foreign key constraint)
    const { error: msgError } = await supabase.from("chat_messages")
      .delete()
      .eq("conversation_id", conversationId);
    
    if (msgError) throw new Error(msgError.message);
    
    // Delete the conversation
    const { error: convError } = await supabase.from("conversations")
      .delete()
      .eq("id", conversationId);
    
    if (convError) throw new Error(convError.message);
    
    res.json({ status: "success", message: "Conversation deleted" });
  } catch (e) {
    console.error("Failed to delete conversation:", e);
    res.status(500).json({ error: `Failed to delete conversation: ${e.message}` });
  }
});

/**
 * Clear all messages in a conversation but keep the conversation
 */
router.post('/:conversationId/clear', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    
    // Verify conversation belongs to the user
    const { data, error } = await supabase.from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id);
    
    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Conversation not found or not owned by user" });
    }
    
    // Delete all messages in the conversation
    const { error: msgError } = await supabase.from("chat_messages")
      .delete()
      .eq("conversation_id", conversationId);
    
    if (msgError) throw new Error(msgError.message);
    
    // Update the conversation's updated_at timestamp
    const { error: updateError } = await supabase.from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    
    if (updateError) throw new Error(updateError.message);
    
    res.json({ status: "success", message: "Conversation cleared" });
  } catch (e) {
    console.error("Failed to clear conversation:", e);
    res.status(500).json({ error: `Failed to clear conversation: ${e.message}` });
  }
});

/**
 * Update a conversation's title
 */
router.put('/:conversationId/title', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Verify conversation belongs to the user
    const { data, error } = await supabase.from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id);
    
    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Conversation not found or not owned by user" });
    }
    
    // Update the title
    const { error: updateError } = await supabase.from("conversations")
      .update({ 
        title, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", conversationId);
    
    if (updateError) throw new Error(updateError.message);
    
    res.json({ status: "success", message: "Title updated" });
  } catch (e) {
    console.error("Failed to update title:", e);
    res.status(500).json({ error: `Failed to update title: ${e.message}` });
  }
});

/**
 * Get the messages for a specific conversation
 */
router.get('/:conversationId/messages', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const conversationId = req.params.conversationId;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Verify conversation belongs to the user
    const { data: convData, error: convError } = await supabase.from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id);
    
    if (convError) throw new Error(convError.message);
    
    if (!convData || convData.length === 0) {
      return res.status(404).json({ error: "Conversation not found or not owned by user" });
    }
    
    // Get messages
    const { data: messages, error: msgError } = await supabase.from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit)
      .offset(offset);
    
    if (msgError) throw new Error(msgError.message);
    
    res.json({ messages: messages || [] });
  } catch (e) {
    console.error("Failed to get messages:", e);
    res.status(500).json({ error: `Failed to get messages: ${e.message}` });
  }
});

/**
 * Development versions of the routes that don't require real authentication
 */
// These routes are for development only and use the dev authentication middleware
router.get('/dev', devAuthentication, async (req, res) => {
  // Same implementation as authenticated version but with devAuthentication middleware
  // ... (remaining implementation would be identical)
});

// Export the router
export default router;
