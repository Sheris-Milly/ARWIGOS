/**
 * Multi-Agent System Implementation
 * This module builds and manages the multi-agent financial advisory system.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Tool } from '@langchain/core/tools';
import { AgentExecutor } from 'langchain/agents';
import { createReactAgent } from 'langchain/agents';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { getAgentDefinition, getAgentRoutingMap } from '../models/agents.js';
import { settings } from '../config/settings.js';
import * as tools from './tools.js';

// Multi prompt router template
const MULTI_PROMPT_ROUTER_TEMPLATE = `
You are a routing agent for the Financial Advisory System.
Based on user's query, route them to the most appropriate specialized agent.

QUERY: {input}

AVAILABLE AGENTS:
{destinations}

INSTRUCTIONS:
1. Read the user query carefully.
2. Identify the primary financial topic or need.
3. Select the most appropriate agent from the list above.
4. If multiple agents could help, choose the most specialized for the main query.
5. For general financial questions with no clear category, route to 'general'.

Your answer should be the name of exactly one agent from the list, such as 'market_analyst' or 'tax_planner'.
`;

/**
 * Router Output Parser for agent routing
 */
class RouterOutputParser {
  parse(text) {
    // Extract the agent name from the text
    const cleanedText = text.trim().toLowerCase();
    const validAgents = Object.keys(getAgentRoutingMap());
    
    // Look for exact matches first
    for (const agent of validAgents) {
      if (cleanedText === agent) {
        return { destination: agent, next_inputs: { input: "input" } };
      }
    }
    
    // Look for partial matches
    for (const agent of validAgents) {
      if (cleanedText.includes(agent)) {
        return { destination: agent, next_inputs: { input: "input" } };
      }
    }
    
    // Default to general if no match is found
    return { destination: "general", next_inputs: { input: "input" } };
  }
}

/**
 * Create a tool for the agent system
 */
function makeTool(name, func, desc) {
  return new Tool({
    name: name,
    description: desc,
    func: func
  });
}

/**
 * Build the agent executors for the system
 */
export function buildAgents() {
  const tools = {
    "NewsSearch": makeTool("NewsSearch", tools.searchFinancialNews, "Fetch financial news"),
    "PriceCheck": makeTool("PriceCheck", tools.getStockPrice, "Get stock price"),
    "AnalyzePortfolio": makeTool("AnalyzePortfolio", tools.analyzePortfolio, "Analyze your portfolio"),
    "CreatePlan": makeTool("CreatePlan", tools.createFinancialPlan, "Generate a financial plan"),
    "RiskAssessment": makeTool("RiskAssessment", tools.assessRisk, "Assess portfolio risk"),
    "PerformanceChart": makeTool("PerformanceChart", tools.generatePerformanceChart, "Generate performance chart"),
  };

  const prompts = {
    "Market": "You are a Market Analyst. Use NewsSearch and PriceCheck.",
    "Portfolio": "You are a Portfolio Manager. Use AnalyzePortfolio, RiskAssessment, PerformanceChart.",
    "Planner": "You are a Financial Planner. Use CreatePlan.",
    "General": "You are a General Finance Advisor. You may use any tool."
  };

  const destinations = {
    "Market": ["NewsSearch", "PriceCheck"],
    "Portfolio": ["AnalyzePortfolio", "RiskAssessment", "PerformanceChart"],
    "Planner": ["CreatePlan"],
    "General": Object.keys(tools),
  };

  const chains = {};
  for (const [name, keys] of Object.entries(destinations)) {
    const selectedTools = keys.map(k => tools[k]);
    const memory = new BufferMemory({ memoryKey: "chat_history", returnMessages: true });
    
    const promptStr = `${prompts[name]}\n\n
      You have access to the following tools:\n{tools}\n\n
      To use a tool:\n
      \`\`\`\n
      Thought: Do I need to use a tool? Yes\n
      Action: one of [{tool_names}]\n
      Action Input: <input>\n
      Observation: <r>\n
      \`\`\`\n
      Or if no tool needed:\n
      \`\`\`\n
      Thought: Do I need to use a tool? No\n
      Final Answer: <your answer>\n
      \`\`\`\n\n
      History:\n{chat_history}\n
      Human: {input}\n
      Thought:{agent_scratchpad}`;
    
    const prompt = PromptTemplate.fromTemplate(promptStr);
    
    const llm = new ChatGoogleGenerativeAI({
      modelName: settings.GEMINI_MODEL,
      apiKey: settings.DEFAULT_GOOGLE_API_KEY,
      temperature: 0.2,
      convertSystemMessageToHuman: true
    });
    
    const agent = createReactAgent({
      llm: llm,
      tools: selectedTools,
      prompt: prompt
    });
    
    chains[name] = new AgentExecutor({
      agent: agent,
      tools: selectedTools,
      memory: memory,
      verbose: true
    });
  }
  
  return chains;
}

/**
 * Create an LLM for a specific user
 */
// Create a simple mock LLM for development purposes
class MockLLM {
  constructor(options = {}) {
    this.options = options;
    console.log('Using Mock LLM for development');
  }
  
  async invoke(input) {
    console.log('Mock LLM received input:', input);
    // Return a mock response based on the input
    return { text: this.generateResponse(input) };
  }
  
  generateResponse(input) {
    const query = input.input?.toLowerCase() || '';
    
    // Generate basic responses based on keywords in the query
    if (query.includes('portfolio') || query.includes('investment')) {
      return 'portfolio_manager';
    } else if (query.includes('market') || query.includes('stock') || query.includes('price')) {
      return 'market_analyst';
    } else if (query.includes('tax') || query.includes('taxes')) {
      return 'tax_planner';
    } else if (query.includes('retire') || query.includes('retirement')) {
      return 'retirement_advisor';
    } else {
      return 'general';
    }
  }
}

export function createUserLlm(googleApiKey) {
  try {
    // For development mode, use the mock LLM
    if (process.env.NODE_ENV === 'development' || !googleApiKey) {
      return new MockLLM();
    }
    
    // For production, try to use the real LLM
    const apiKey = googleApiKey || settings.DEFAULT_GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.warn('No API key available, falling back to mock LLM');
      return new MockLLM();
    }
    
    // Create the real LLM
    try {
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        modelName: settings.GEMINI_MODEL || "gemini-1.5-pro",
        temperature: 0.2
      });
    } catch (error) {
      console.error('Error creating real LLM:', error);
      return new MockLLM();
    }
  } catch (err) {
    console.error('Error in createUserLlm:', err);
    return new MockLLM();
  }
}

/**
 * Build agent executors for a specific user with their API keys
 */
// Create a simplified agent system for development
class MockAgentExecutor {
  constructor(agentName, agentDef, tools) {
    this.agentName = agentName;
    this.agentDef = agentDef;
    this.tools = tools;
    console.log(`Created mock agent: ${agentName}`);
  }
  
  async invoke({ input, chat_history = [] }) {
    console.log(`MockAgent ${this.agentName} received message: ${input}`);
    
    // Generate a response based on the agent type
    let response;
    
    try {
      // Check if we should use any tools
      const toolToUse = this.findRelevantTool(input);
      
      if (toolToUse) {
        console.log(`Using tool: ${toolToUse.name}`);
        try {
          // Try to use the tool
          const toolResult = await toolToUse.func(input);
          response = this.formatToolResponse(toolToUse.name, toolResult);
        } catch (error) {
          console.error(`Error using tool ${toolToUse.name}:`, error);
          response = "I tried to access some financial information for you, but ran into a technical issue. Can you try asking a different question?"; 
        }
      } else {
        // Generate a mock response based on agent type
        response = this.generateMockResponse(input, this.agentName);
      }
    } catch (error) {
      console.error(`Error in mock agent ${this.agentName}:`, error);
      response = "I'm having trouble processing your request right now. Could you try a different question?";
    }
    
    return { output: response };
  }
  
  findRelevantTool(query) {
    if (!this.tools || this.tools.length === 0) return null;
    
    const lowerQuery = query.toLowerCase();
    
    // Match query to specific tools
    if (lowerQuery.includes('news') || lowerQuery.includes('latest')) {
      return this.tools.find(t => t.name === 'NewsSearch');
    }
    
    if ((lowerQuery.includes('price') || lowerQuery.includes('stock')) && 
        (lowerQuery.includes('check') || lowerQuery.match(/\$[A-Z]+/) || lowerQuery.match(/[A-Z]{2,5}/))) {
      return this.tools.find(t => t.name === 'PriceCheck');
    }
    
    if (lowerQuery.includes('portfolio') && (lowerQuery.includes('analyze') || lowerQuery.includes('analysis'))) {
      return this.tools.find(t => t.name === 'AnalyzePortfolio');
    }
    
    if (lowerQuery.includes('plan') || lowerQuery.includes('financial plan')) {
      return this.tools.find(t => t.name === 'CreatePlan');
    }
    
    if (lowerQuery.includes('risk') || lowerQuery.includes('assessment')) {
      return this.tools.find(t => t.name === 'RiskAssessment');
    }
    
    if (lowerQuery.includes('chart') || lowerQuery.includes('graph') || lowerQuery.includes('performance')) {
      return this.tools.find(t => t.name === 'PerformanceChart');
    }
    
    return null;
  }
  
  formatToolResponse(toolName, result) {
    if (typeof result === 'string') return result;
    
    try {
      if (toolName === 'NewsSearch') {
        return `Here are some recent financial news items I found:\n\n${JSON.stringify(result, null, 2)}`;
      }
      if (toolName === 'PriceCheck') {
        return `The current price information:\n\n${JSON.stringify(result, null, 2)}`;
      }
      
      return `Here's what I found:\n\n${JSON.stringify(result, null, 2)}`;
    } catch (e) {
      return "I found some information but couldn't format it properly. Could you ask a different question?";
    }
  }
  
  generateMockResponse(query, agentType) {
    const lowerQuery = query.toLowerCase();
    
    // Generic responses based on agent type
    switch (agentType) {
      case 'market_analyst':
        return "Based on current market conditions, it appears that the major indices are showing mixed signals. The technology and healthcare sectors are currently outperforming, while energy stocks have been more volatile. I recommend monitoring these trends and considering your risk tolerance before making any investment decisions.";
        
      case 'portfolio_manager':
        return "After analyzing your portfolio, I can see a good mix of assets but there may be room for further diversification. Your current allocation is approximately 60% equities, 30% fixed income, and 10% alternatives. This is a fairly balanced approach, though depending on your goals we might want to adjust these percentages.";
        
      case 'tax_planner':
        return "From a tax perspective, there are several strategies you could consider. Tax-loss harvesting might be beneficial before year-end, and you should also review your retirement contributions to ensure you're maximizing tax-advantaged accounts. I'd be happy to discuss specific tax optimization strategies tailored to your situation.";
        
      case 'retirement_advisor':
        return "Based on your current savings rate and portfolio composition, you appear to be on track for your retirement goals. I would recommend reviewing your withdrawal strategy to ensure it's tax-efficient and sustainable through your retirement years. We should also discuss inflation protection strategies.";
        
      case 'general':
      default:
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
          return "Hello! I'm your financial advisor. How can I help you with your financial questions today?";
        } else if (lowerQuery.includes('help')) {
          return "I can help with market analysis, portfolio management, tax planning, retirement strategies, and general financial advice. What specific area would you like assistance with?";
        } else {
          return "That's an interesting financial question. To provide you with the most helpful advice, I'd need to understand more about your specific financial situation and goals. Could you provide more details about what you're trying to achieve?";
        }
    }
  }
}

// Simplified router for development
class MockRouter {
  constructor() {
    console.log('Created mock router');
  }
  
  async invoke(input) {
    console.log('Mock router received input:', input.input);
    const query = input.input.toLowerCase();
    
    // Basic keyword routing
    let destination = 'general';
    
    if (query.includes('market') || query.includes('stock') || query.includes('price') || 
        query.includes('trend') || query.includes('index')) {
      destination = 'market_analyst';
    } else if (query.includes('portfolio') || query.includes('investment') || 
               query.includes('asset') || query.includes('allocate')) {
      destination = 'portfolio_manager';
    } else if (query.includes('tax') || query.includes('deduction') || 
               query.includes('ira') || query.includes('401k')) {
      destination = 'tax_planner';
    } else if (query.includes('retire') || query.includes('pension') || 
               query.includes('social security')) {
      destination = 'retirement_advisor';
    }
    
    console.log(`Mock router selected: ${destination}`);
    
    return {
      destination: destination,
      next_inputs: { input: input.input }
    };
  }
}

export function buildUserAgents(user) {
  console.log('Building mock agent system for development');
  
  // Get available agent definitions
  const agentDefinitions = Object.keys(getAgentRoutingMap())
    .map(name => ({ name, ...getAgentDefinition(name) }));
  
  // Create tool instances
  const toolsList = [
    makeTool("NewsSearch", 
      (q) => tools.searchFinancialNews(q, user.alphaVantageKey),
      "Search for recent financial news and market updates"),
    makeTool("PriceCheck", 
      tools.getStockPrice,
      "Get the current price of a stock by ticker symbol"),
    makeTool("AnalyzePortfolio", 
      () => tools.analyzePortfolio(user.id),
      "Analyze the user's investment portfolio for performance and allocation"),
    makeTool("CreatePlan", 
      () => tools.createFinancialPlan(user.id),
      "Create a personalized financial plan based on the user's goals"),
    makeTool("RiskAssessment", 
      () => tools.assessRisk(user.id),
      "Assess investment risk level of the user's portfolio"),
    makeTool("PerformanceChart", 
      () => tools.generatePerformanceChart(user.id),
      "Generate a visual chart showing portfolio performance over time")
  ];
  
  // Create mock agents
  const destinations = {};
  for (const agentDef of agentDefinitions) {
    const agentTools = toolsList.filter(tool => agentDef.tools.includes(tool.name));
    destinations[agentDef.name] = new MockAgentExecutor(agentDef.name, agentDef, agentTools);
  }
  
  // Create router chain
  const routerChain = new MockRouter();
  
  return { destinations, routerChain };
}

export default { buildAgents, buildUserAgents, createUserLlm };
