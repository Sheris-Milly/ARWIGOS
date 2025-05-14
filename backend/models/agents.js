/**
 * Financial Advisory System Agent Definitions
 * This module defines the agents used in the advisory system, their properties, and capabilities.
 */

// Define agent icons
export const AgentIcon = {
  MARKET_ANALYST: "chart-bar",
  PORTFOLIO_MANAGER: "trending-up",
  FINANCIAL_ADVISOR: "piggy-bank",
  TAX_PLANNER: "landmark",
  RETIREMENT_PLANNER: "hourglass",
  GENERAL: "brain",
  ERROR: "alert-circle",
  DEFAULT: "bot"
};

// Define agent colors
export const AgentColor = {
  MARKET_ANALYST: "#10b981",    // Green
  PORTFOLIO_MANAGER: "#3b82f6",  // Blue
  FINANCIAL_ADVISOR: "#8b5cf6",  // Purple
  TAX_PLANNER: "#f59e0b",       // Amber
  RETIREMENT_PLANNER: "#ec4899", // Pink
  GENERAL: "#6b7280",           // Gray
  ERROR: "#ef4444",             // Red
  DEFAULT: "#64748b"            // Slate
};

// Define agent class
class AgentDefinition {
  /**
   * Definition of an agent in the advisory system
   */
  constructor(
    name,
    displayName,
    description,
    tools,
    icon,
    color,
    instructions
  ) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.tools = tools;
    this.icon = icon;
    this.color = color;
    this.instructions = instructions;
  }
}

// Define all available agents
export const AGENT_DEFINITIONS = {
  market_analyst: new AgentDefinition(
    "market_analyst",
    "Market Analyst",
    "Provides market trends, financial news, and stock performance analysis",
    ["NewsSearch", "PriceCheck"],
    AgentIcon.MARKET_ANALYST,
    AgentColor.MARKET_ANALYST,
    `You are a Market Analyst specializing in financial markets and economic trends. 
    Use data from financial news and stock prices to provide insightful analysis. 
    Focus on explaining market movements, industry trends, and how economic events 
    might impact investments. Be precise with data but explain concepts clearly.`
  ),
  
  portfolio_manager: new AgentDefinition(
    "portfolio_manager",
    "Portfolio Manager",
    "Analyzes investment portfolios, asset allocation, and risk management",
    ["AnalyzePortfolio", "RiskAssessment", "PerformanceChart"],
    AgentIcon.PORTFOLIO_MANAGER,
    AgentColor.PORTFOLIO_MANAGER,
    `You are a Portfolio Manager with expertise in investment allocation and risk management. 
    Analyze portfolio performance, suggest rebalancing strategies, and provide guidance on 
    diversification. Use portfolio analysis tools to give data-driven recommendations while 
    considering the user's risk tolerance and investment goals.`
  ),
  
  financial_advisor: new AgentDefinition(
    "financial_advisor",
    "Financial Advisor",
    "Provides personalized financial planning and investment advice",
    ["CreatePlan", "AnalyzePortfolio", "RiskAssessment"],
    AgentIcon.FINANCIAL_ADVISOR,
    AgentColor.FINANCIAL_ADVISOR,
    `You are a Financial Advisor who provides holistic financial guidance. 
    Help users create comprehensive financial plans, taking into account their 
    goals, current financial situation, and risk tolerance. Provide actionable advice 
    on savings, investments, debt management, and long-term financial planning.`
  ),
  
  tax_planner: new AgentDefinition(
    "tax_planner",
    "Tax Strategist",
    "Advises on tax-efficient investment strategies and planning",
    ["AnalyzePortfolio", "CreatePlan"],
    AgentIcon.TAX_PLANNER,
    AgentColor.TAX_PLANNER,
    `You are a Tax Strategist specializing in tax-efficient investment and financial planning. 
    Help users understand tax implications of various investment choices, suggest tax-advantaged 
    accounts, and discuss tax minimization strategies. Focus on legal tax optimization while 
    being clear that you're providing educational information, not official tax advice.`
  ),
  
  retirement_planner: new AgentDefinition(
    "retirement_planner",
    "Retirement Planning",
    "Specializes in retirement planning and long-term financial security",
    ["CreatePlan", "AnalyzePortfolio"],
    AgentIcon.RETIREMENT_PLANNER,
    AgentColor.RETIREMENT_PLANNER,
    `You are a Retirement Planning Specialist focused on helping users prepare for retirement. 
    Discuss retirement savings strategies, pension options, withdrawal strategies, and how to 
    create sustainable income in retirement. Consider factors like life expectancy, inflation, 
    healthcare costs, and desired retirement lifestyle in your recommendations.`
  ),
  
  general: new AgentDefinition(
    "general",
    "Financial Assistant",
    "General financial information and guidance on various topics",
    ["NewsSearch", "PriceCheck", "AnalyzePortfolio", "CreatePlan"],
    AgentIcon.GENERAL,
    AgentColor.GENERAL,
    `You are a General Financial Assistant who can provide broad information on various 
    financial topics. Answer questions about basic financial concepts, current events, 
    and provide general guidance. When questions require specialized expertise, indicate 
    which type of financial professional would be best suited to provide detailed advice.`
  ),
};

// Error agent for fallback situations
export const ERROR_AGENT = new AgentDefinition(
  "error",
  "Error Recovery",
  "Handles error situations and provides guidance on next steps",
  [],
  AgentIcon.ERROR,
  AgentColor.ERROR,
  `You are an Error Recovery assistant. Explain the error that occurred in simple terms, 
  suggest possible solutions or workarounds, and guide the user on what to try next.`
);

// Default agent when no specific agent is identified
export const DEFAULT_AGENT = new AgentDefinition(
  "default",
  "AI Advisor",
  "General AI assistant for financial topics",
  [],
  AgentIcon.DEFAULT,
  AgentColor.DEFAULT,
  `You are an AI Financial Assistant. Provide helpful, accurate information on financial topics. 
  Direct users to appropriate specialized agents for more detailed assistance.`
);

/**
 * Get the agent definition by name, with fallback to default
 */
export function getAgentDefinition(agentName) {
  if (agentName in AGENT_DEFINITIONS) {
    return AGENT_DEFINITIONS[agentName];
  } else if (agentName === "error") {
    return ERROR_AGENT;
  } else {
    return DEFAULT_AGENT;
  }
}

/**
 * Get a map of agent names to their descriptions for routing purposes
 */
export function getAgentRoutingMap() {
  const map = {};
  for (const [name, agent] of Object.entries(AGENT_DEFINITIONS)) {
    map[name] = `${agent.displayName}: ${agent.description}`;
  }
  return map;
}

/**
 * Generate a title for a new conversation based on the first message
 */
export function generateConversationTitle(userMessage) {
  if (!userMessage) {
    return "New Financial Conversation";
  }
  
  // Use the first 50 characters of the message
  if (userMessage.length <= 50) {
    return userMessage;
  }
  
  // Otherwise, use the first 47 characters and add "..."
  return userMessage.substring(0, 47) + "...";
}
