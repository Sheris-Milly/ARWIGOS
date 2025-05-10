import { AgentType, agentConfig, AgentResponse, UserInteraction } from './config';

// Simple in-memory conversation history storage
// In a production app, this would be stored in a database
const conversationHistories: Record<string, { role: string, content: string }[]> = {};

// Function to get Google Gemini API client
const getGeminiClient = (apiKey: string) => {
  if (typeof window === 'undefined') {
    // Server-side
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
  } else {
    // Client-side (browser)
    // For client-side, we'd use a different approach or API endpoint
    throw new Error('Direct Gemini API usage not supported in browser for security. Use server API endpoint.');
  }
};

/**
 * Runs a query through a specific agent
 */
export async function runAgentQuery(
  agentType: AgentType,
  query: string,
  userId: string = 'default',
  context?: any
): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }
    
    // Get conversation history for this user and agent
    const historyKey = `${userId}_${agentType}`;
    if (!conversationHistories[historyKey]) {
      conversationHistories[historyKey] = [];
      
      // Initialize with system prompt
      if (agentConfig[agentType]?.systemPrompt) {
        conversationHistories[historyKey].push({
          role: 'system',
          content: agentConfig[agentType].systemPrompt
        });
      }
    }
    
    // Add user query to history
    conversationHistories[historyKey].push({
      role: 'user',
      content: query + (context ? `\n\nContext: ${JSON.stringify(context)}` : '')
    });
    
    // Get the generative model
    const genAI = getGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-pro' });
    
    // Convert conversation history to format expected by Gemini
    const geminiHistory = conversationHistories[historyKey].map(msg => {
      if (msg.role === 'system') {
        // For Gemini, we'll treat system messages as if from the model
        return { role: 'model', parts: [{ text: msg.content }] };
      } else if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else {
        return { role: 'model', parts: [{ text: msg.content }] };
      }
    });
    
    // Remove the initial system message if it exists (we've already included it as a model message)
    if (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
      geminiHistory.shift();
    }
    
    // Create a chat session
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });
    
    // Generate a response
    const result = await chat.sendMessage(query);
    const response = result.response.text();
    
    // Add response to history
    conversationHistories[historyKey].push({
      role: 'assistant',
      content: response
    });
    
    // Keep history at a reasonable size (last 10 messages)
    if (conversationHistories[historyKey].length > 11) { // 1 system + 10 exchange messages
      conversationHistories[historyKey] = [
        conversationHistories[historyKey][0], // Keep system message
        ...conversationHistories[historyKey].slice(-10) // Keep last 10 exchanges
      ];
    }
    
    return response;
  } catch (error) {
    console.error(`Error running agent query for ${agentType}:`, error);
    return `Error getting response from ${agentConfig[agentType].name}. Please try again later.`;
  }
}

/**
 * Router function to determine which agent(s) should handle a query
 */
export async function routeQuery(query: string, userId: string = 'default'): Promise<AgentType[]> {
  try {
    const routerResponse = await runAgentQuery(AgentType.ROUTER, query, userId);
    
    // Parse the router's response to determine which agents to use
    const agents: AgentType[] = [];
    
    if (routerResponse.toLowerCase().includes('market analysis')) {
      agents.push(AgentType.MARKET_ANALYSIS);
    }
    
    if (routerResponse.toLowerCase().includes('investment advice')) {
      agents.push(AgentType.INVESTMENT_ADVICE);
    }
    
    if (routerResponse.toLowerCase().includes('tax planning')) {
      agents.push(AgentType.TAX_PLANNING);
    }
    
    if (routerResponse.toLowerCase().includes('retirement planning')) {
      agents.push(AgentType.RETIREMENT_PLANNING);
    }
    
    // If no specific agent is identified, default to investment advice
    if (agents.length === 0) {
      agents.push(AgentType.INVESTMENT_ADVICE);
    }
    
    return agents;
  } catch (error) {
    console.error('Error routing query:', error);
    // Default to investment advice if routing fails
    return [AgentType.INVESTMENT_ADVICE];
  }
}

/**
 * Main function to process a user query through the multi-agent system
 */
export async function processQuery(interaction: UserInteraction, userId: string = 'default'): Promise<AgentResponse[]> {
  const { query, context } = interaction;
  try {
    // Step 1: Route the query to determine which agents to use
    const agentTypes = await routeQuery(query, userId);
    // Step 2: Run the query through each identified agent
    const agentResponses: AgentResponse[] = [];
    for (const agentType of agentTypes) {
      const response = await runAgentQuery(agentType, query, userId, context);
      agentResponses.push({
        agentType,
        content: response
      });
    }
    // Step 3: If there's only one agent response, return it as an array
    if (agentResponses.length === 1) {
      return agentResponses;
    }
    // Step 4: Otherwise, use the consultant agent to synthesize the responses
    const consultantPrompt = `
I need to synthesize responses from multiple specialized financial agents to answer the following user query:
"${query}"
Here are the responses from each specialized agent:
${agentResponses.map(r => `## ${agentConfig[r.agentType].name}\n${r.content}\n`).join('\n\n')}
Please synthesize these perspectives into a cohesive, well-structured response that addresses the user's query.`;
    const synthesizedResponse = await runAgentQuery(
      AgentType.CONSULTANT,
      consultantPrompt,
      userId
    );
    // Add the consultant's synthesized response as a separate agent message
    agentResponses.push({
      agentType: AgentType.CONSULTANT,
      content: synthesizedResponse
    });
    return agentResponses;
  } catch (error) {
    console.error('Error processing multi-agent query:', error);
    return [{ agentType: AgentType.CONSULTANT, content: 'Sorry, there was an error processing your request.' }];
  }
}

/**
 * Clear conversation history for a user
 */
export function clearConversationHistory(userId: string = 'default'): void {
  // Find and remove all conversation histories for this user
  Object.keys(conversationHistories).forEach(key => {
    if (key.startsWith(`${userId}_`)) {
      delete conversationHistories[key];
    }
  });
}