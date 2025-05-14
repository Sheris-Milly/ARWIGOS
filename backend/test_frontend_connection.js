/**
 * Test frontend connection to the advisor API
 * This script helps test that the backend multi-agent system
 * is properly connected to the frontend advisor component.
 */

import express from 'express';
import { settings } from './config/settings.js';
import { buildAgents } from './services/agents.js';
import { getAgentDefinition } from './models/agents.js';

// Create a test app
const app = express();
app.use(express.json());

// Simple agent test route
app.post('/test-advisor', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    console.log(`Test received: "${message}"`);
    
    // Initialize agents
    const agents = buildAgents();
    
    // Select general agent for test
    const agent = agents["General"];
    if (!agent) {
      return res.status(500).json({ error: "Failed to initialize agents" });
    }
    
    // Get response
    const response = await agent.invoke({
      input: message,
      chat_history: []
    });
    
    // Format response
    const agentDef = getAgentDefinition("general");
    const result = {
      message: response.output,
      agent_name: "general",
      agent_display_name: agentDef.displayName,
      agent_icon: agentDef.icon,
      agent_color: agentDef.color,
      conversation_id: "test-conversation",
      created_at: new Date().toISOString()
    };
    
    console.log("Test response:", result.message.substring(0, 100) + "...");
    res.json(result);
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start test server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Send POST requests to http://localhost:${PORT}/test-advisor`);
  console.log(`Example: curl -X POST -H "Content-Type: application/json" -d '{"message":"Tell me about investing"}' http://localhost:${PORT}/test-advisor`);
});
