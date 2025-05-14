"""
Financial Advisory System Agent Definitions
This module defines the agents used in the advisory system, their properties, and capabilities.
"""

from enum import Enum
from typing import Dict, List, Optional

class AgentIcon(str, Enum):
    MARKET_ANALYST = "chart-bar"
    PORTFOLIO_MANAGER = "trending-up"
    FINANCIAL_ADVISOR = "piggy-bank"
    TAX_PLANNER = "landmark"
    RETIREMENT_PLANNER = "hourglass"
    GENERAL = "brain"
    ERROR = "alert-circle"
    DEFAULT = "bot"

class AgentColor(str, Enum):
    MARKET_ANALYST = "#10b981"    # Green
    PORTFOLIO_MANAGER = "#3b82f6"  # Blue
    FINANCIAL_ADVISOR = "#8b5cf6"  # Purple
    TAX_PLANNER = "#f59e0b"       # Amber
    RETIREMENT_PLANNER = "#ec4899" # Pink
    GENERAL = "#6b7280"           # Gray
    ERROR = "#ef4444"             # Red
    DEFAULT = "#64748b"           # Slate

class AgentDefinition:
    """Definition of an agent in the advisory system"""
    def __init__(
        self, 
        name: str,
        display_name: str,
        description: str,
        tools: List[str],
        icon: AgentIcon,
        color: AgentColor,
        instructions: str
    ):
        self.name = name
        self.display_name = display_name
        self.description = description
        self.tools = tools
        self.icon = icon
        self.color = color
        self.instructions = instructions

# Define all available agents
AGENT_DEFINITIONS = {
    "market_analyst": AgentDefinition(
        name="market_analyst",
        display_name="Market Analyst",
        description="Provides market trends, financial news, and stock performance analysis",
        tools=["NewsSearch", "PriceCheck"],
        icon=AgentIcon.MARKET_ANALYST,
        color=AgentColor.MARKET_ANALYST,
        instructions=(
            "You are a Market Analyst specializing in financial markets and economic trends. "
            "Use data from financial news and stock prices to provide insightful analysis. "
            "Focus on explaining market movements, industry trends, and how economic events "
            "might impact investments. Be precise with data but explain concepts clearly."
        )
    ),
    
    "portfolio_manager": AgentDefinition(
        name="portfolio_manager",
        display_name="Portfolio Manager",
        description="Analyzes investment portfolios, asset allocation, and risk management",
        tools=["AnalyzePortfolio", "RiskAssessment", "PerformanceChart"],
        icon=AgentIcon.PORTFOLIO_MANAGER,
        color=AgentColor.PORTFOLIO_MANAGER,
        instructions=(
            "You are a Portfolio Manager with expertise in investment allocation and risk management. "
            "Analyze portfolio performance, suggest rebalancing strategies, and provide guidance on "
            "diversification. Use portfolio analysis tools to give data-driven recommendations while "
            "considering the user's risk tolerance and investment goals."
        )
    ),
    
    "financial_advisor": AgentDefinition(
        name="financial_advisor",
        display_name="Financial Advisor",
        description="Provides personalized financial planning and investment advice",
        tools=["CreatePlan", "AnalyzePortfolio", "RiskAssessment"],
        icon=AgentIcon.FINANCIAL_ADVISOR,
        color=AgentColor.FINANCIAL_ADVISOR,
        instructions=(
            "You are a Financial Advisor who provides holistic financial guidance. "
            "Help users create comprehensive financial plans, taking into account their "
            "goals, current financial situation, and risk tolerance. Provide actionable advice "
            "on savings, investments, debt management, and long-term financial planning."
        )
    ),
    
    "tax_planner": AgentDefinition(
        name="tax_planner",
        display_name="Tax Strategist",
        description="Advises on tax-efficient investment strategies and planning",
        tools=["AnalyzePortfolio", "CreatePlan"],
        icon=AgentIcon.TAX_PLANNER,
        color=AgentColor.TAX_PLANNER,
        instructions=(
            "You are a Tax Strategist specializing in tax-efficient investment and financial planning. "
            "Help users understand tax implications of various investment choices, suggest tax-advantaged "
            "accounts, and discuss tax minimization strategies. Focus on legal tax optimization while "
            "being clear that you're providing educational information, not official tax advice."
        )
    ),
    
    "retirement_planner": AgentDefinition(
        name="retirement_planner",
        display_name="Retirement Planning",
        description="Specializes in retirement planning and long-term financial security",
        tools=["CreatePlan", "AnalyzePortfolio"],
        icon=AgentIcon.RETIREMENT_PLANNER,
        color=AgentColor.RETIREMENT_PLANNER,
        instructions=(
            "You are a Retirement Planning Specialist focused on helping users prepare for retirement. "
            "Discuss retirement savings strategies, pension options, withdrawal strategies, and how to "
            "create sustainable income in retirement. Consider factors like life expectancy, inflation, "
            "healthcare costs, and desired retirement lifestyle in your recommendations."
        )
    ),
    
    "general": AgentDefinition(
        name="general",
        display_name="Financial Assistant",
        description="General financial information and guidance on various topics",
        tools=["NewsSearch", "PriceCheck", "AnalyzePortfolio", "CreatePlan"],
        icon=AgentIcon.GENERAL,
        color=AgentColor.GENERAL,
        instructions=(
            "You are a General Financial Assistant who can provide broad information on various "
            "financial topics. Answer questions about basic financial concepts, current events, "
            "and provide general guidance. When questions require specialized expertise, indicate "
            "which type of financial professional would be best suited to provide detailed advice."
        )
    ),
}

# Error agent for fallback situations
ERROR_AGENT = AgentDefinition(
    name="error",
    display_name="Error Recovery",
    description="Handles error situations and provides guidance on next steps",
    tools=[],
    icon=AgentIcon.ERROR,
    color=AgentColor.ERROR,
    instructions=(
        "You are an Error Recovery assistant. Explain the error that occurred in simple terms, "
        "suggest possible solutions or workarounds, and guide the user on what to try next."
    )
)

# Default agent when no specific agent is identified
DEFAULT_AGENT = AgentDefinition(
    name="default",
    display_name="AI Advisor",
    description="General AI assistant for financial topics",
    tools=[],
    icon=AgentIcon.DEFAULT,
    color=AgentColor.DEFAULT,
    instructions=(
        "You are an AI Financial Assistant. Provide helpful, accurate information on financial topics. "
        "Direct users to appropriate specialized agents for more detailed assistance."
    )
)

def get_agent_definition(agent_name: str) -> AgentDefinition:
    """Get the agent definition by name, with fallback to default"""
    if agent_name in AGENT_DEFINITIONS:
        return AGENT_DEFINITIONS[agent_name]
    elif agent_name == "error":
        return ERROR_AGENT
    else:
        return DEFAULT_AGENT

def get_agent_routing_map() -> Dict[str, str]:
    """Get a map of agent names to their descriptions for routing purposes"""
    return {
        name: f"{agent.display_name}: {agent.description}" 
        for name, agent in AGENT_DEFINITIONS.items()
    }

def generate_conversation_title(user_message: str) -> str:
    """Generate a title for a new conversation based on the first message"""
    # Create a title with max 50 characters
    if not user_message:
        return "New Financial Conversation"
    
    # Use the first 50 characters of the message
    if len(user_message) <= 50:
        return user_message
    
    # Otherwise, use the first 47 characters and add "..."
    return user_message[:47] + "..."
